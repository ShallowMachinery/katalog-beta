import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuBar from '../../MenuBar';
import axios from 'axios';
import './ResolveDuplicateTracks.css';

function ResolveDuplicateTracks() {
    const [duplicateTracks, setDuplicateTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedRows, setExpandedRows] = useState([]);
    const [selectedTracks, setSelectedTracks] = useState({});
    const userToken = localStorage.getItem('access_token');

    useEffect(() => {
        const fetchDuplicateTracks = async () => {
            try {
                const response = await axios.get('http://192.168.100.8/katalog/beta/api/get-duplicate-tracks.php', {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });
                setDuplicateTracks(response.data);
                console.log('Duplicate Tracks API Response:', response.data);
            } catch (error) {
                console.error('Error fetching duplicates:', error);
                setError('Error fetching track duplicates');
            } finally {
                setLoading(false);
            }
        };

        fetchDuplicateTracks();
    }, []);

    const handleCheckboxChange = (trackName, trackId) => {
        setSelectedTracks((prevSelectedTracks) => ({
            ...prevSelectedTracks,
            [trackName]: prevSelectedTracks[trackName]?.includes(trackId)
                ? prevSelectedTracks[trackName].filter(id => id !== trackId)
                : [...(prevSelectedTracks[trackName] || []), trackId],
        }));
    };

    const handleMergeSelected = async (trackName) => {
        const trackIds = selectedTracks[trackName];
        if (!trackIds || trackIds.length < 2) {
            alert("Please select at least two tracks to merge.");
            return;
        }

        const primaryTrackId = trackIds[0];
        try {
            const response = await axios.post('http://192.168.100.8/katalog/beta/api/merge-tracks.php', {
                primaryTrackId,
                duplicateTrackIds: trackIds.slice(1)
            }, {
                headers: {
                    Authorization: `Bearer ${userToken}` // Set the Authorization header
                }
            });

            if (response.data.success) {
                alert('Tracks merged successfully!');
            } else {
                alert('Failed to merge tracks: ' + response.data.error);
            }
        } catch (error) {
            console.error('Error merging tracks:', error);
            alert('Error merging tracks. Please try again later.');
        }
    };

    const toggleExpandRow = (trackName) => {
        setExpandedRows((prevExpandedRows) =>
            prevExpandedRows.includes(trackName)
                ? prevExpandedRows.filter(row => row !== trackName)
                : [...prevExpandedRows, trackName]
        );
    };

    const convertToSeconds = (duration) => {
        const [minutes, seconds] = duration.split(':').map(Number);
        return minutes * 60 + seconds;
    };

    const getQuickNotes = (track) => {
        const notes = [];
        const { track_details } = track;

        if (track_details.length > 1) {
            const firstAlbum = track_details[0].album_name;
            const differentAlbums = track_details.some(detail => detail.album_name !== firstAlbum);
            if (differentAlbums) {
                notes.push(<span style={{ color: 'red' }}>Albums differ<br /></span>);
            }

            const firstDuration = convertToSeconds(track_details[0].duration);
            const sameDuration = track_details.every(detail => convertToSeconds(detail.duration) === firstDuration);
            if (sameDuration) {
                notes.push(<span style={{ color: 'blue' }}>Same duration<br /></span>);
            } else {
                const durations = track_details.map(detail => convertToSeconds(detail.duration));
                const hasLongerDurations = durations.some(duration => duration > firstDuration);
                const hasShorterDurations = durations.some(duration => duration < firstDuration);
    
                if (hasLongerDurations && hasShorterDurations) {
                    notes.push(<span style={{ color: 'orange' }}>Durations vary<br /></span>);
                } else if (hasLongerDurations) {
                    notes.push(<span style={{ color: 'orange' }}>Some are longer<br /></span>);
                } else if (hasShorterDurations) {
                    notes.push(<span style={{ color: 'orange' }}>Some are shorter<br /></span>);
                }
            }

            const firstISRC = track_details[0].isrc;
            const sameISRC = track_details.every(detail => detail.isrc === firstISRC);
            if (sameISRC) {
                notes.push(<span style={{ color: 'blue' }}>Same ISRC<br /></span>);
            } else {
                notes.push(<span style={{ color: 'orange' }}>Different ISRCs<br /></span>);
            }
        }

        return notes.length > 0 ? notes : <span style={{ color: 'gray' }}>No notes</span>;
    };

    return (
        <div className="resolve-duplicates-page">
            <MenuBar />
            <h2>Resolve Duplicate Tracks</h2>

            {error && <p className="error-message">{error}</p>}

            {loading ? (
                <p>Loading...</p>
            ) : (
                duplicateTracks.length > 0 ? (
                    <div className="track-duplicates-list">
                        <h3>Duplicate tracks found ({duplicateTracks.length}):</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Track Name</th>
                                    <th>Artist Name</th>
                                    <th>Duplicate Count</th>
                                    <th>Quick Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicateTracks.map((track) => (
                                    <React.Fragment key={track.track_name}>
                                        <tr>
                                            <td>{track.track_name}</td>
                                            <td>{track.artist_name}</td>
                                            <td>{track.duplicate_count}</td>
                                            <td>{getQuickNotes(track)}</td>
                                            <td>
                                                <button onClick={() => toggleExpandRow(track.track_name)}>
                                                    {expandedRows.includes(track.track_name) ? 'Hide' : 'Show'} Details
                                                </button>
                                            </td>
                                        </tr>

                                        {expandedRows.includes(track.track_name) && (
                                            <tr>
                                                <td colSpan="5">
                                                    <div className="track-details">
                                                        <h4>Details</h4>
                                                        {track.track_details.length > 0 ? (
                                                            <ul>
                                                                {track.track_details.map(detail => (
                                                                    <li key={detail.track_id}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedTracks[track.track_name]?.includes(detail.track_id) || false}
                                                                            onChange={() => handleCheckboxChange(track.track_name, detail.track_id)}
                                                                        />
                                                                        <strong>Track ID:</strong> {detail.track_id} <br />
                                                                        <strong>Track Name:</strong> {detail.track_name} <br />
                                                                        <strong>Artist ID:</strong> {detail.artist_id} <br />
                                                                        <strong>Artist Name:</strong> {detail.artist_name} <br />
                                                                        <strong>Album Name:</strong> {detail.album_name} <br />
                                                                        <strong>Release Date: </strong> {detail.release_date} <br />
                                                                        <strong>Duration:</strong> {detail.duration} <br />
                                                                        <strong>ISRC:</strong> {detail.isrc} <br />
                                                                        <strong>Link: </strong>
                                                                        <a href={`/lyrics/${detail.artist_id}/${detail.track_id}`} target="_blank" rel="noopener noreferrer">
                                                                            View track
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>No details found.</p>
                                                        )}
                                                        <button onClick={() => handleMergeSelected(track.track_name)}>
                                                            Merge Selected
                                                        </button>
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
                    <p>No duplicate tracks found.</p>
                )
            )}
        </div>
    );
}

export default ResolveDuplicateTracks;
