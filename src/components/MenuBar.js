import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './MenuBar.css';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTimes } from '@fortawesome/free-solid-svg-icons';
import packageJson from '../../package.json';
import { checkSession } from './SessionChecker';

function MenuBar() {
    const isMobile = window.innerWidth <= 768;
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showMenuLinks, setShowMenuLinks] = useState(false);
    const menuLinksRef = useRef(null);
    const searchResultsRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState({
        artists: [],
        albums: [],
        tracks: [],
        lyrics: [],
    });
    const [showOverlaySearch, setShowOverlaySearch] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [sessionData, setSessionData] = useState({ isLoggedIn: false, username: '' });

    const baseUrl = `${window.location.protocol}//${window.location.hostname}`;

    useEffect(() => {
        const fetchSession = async () => {
            const sessionExpired = await checkSession();
            if (sessionExpired === true) {
                setSessionData({ isLoggedIn: false, username: '' });
            } else {
                setSessionData({ isLoggedIn: true, username: localStorage.getItem('user_name') });
            }
        };
        fetchSession();
    }, []);

    useEffect(() => {
        setSearchTerm('');
        setSearchResults({ artists: [], albums: [], tracks: [], lyrics: [] });
        setShowOverlaySearch(false);
        setIsSearchActive(false);
    }, [location]);

    const handleMenuLinksClick = () => {
        setShowMenuLinks(prev => !prev);
    };

    const handleSearchButtonClick = () => {
        setIsSearchActive(true);
    };

    const handleSearchBlur = () => {
        setIsSearchActive(false);
    };

    const handleCloseSearch = () => {
        setIsSearchActive(false);  // Close the search and revert the layout
        setSearchTerm('');          // Optionally clear the search term
    };

    const handleClickOutside = (event) => {
        if (menuLinksRef.current && !menuLinksRef.current.contains(event.target)) {
            setShowMenuLinks(false);
        }
        if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
            setShowOverlaySearch(false);
        }
    };

    useEffect(() => {
        if (showMenuLinks || showOverlaySearch || isSearchActive) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenuLinks, showOverlaySearch, isSearchActive]);

    const handleLogout = () => {
        setIsModalOpen(true);
    };

    const confirmLogout = () => {
        localStorage.clear();
        navigate('/home');
        window.location.reload();
    };

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length >= 3) {
            try {
                const response = await axios.get(`${baseUrl}/katalog/beta/api/search.php`, {
                    params: { term: value }
                });
                setSearchResults({
                    artists: response.data.artists || [],
                    albums: response.data.albums || [],
                    tracks: response.data.tracks || [],
                    lyrics: response.data.lyrics || [],
                });
                setShowOverlaySearch(true);
            } catch (error) {
                console.error('Error fetching search results:', error);
                setSearchResults({ artists: [], albums: [], tracks: [], lyrics: [] });
            }
        } else {
            setSearchResults({ artists: [], albums: [], tracks: [], lyrics: [] });
            setShowOverlaySearch(false);
        }
    };

    return (
        <div className="menu-bar">
            {!isSearchActive && (<h1>
                <a href='/home'>Katalog {isMobile ? <small>beta</small> : <small>v{packageJson.version}-beta</small>}</a>
            </h1>)}

            {isMobile && !isSearchActive ? (
                <button onClick={handleSearchButtonClick} className="search-button"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
            ) : (
                <div className="search-input-container">
                    <input
                        type="text"
                        placeholder="Search for an artist, album, track, or lyrics..."
                        value={searchTerm}
                        onChange={handleSearch}
                        onBlur={handleSearchBlur} // Reset layout when input loses focus
                        className={`search-input ${isMobile && isSearchActive ? 'active' : ''}`}
                    />
                    <button className="close-button" onClick={handleCloseSearch}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            )}

            <div className="menu-right-side">
                {showOverlaySearch && (
                    (searchResults.artists.length > 0 ||
                        searchResults.albums.length > 0 ||
                        searchResults.tracks.length > 0 ||
                        searchResults.lyrics.length > 0) ? (
                        <div ref={searchResultsRef} className="overlay" onClick={handleClickOutside}>
                            <div className="overlay-content">
                                <div className="category-container">
                                    {searchResults.tracks.length > 0 && (
                                        <div>
                                            <h2 className="search-results-title">Tracks</h2>
                                            <ul className="search-results-list">
                                                {searchResults.tracks.map((track) => (
                                                    <li key={track.trackId} className="search-result-item">
                                                        <Link to={`/lyrics/${track.mainArtistVanity}/${track.trackVanity}`} style={{ textDecoration: 'none' }}>
                                                            <img
                                                                src={track.albumCoverUrl || '/assets_public/music-artist.svg'}
                                                                alt={track.albumName}
                                                                className="search-item-picture"
                                                            />
                                                            <span className="search-item-name">{track.trackName}<br />{track.mainArtistName}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {searchResults.artists.length > 0 && (
                                        <div>
                                            <h2 className="search-results-title">Artists</h2>
                                            <ul className="search-results-list">
                                                {searchResults.artists.map((artist) => (
                                                    <li key={artist.artistId} className="search-result-item">
                                                        <Link to={`/artist/${artist.artistVanity}`} style={{ textDecoration: 'none' }}>
                                                            <img
                                                                src={artist.artistPictureUrl || '/assets_public/person.svg'}
                                                                alt={artist.artistName}
                                                                className="search-item-picture"
                                                            />
                                                            <span className="search-item-name">{artist.artistName}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {searchResults.albums.length > 0 && (
                                        <div>
                                            <h2 className="search-results-title">Albums</h2>
                                            <ul className="search-results-list">
                                                {searchResults.albums.map((album) => (
                                                    <li key={album.albumId} className="search-result-item">
                                                        <Link to={`/album/${album.artistVanity}/${album.albumVanity}`} style={{ textDecoration: 'none' }}>
                                                            <img
                                                                src={album.coverUrl || '/assets_public/music-artist.svg'}
                                                                alt={album.albumName}
                                                                className="search-item-picture"
                                                            />
                                                            <span className="search-item-name">{album.albumName}<br />{album.artistName}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {searchResults.lyrics.length > 0 && (
                                        <div>
                                            <h2 className="search-results-title">Lyrics</h2>
                                            <ul className="search-results-list">
                                                {searchResults.lyrics.map((lyric) => (
                                                    <li key={lyric.lyricId} className="search-result-item">
                                                        <Link to={`/lyrics/${lyric.mainArtistVanity}/${lyric.trackVanity}`} style={{ textDecoration: 'none' }}>
                                                            <img
                                                                src={lyric.albumCoverUrl || '/assets_public/music-artist.svg'}
                                                                alt={lyric.albumName}
                                                                className="search-item-picture"
                                                            />
                                                            <span className="search-item-name">{lyric.trackName}<br />{lyric.mainArtistName}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (<div ref={searchResultsRef} className="overlay" onClick={handleClickOutside}>
                        <div className="overlay-content">
                            <p className="no-results">No results found for this search query.</p>
                        </div></div>
                    )
                )}

                {!isSearchActive && (
                        <div className="menu-links">
                            {sessionData.isLoggedIn ? (
                                <>
                                    <span className="profile-menu" onClick={handleMenuLinksClick}>{sessionData.isLoggedIn ? sessionData.username : "Log in"}</span>
                                    {showMenuLinks && (
                                        <div ref={menuLinksRef} className="overlay-container">
                                            <ul>
                                                <a href={`/user/${sessionData.username}`} className="profile-link">
                                                    <li>Profile</li>
                                                </a>
                                                <li onClick={handleLogout}>Logout</li>
                                            </ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className="links"><Link to="/login">Login</Link></span>
                            )}
                        </div>
                    )
                }
            </div >

            <Modal
                isOpen={isModalOpen}
                title="Confirm Logout"
                message="Are you sure you want to log out?"
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </div >
    );
}

export default MenuBar;
