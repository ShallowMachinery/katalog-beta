import React, { useState, useEffect } from 'react';
import MenuBar from './MenuBar';
import axios from 'axios';
import './ResolveDuplicateArtists.css';

function ResolveDuplicateArtists() {
    const [duplicateArtists, setDuplicateArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedRows, setExpandedRows] = useState([]); // To track expanded rows

    // Fetch duplicate artists when the page loads
    useEffect(() => {
        const fetchDuplicateArtists = async () => {
            try {
                const response = await axios.get('http://localhost/katalog/beta/api/get-duplicate-artists.php');
                setDuplicateArtists(response.data);
                console.log('Duplicate Artists API Response:', response.data);
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
        const idsArray = artistIds.split(',').map(Number);
        const primaryArtistId = idsArray[0]; // Use the first artist ID as the primary
    
        try {
            const response = await axios.post('http://localhost/katalog/beta/api/merge-artists.php', {
                primaryArtistId,
                duplicateArtistIds: idsArray.slice(1) // Pass the remaining IDs for merging
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

    // Toggle expand/collapse row
    const toggleExpandRow = (artistName) => {
        if (expandedRows.includes(artistName)) {
            setExpandedRows(expandedRows.filter(row => row !== artistName));
        } else {
            setExpandedRows([...expandedRows, artistName]);
        }
    };

    return (
        <div className="resolve-duplicates-page">
            <MenuBar />
            <h2>Resolve Duplicate Artists</h2>

            {error && <p className="error-message">{error}</p>}

            {loading ? (
                <p>Loading...</p>
            ) : (
                duplicateArtists.length > 0 ? (
                    <div className="artist-duplicates-list">
                        <h3>Duplicate Artists Found:</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Artist Name</th>
                                    <th>Duplicate Count</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicateArtists.map((artist) => (
                                    <React.Fragment key={artist.artist_name}>
                                        {/* Main Row */}
                                        <tr>
                                            <td>
                                                {artist.artist_name}
                                                <button onClick={() => toggleExpandRow(artist.artist_name)}>
                                                    {expandedRows.includes(artist.artist_name) ? 'Hide' : 'Show'} Details
                                                </button>
                                            </td>
                                            <td>{artist.duplicate_count}</td>
                                            <td>
                                                <button onClick={() => handleMerge(artist.artist_ids)}>
                                                    Merge
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
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
