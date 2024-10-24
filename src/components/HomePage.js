import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MenuBar from './MenuBar';
import './HomePage.css'; // Add CSS for styling

function HomePage() {
    const [featuredArtists, setFeaturedArtists] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState({
        artists: [],
        albums: [],
        tracks: [],
        lyrics: [],
    });

    useEffect(() => {
        const fetchFeaturedArtists = async () => {
            try {
                const response = await axios.get('http://localhost/katalog/beta/api/featured-artists.php');
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
        fetchFeaturedArtists();
    }, []);

    const handleSearch = async (e) => {
        const value = e.target.value; // Trim whitespace
        setSearchTerm(value);

        // Only perform the search if the length is 4 or more
        if (value.length >= 2) {
            try {
                const response = await axios.get('http://localhost/katalog/beta/api/search.php', {
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




    return (
        <div className="home-page-container">
            <MenuBar />
            <header>
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
                                        <Link to={`/artist/${artist.artistVanity}`}>
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
                                        <Link to={`/album/${album.artistVanity}/${album.albumVanity}`}>
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
                                        <Link to={`/lyrics/${track.mainArtistVanity}/${track.trackVanity}`}>
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
                                        <Link to={`/lyrics/${lyric.mainArtistVanity}/${lyric.trackVanity}`}>
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
                            <Link to={`/artist/${artist.artistVanity}`}>
                                <img src={artist.artistPictureUrl || '/assets_public/music-artist.svg'} alt={artist.artistName} className="artist-picture" />
                                <span className="artist-name">{artist.artistName}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            <footer>
                <p>&copy; 2024 Eleazar Galope</p>
            </footer>
        </div>
    );
}

export default HomePage;
