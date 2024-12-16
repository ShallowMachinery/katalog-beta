import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './MenuBar.css';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faTimes, faCog, faSignInAlt, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import packageJson from '../../package.json';
import { checkSession } from './SessionChecker';
import { ThemeContext } from '../ThemeContext';

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
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [userData, setUserData] = useState(null);
    const { isDarkTheme, toggleTheme } = useContext(ThemeContext);

    useEffect(() => {
        document.body.classList.toggle('dark-theme', isDarkTheme);
    }, [isDarkTheme]);

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
        if (sessionData.isLoggedIn) {
            const fetchUserInfo = async () => {
                try {
                    const userToken = localStorage.getItem('access_token');
                    const response = await axios.get(`/backend/user-info.php`, {
                        headers: {
                            'Authorization': `Bearer ${userToken}`,
                        },
                        params: {
                            username: sessionData.username,
                        },
                    });
                    const userInfo = response.data;
                    setUserData(userInfo.userInfo);
                } catch (error) {
                    console.error('Error fetching user info or data:', error);
                }
            };
            fetchUserInfo();
        }
    }, [sessionData.isLoggedIn, sessionData.username]);

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
        setIsSearchActive(false);
        setSearchTerm('');
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
        const isDarkTheme = localStorage.getItem('isDarkTheme');
        localStorage.clear();
        if (isDarkTheme) {
            localStorage.setItem('isDarkTheme', isDarkTheme);
        }
        navigate('/home');
        window.location.reload();
    };

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length >= 3) {
            try {
                const response = await axios.get(`/backend/search.php`, {
                    params: { term: value }
                });
                setShowOverlaySearch(true);
                console.log(response);

                const sortedTracks = response.data.tracks.sort((a, b) => b.score - a.score);

                setSearchResults({
                    artists: response.data.artists || [],
                    albums: response.data.albums || [],
                    tracks: sortedTracks,
                    lyrics: response.data.lyrics || [],
                });
                setSelectedFilter('all');
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
            <div className="menu-left-div">
                {!isSearchActive && (<h1>
                    <a href='/home'>Katalog {isMobile ? <small>beta</small> : <small>v{packageJson.version}-beta</small>}</a>
                </h1>)}
            </div>
            <div className="menu-center-div">

            </div>
            <div className="menu-right-div">
                {isMobile && !isSearchActive ? (
                    <button onClick={handleSearchButtonClick} className="search-button"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                ) : (
                    <div className="search-input-container">
                        <input
                            type="text"
                            placeholder={isMobile ? "Search..." : "Search for an artist, album, track, or lyrics..."}
                            value={searchTerm}
                            onClick={() => {
                                if (searchTerm.length > 4) {
                                    setShowOverlaySearch(true);
                                }
                            }}
                            onChange={handleSearch}
                            onBlur={handleSearchBlur}
                            className={`search-input ${isMobile && isSearchActive ? 'active' : ''}`}
                        />
                        {isSearchActive && (<button className="close-button" onClick={handleCloseSearch}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>)}
                    </div>
                )}
                {!isSearchActive && (
                    <div className="menu-links">
                        {sessionData.isLoggedIn ? (
                            <>
                                <span className="profile-menu" onClick={handleMenuLinksClick}>
                                    {sessionData.isLoggedIn ? <FontAwesomeIcon icon={faCog} /> : "Log in"}
                                </span>
                                {showMenuLinks && (
                                    <div ref={menuLinksRef} className="overlay-container">
                                        <ul>
                                            {userData && (
                                                <a href={`/user/${userData.user_name}`} className="profile-link">
                                                    <li>
                                                        <div className="profile-item">
                                                            <img src={userData.user_picture_url && userData.user_picture_url.trim() !== ''
                                                                ? userData.user_picture_url
                                                                : '/assets_public/default_user.png'} alt={userData.user_name} className="profile-picture" loading="lazy" />
                                                            <div className="profile-info">
                                                                {userData.user_name}
                                                            </div>
                                                        </div>
                                                    </li>
                                                </a>
                                            )}
                                            <hr></hr>
                                            <li onClick={toggleTheme}>
                                                {isDarkTheme ? 'Dark mode enabled' : 'Dark mode disabled'}
                                            </li>
                                            <li className="logout-li" onClick={handleLogout}>Log out</li>
                                        </ul>
                                    </div>
                                )}
                            </>
                        ) : (<div className="not-logged-in-links">
                            <span className="link"><Link to="/login" style={{ textDecoration: "none", color: "#fff" }}><FontAwesomeIcon icon={faSignInAlt} /></Link></span>
                            <span className="link" onClick={toggleTheme} style={{ cursor: "pointer" }}><FontAwesomeIcon icon={isDarkTheme ? faSun : faMoon} /></span>
                        </div>)}
                    </div>
                )}
            </div>
            {showOverlaySearch && (
                <div ref={searchResultsRef} className="search-overlay" onClick={handleClickOutside}>
                    <div className="overlay-content">
                        <div className="filter-buttons">
                            {(searchResults.artists.length > 0 ||
                                searchResults.albums.length > 0 ||
                                searchResults.tracks.length > 0 ||
                                searchResults.lyrics.length > 0) && (<button
                                    className={`filter-button ${selectedFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => { setSelectedFilter('all'); if (isMobile) setIsSearchActive(true); }}
                                >
                                    All
                                </button>)
                            }
                            {searchResults.tracks.length > 0 &&
                                (<button
                                    className={`filter-button ${selectedFilter === 'tracks' ? 'active' : ''}`}
                                    onClick={() => { setSelectedFilter('tracks'); if (isMobile) setIsSearchActive(true); }}
                                >
                                    Tracks
                                </button>)
                            }
                            {searchResults.artists.length > 0 &&
                                (<button
                                    className={`filter-button ${selectedFilter === 'artists' ? 'active' : ''}`}
                                    onClick={() => { setSelectedFilter('artists'); if (isMobile) setIsSearchActive(true); }}
                                >
                                    Artists
                                </button>)
                            }
                            {searchResults.albums.length > 0 &&
                                (<button
                                    className={`filter-button ${selectedFilter === 'albums' ? 'active' : ''}`}
                                    onClick={() => { setSelectedFilter('albums'); if (isMobile) setIsSearchActive(true); }}
                                >
                                    Albums
                                </button>)
                            }
                            {searchResults.lyrics.length > 0 &&
                                (<button
                                    className={`filter-button ${selectedFilter === 'lyrics' ? 'active' : ''}`}
                                    onClick={() => { setSelectedFilter('lyrics'); if (isMobile) setIsSearchActive(true); }}
                                >
                                    Lyrics
                                </button>)
                            }
                        </div>
                        {(searchResults.artists.length > 0 ||
                            searchResults.albums.length > 0 ||
                            searchResults.tracks.length > 0 ||
                            searchResults.lyrics.length > 0) ? (
                            <div className="category-container">
                                {selectedFilter === 'all' || selectedFilter === 'tracks' ? (
                                    searchResults.tracks.length > 0 && (
                                        <div>
                                            <h2 className="search-results-title">Tracks</h2>
                                            <div className="search-results-list">
                                                {searchResults.tracks.map((track) => (
                                                    <div className="search-result-item">
                                                        <Link to={`/lyrics/${track.mainArtistVanity}/${track.trackVanity}`} style={{ textDecoration: 'none' }}>
                                                            <img
                                                                src={track.albumCoverUrl || '/assets_public/music-artist.svg'}
                                                                alt={track.albumName}
                                                                className="search-item-picture"
                                                            />
                                                            <div className="search-item-name">
                                                                <span>{track.trackName}</span>
                                                                <span>{track.mainArtistName}</span>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ) : null}
                                {selectedFilter === 'all' || selectedFilter === 'artists' ? (
                                    searchResults.artists.length > 0 && (
                                        <div>
                                            <h2 className="search-results-title">Artists</h2>
                                            <ul className="search-results-list">
                                                {searchResults.artists.map((artist) => (
                                                    <div key={artist.artistId} className="search-result-item">
                                                        <Link to={`/artist/${artist.artistVanity}`} style={{ textDecoration: 'none' }}>
                                                            <img
                                                                src={artist.artistPictureUrl || '/assets_public/person.svg'}
                                                                alt={artist.artistName}
                                                                className="search-item-picture"
                                                            />
                                                            <div className="search-item-name">
                                                                <span style={{ fontSize: "14px" }}>{artist.artistName}</span>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                ) : null}
                                {selectedFilter === 'all' || selectedFilter === 'albums' ? (
                                    searchResults.albums.length > 0 && (
                                        <div>
                                            <h2 className="search-results-title">Albums</h2>
                                            <ul className="search-results-list">
                                                {searchResults.albums.map((album) => (
                                                    <div key={album.albumId} className="search-result-item">
                                                        <Link to={`/album/${album.artistVanity}/${album.albumVanity}`} style={{ textDecoration: 'none' }}>
                                                            <img
                                                                src={album.coverUrl || '/assets_public/music-artist.svg'}
                                                                alt={album.albumName}
                                                                className="search-item-picture"
                                                            />
                                                            <div className="search-item-name">
                                                                <span>{album.albumName}</span>
                                                                <span>{album.artistName}</span>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                ) : null}
                                {selectedFilter === 'all' || selectedFilter === 'lyrics' ? (
                                    searchResults.lyrics.length > 0 && (
                                        <div>
                                            <h2 className="search-results-title">Lyrics</h2>
                                            <ul className="search-results-list">
                                                {searchResults.lyrics.map((lyric) => (
                                                    <div key={lyric.lyricId} className="search-result-item">
                                                        <Link to={`/lyrics/${lyric.mainArtistVanity}/${lyric.trackVanity}`} style={{ textDecoration: 'none' }}>
                                                            <img
                                                                src={lyric.albumCoverUrl || '/assets_public/music-artist.svg'}
                                                                alt={lyric.albumName}
                                                                className="search-item-picture"
                                                            />
                                                            <div className="search-item-name">
                                                                <span>{lyric.trackName}</span>
                                                                <span>{lyric.mainArtistName}</span>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                ) : null}
                            </div>
                        ) : (
                            <p className="no-results">No results found for this search query.</p>
                        )}
                    </div>
                </div>
            )}
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
