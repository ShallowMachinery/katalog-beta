import React, { useState, useEffect } from 'react';
import MenuBar from '../../MenuBar';
import axios from 'axios';
import './ResolveDuplicateArtists.css';

function ResolveDuplicateArtists() {
    const [duplicateArtists, setDuplicateArtists] = useState([]);
    const [filteredArtists, setFilteredArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedRows, setExpandedRows] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const userToken = localStorage.getItem('access_token');
        const fetchDuplicateArtists = async () => {
            try {
                const response = await axios.get(`/backend/get-duplicate-artists.php`, {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });
                setDuplicateArtists(response.data);
                setFilteredArtists(response.data);
            } catch (error) {
                console.error('Error fetching duplicates:', error);
                setError('Error fetching artist duplicates');
            } finally {
                setLoading(false);
            }
        };

        fetchDuplicateArtists();
    }, []);

    const handleMerge = async (artistIds) => {
        const userToken = localStorage.getItem('access_token');
        const idsArray = artistIds.split(',').map(Number);
        const primaryArtistId = idsArray[0];
    
        try {
            const response = await axios.post(`/backend/merge-artists.php`, {
                primaryArtistId,
                duplicateArtistIds: idsArray.slice(1)
            }, {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
    
            if (response.data.success) {
                alert('Artists merged successfully!');
                window.location.reload();
            } else {
                alert('Failed to merge artists: ' + response.data.error);
            }
        } catch (error) {
            console.error('Error merging artists:', error);
            alert('Error merging artists. Please try again later.');
        }
    };

    const toggleExpandRow = (artistName) => {
        if (expandedRows.includes(artistName)) {
            setExpandedRows(expandedRows.filter(row => row !== artistName));
        } else {
            setExpandedRows([...expandedRows, artistName]);
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        // Filter artists based on the query
        const filtered = duplicateArtists.filter((artist) =>
            artist.artist_name.toLowerCase().includes(query)
        );
        setFilteredArtists(filtered);
    };

    return (
        <div className="resolve-duplicates-page">
            <MenuBar />
            <h2>Resolve Duplicate Artists</h2>

            {error && <p className="error-message">{error}</p>}

            <input
                type="text"
                className="search-input"
                placeholder="Search artists..."
                value={searchQuery}
                onChange={handleSearch}
            />

            {loading ? (
                <p>Loading...</p>
            ) : (
                duplicateArtists.length > 0 ? (
                    <div className="artist-duplicates-list">
                        <h3>Duplicate artists found ({duplicateArtists.length}):</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Artist Name</th>
                                    <th>Duplicate Count</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredArtists.map((artist) => (
                                    <React.Fragment key={artist.artist_name}>
                                        <tr>
                                            <td>
                                                {artist.artist_name}
                                                <button className="artist-details-button" onClick={() => toggleExpandRow(artist.artist_name)}>
                                                    {expandedRows.includes(artist.artist_name) ? 'Hide' : 'Show'} Details
                                                </button>
                                            </td>
                                            <td>{artist.duplicate_count}</td>
                                            <td>
                                                <button className="merge-button" onClick={() => handleMerge(artist.artist_ids)}>
                                                    Merge
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRows.includes(artist.artist_name) && (
                                            <tr>
                                                <td colSpan="3">
                                                    <div className="artist-details">
                                                        <h4>Albums</h4>
                                                        {artist.albums.length > 0 ? (
                                                            <ul>
                                                                {artist.albums.map(album => (
                                                                    <li key={album.album_id}>
                                                                        <strong>Album Name:</strong> <span title={`Album ID: ${album.album_id}`}>{album.album_name}</span> <br />
                                                                        <strong>Artist Name:</strong> {album.artist_name} <br />
                                                                        <strong>Artist Vanity:</strong> {album.artist_vanity} <br />
                                                                        {album.artist_spotify_id && (
                                                                            <>
                                                                                <strong>Artist Spotify ID:</strong> {album.artist_spotify_id}
                                                                            </>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>No albums found.</p>
                                                        )}

                                                        <h4>Tracks</h4>
                                                        {artist.tracks.length > 0 ? (
                                                            <ul>
                                                                {artist.tracks.map(track => (
                                                                    <li key={track.track_id}>
                                                                        <strong>Track Name:</strong> <span title={`Track ID: ${track.track_id}`}>{track.track_name}</span> <br />
                                                                        <strong>Artist Name:</strong> {track.artist_name} <br />
                                                                        <strong>Artist Vanity:</strong> {track.artist_vanity} <br />
                                                                        {track.artist_spotify_id && (
                                                                            <>
                                                                                <strong>Artist Spotify ID:</strong> {track.artist_spotify_id}
                                                                            </>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>No tracks found.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>No duplicate artists found.</p>
                )
            )}
        </div>
    );
}

export default ResolveDuplicateArtists;
