import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import MenuBar from './MenuBar';
import './LyricsPage.css';

function LyricsPage() {
    const { artistVanity, trackVanity } = useParams();
    const [trackInfo, setTrackInfo] = useState(null);
    const [lyrics, setLyrics] = useState('');
    const [rawLyrics, setRawLyrics] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [newLyrics, setNewLyrics] = useState('');  // This will hold the lyrics for editing
    const [loading, setLoading] = useState(true); 
    const location = useLocation();
    const isAdmin = location.pathname.includes('/katalog-admin/');

    useEffect(() => {
        const fetchTrackInfo = async () => {
            try {
                // Fetch track information based on artistVanity and trackVanity
                const response = await axios.get(`http://localhost/katalog/beta/api/track-info.php`, {
                    params: { artistVanity, trackVanity },
                });
                const trackData = response.data;
                setTrackInfo(trackData);
                console.log(trackData);

                if (trackData) {
                    document.title = `${trackData.artistName} - ${trackData.trackName} lyrics | Katalog`;
                }

                // Fetch lyrics for the track
                const lyricsResponse = await axios.get(`http://localhost/katalog/beta/api/track-lyrics.php`, {
                    params: { artistVanity, trackVanity },
                });
                
                const fetchedLyrics = lyricsResponse.data.lyrics;

                setLyrics(fetchedLyrics); // Store the raw lyrics for editing
                setRawLyrics(fetchedLyrics); // Store the raw lyrics for editing
                setNewLyrics(fetchedLyrics);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching track info or lyrics:', error);
                setLoading(false);
            }
        };
        fetchTrackInfo();
    }, [artistVanity, trackVanity]);

    const handleEditClick = () => {
        setIsEditing(true);
        setNewLyrics(rawLyrics);
    };

    const handleLyricsChange = (event) => {
        setNewLyrics(event.target.value); // Update newLyrics state as the user types
    };

    const handleSaveClick = async () => {
        try {
            // Make an API call to save the updated lyrics
            await axios.post(`http://localhost/katalog/beta/api/update-lyrics.php`, {
                trackId: trackInfo.trackId,
                newLyrics
            });
            setLyrics(newLyrics); // Update the displayed lyrics with the new lyrics
            setRawLyrics(newLyrics); // Update the raw lyrics
            setIsEditing(false); // Exit editing mode
        } catch (error) {
            console.error('Error saving lyrics:', error);
        }
    };

    const handleCancelClick = () => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            setIsEditing(false); // Exit editing mode without saving
            setNewLyrics(rawLyrics); // Reset newLyrics to the raw lyrics
        }
    };

    const formattedLyrics = lyrics.replace(/@(.*?)(\n|$)/g, (_, tag) => `<span class="lyrics-tag">${tag.trim().toUpperCase()}</span>\n`);

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="lyrics-page-container">
                    <p>Working on it!</p>
                </div>
            </div>
        );
    }

    if (!trackInfo) {
        return (
            <div>
                <MenuBar />
                <div className="lyrics-page-container">
                    <p>This track doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <MenuBar />
            <div className="lyrics-page-container">
                <div className="album-info">
                    <img src={trackInfo.albumCoverUrl} alt="cover" className="album-cover" />
                    <div className="album-details">
                        <h2 className="track-name">{trackInfo.trackName} {trackInfo.isExplicit === 1 ? <span className="track-explicit">E</span> : ''}</h2>
                        <Link style={{ textDecoration: 'none' }} to={`/artist/${artistVanity}`}>
                            <h3 className="artist-name">{trackInfo.artistName}</h3>
                        </Link>
                        <Link style={{ textDecoration: 'none' }} to={`/album/${trackInfo.albumArtistVanity}/${trackInfo.albumVanity}`}>
                            <p className="album-name">Track {trackInfo.trackNumber} on <strong>{trackInfo.albumName}</strong> · {new Date(trackInfo.releaseDate).getFullYear()}</p>
                        </Link>
                    </div>
                    {isAdmin &&
                        <button className="edit-lyrics-button" onClick={handleEditClick}>
                            {lyrics ? 'Edit lyrics' : 'Add lyrics'}
                        </button>
                    }
                </div>

                <div className="lyrics-section">
                    <strong className="lyrics-header">Lyrics</strong>
                    {isEditing ? (
                        <div>
                            <textarea
                                className="lyrics-textarea"
                                value={newLyrics} // Use newLyrics state for textarea value
                                onChange={handleLyricsChange}
                                rows="10"
                            />
                            <div className="lyrics-buttons">
                                <button className="save-lyrics-button" onClick={handleSaveClick}>
                                    Save
                                </button>
                                <button className="cancel-lyrics-button" onClick={handleCancelClick}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="lyrics" dangerouslySetInnerHTML={{ __html: formattedLyrics ? formattedLyrics : "There's no lyrics for this yet." }}></p>
                    )}
                </div>

                <div className="additional-info">
                    <strong className="info-header">More information</strong>
                    <table className="info-table">
                        <tr>
                            <td>Duration</td>
                            <td>{trackInfo.trackDuration}</td>
                        </tr>
                        <tr>
                            <td>Release date</td>
                            <td>{new Date(trackInfo.releaseDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}</td>
                        </tr>
                        <tr>
                            <td>ISRC</td>
                            <td>{trackInfo.isrc}</td>
                        </tr>
                        <tr>
                            <td>Label</td>
                            <td>{trackInfo.labelName}</td>
                        </tr>
                    </table>
                </div>
            </div>

        </div>
    );
}

export default LyricsPage;
