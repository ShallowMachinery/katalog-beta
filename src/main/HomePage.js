import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import './HomePage.css'; // Add CSS for styling
import packageJson from '../../package.json';

function HomePage() {
    const [featuredArtists, setFeaturedArtists] = useState([]);
    const [recentContributions, setRecentContributions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState({
        artists: [],
        albums: [],
        tracks: [],
        lyrics: [],
    });
    const [page, setPage] = useState(0);
    const limit = 10;

    const userToken = localStorage.getItem('access_token');
    const isAdmin = localStorage.getItem('user_hierarchy') === '1';

    useEffect(() => {
        const fetchFeaturedArtists = async () => {
            try {
                const response = await axios.get('http://192.168.100.8/katalog/beta/api/featured-artists.php');
                console.log('Featured Artists API Response:', response.data); // Log the response

                // Check if the response contains the "artists" key and assign it to state
                if (response.data.artists) {
                    setFeaturedArtists(response.data.artists);
                } else {
                    console.error('Artists data is not in expected format:', response.data);
                }
            } catch (error) {
                console.error('Error fetching featured artists:', error);
            }
        };

        const fetchRecentContributions = async () => {
            try {
                const response = await axios.get('http://192.168.100.8/katalog/beta/api/recent-contributions.php', {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                });
                console.log('Recent Contributions API Response:', response.data);

                if (response.data.contributions) {
                    setRecentContributions(response.data.contributions);
                } else {
                    console.error('Contributions data is not in expected format:', response.data);
                }
            } catch (error) {
                console.error('Error fetching recent contributions:', error);
            }
        };

        fetchFeaturedArtists();
        fetchRecentContributions();
    }, []);

    const handleSearch = async (e) => {
        const value = e.target.value; // Trim whitespace
        setSearchTerm(value);

        // Only perform the search if the length is 4 or more
        if (value.length >= 2) {
            try {
                const response = await axios.get('http://192.168.100.8/katalog/beta/api/search.php', {
                    params: { term: value }
                });
                console.log('Search API Response:', response.data); // Log search results

                // Set separate states for each category
                setSearchResults({
                    artists: response.data.artists || [],
                    albums: response.data.albums || [],
                    tracks: response.data.tracks || [],
                    lyrics: response.data.lyrics || [],
                });
            } catch (error) {
                console.error('Error fetching search results:', error);
                setSearchResults({ artists: [], albums: [], tracks: [], lyrics: [] }); // Clear results on error
            }
        } else {
            setSearchResults({ artists: [], albums: [], tracks: [], lyrics: [] }); // Clear search results if less than 4 characters
        }
    };

    const handlePreviousPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    const handleNextPage = () => {
        setPage((prevPage) => (prevPage + 1) * limit < recentContributions.length ? prevPage + 1 : prevPage);
    };

    const displayedContributions = recentContributions.slice(page * limit, (page + 1) * limit);

    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval;

        if (seconds < 60) {
            return seconds < 10 ? "just now" : seconds + " seconds ago";
        }

        if (seconds < 3600) { // Less than an hour
            interval = Math.floor(seconds / 60);
            return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
        }

        if (seconds < 86400) { // Less than a day
            interval = Math.floor(seconds / 3600);
            return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
        }

        if (seconds < 31536000) { // Less than a year
            interval = Math.floor(seconds / 86400);
            return interval + " day" + (interval === 1 ? "" : "s") + " ago";
        }

        interval = Math.floor(seconds / 31536000);
        return interval + " year" + (interval === 1 ? "" : "s") + " ago";
    };

    const formatFullDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    const contributionTypeMap = {
        updated_lyrics: 'Edited',
        added_lyrics: 'Added',
        verified_lyrics: 'Verified',
        deleted_lyrics: 'Deleted', // Add any other types you want to handle
        unverified_lyrics: 'Unverified' // Example for another type
    };

    return (
        <div className="home-page-container">
            <MenuBar />
            {/* Header with search input and login/register links */}
            <header className="header">
                <input
                    type="text"
                    placeholder="Search for an artist, album, track, or lyrics..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                />
            </header>

            {/* Display search results below the search bar */}
            {(searchResults.artists.length > 0 || searchResults.albums.length > 0 || searchResults.tracks.length > 0 || searchResults.lyrics.length > 0) && (
                <section className="search-results" style={{ zIndex: 1000 }}>
                    <div className="category-container">
                        {searchResults.artists.length > 0 && (
                            <div>
                                <h2>Artist Results</h2>
                                <ul className="search-results-list">
                                    {searchResults.artists.map((artist) => (
                                        <li key={artist.artistVanity} className="search-result-item">
                                            <Link to={`/artist/${artist.artistVanity}`} style={{ textDecoration: 'none' }}>
                                                <img src={artist.artistPictureUrl || '/assets_public/music-artist.svg'} alt={artist.artistName} className="search-item-picture" />
                                                <span className="search-item-name">{artist.artistName}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {searchResults.albums.length > 0 && (
                            <div>
                                <h2>Album Results</h2>
                                <ul className="search-results-list">
                                    {searchResults.albums.map((album) => (
                                        <li key={album.albumVanity} className="search-result-item">
                                            <Link to={`/album/${album.artistVanity}/${album.albumVanity}`} style={{ textDecoration: 'none' }}>
                                                <img src={album.coverUrl || '/assets_public/music-artist.svg'} alt={album.albumName} className="search-item-picture" />
                                                <span className="search-item-name">{album.albumName}<br></br>{album.artistName}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {searchResults.tracks.length > 0 && (
                            <div>
                                <h2>Track Results</h2>
                                <ul className="search-results-list">
                                    {searchResults.tracks.map((track) => (
                                        <li key={track.trackVanity} className="search-result-item">
                                            <Link to={`/lyrics/${track.mainArtistVanity}/${track.trackVanity}`} style={{ textDecoration: 'none' }}>
                                                <img src={track.albumCoverUrl || '/assets_public/music-artist.svg'} alt={track.albumName} className="search-item-picture" />
                                                <span className="search-item-name">{track.trackName}<br></br>{track.mainArtistName}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {searchResults.lyrics.length > 0 && (
                            <div>
                                <h2>Lyric Results</h2>
                                <ul className="search-results-list">
                                    {searchResults.lyrics.map((lyric) => (
                                        <li key={lyric.lyricId} className="search-result-item">
                                            <Link to={`/lyrics/${lyric.mainArtistVanity}/${lyric.trackVanity}`} style={{ textDecoration: 'none' }}>
                                                <img src={lyric.albumCoverUrl || '/assets_public/music-artist.svg'} alt={lyric.albumName} className="search-item-picture" />
                                                <span className="search-item-name">{lyric.trackName}<br></br>{lyric.mainArtistName}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Featured Artists Section */}
            <section className="featured-artists-section">
                <h2>Random Artists</h2>
                <ul className="artist-list">
                    {featuredArtists.map((artist) => (
                        <li key={artist.artistVanity} className="artist-item">
                            <Link to={`/artist/${artist.artistVanity}`} style={{ textDecoration: 'none' }}>
                                <img src={artist.artistPictureUrl || '/assets_public/music-artist.svg'} alt={artist.artistName} className="artist-picture" /><br />
                                <span className="artist-name">{artist.artistName}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            {userToken && (
                /* Recent Contributions Section */
                <section className="recent-contributions-section">
                    <h1>Recent Contributions</h1>
                    {displayedContributions.length > 0 ? (
                        <ul>
                            {displayedContributions.map((contribution, index) => {
                                const updatedDate = new Date(contribution.createdAt);
                                const now = new Date();
                                const isYesterdayOrBefore = updatedDate < new Date(now.setDate(now.getDate() - 1));
                                return (
                                    <li key={index}>
                                        <div className="contribution-item">
                                            <img
                                                src={contribution.albumCoverUrl}
                                                alt={`${contribution.trackName} cover`}
                                                className="album-cover"
                                            />
                                            <div className="text-container">
                                                <a href={`/lyrics/${contribution.artistVanity}/${contribution.trackVanity}`}>
                                                    {contribution.trackName}
                                                </a>
                                                <br />
                                                <a href={`/artist/${contribution.artistVanity}`} className="artist-name">
                                                    <small>{contribution.artistName}</small>
                                                </a>
                                            </div>
                                            <span className="updated-at">
                                                <i>
                                                    {contributionTypeMap[contribution.contributionType] || contribution.contributionType}
                                                </i>
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p>No recent contributions found.</p>
                    )}
                    {recentContributions.length > limit && (
                        <div className="pagination-controls">
                            {page > 0 && (
                                <button onClick={handlePreviousPage}>Previous</button>
                            )}
                            {(page + 1) * limit < recentContributions.length && (
                                <button onClick={handleNextPage}>Next</button>
                            )}
                        </div>
                    )}
                </section>)}

            <footer>
                {isAdmin ? (
                    <>
                        <p><a href="/katalog-admin/tools">&copy; 2024 Eleazar Galope, go to Tools</a></p>
                        <br />
                    </>
                ) : (
                    <>
                        <p className="common-footer">&copy; 2024 Eleazar Galope</p>
                    </>
                )}
                <small style={{ color: 'gray' }}>Katalog v{packageJson.version}-beta</small>
            </footer>

        </div>
    );
}

export default HomePage;
