import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import MenuBar from './MenuBar';
import DetectLanguage from 'detectlanguage';
import './LyricsPage.css';

function LyricsPage() {
    const { artistId, trackId } = useParams();
    const [trackInfo, setTrackInfo] = useState(null);
    const [lyrics, setLyrics] = useState('');
    const [rawLyrics, setRawLyrics] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [newLyrics, setNewLyrics] = useState('');  // This will hold the lyrics for editing
    const [lyricsInfo, setLyricsInfo] = useState(null);
    const [isInstrumental, setIsInstrumental] = useState(false);
    const [loading, setLoading] = useState(true);
    const [albums, setAlbums] = useState([]);
    const [fontSize, setFontSize] = useState('small');
    const location = useLocation();
    const isAdmin = location.pathname.includes('/katalog-admin/');
    const [isrcsVisible, setIsrcsVisible] = useState(false); // State to control visibility of ISRCs
    const [isrcs, setIsrcs] = useState([]); // State to hold ISRCs

    const detectlanguage = new DetectLanguage(process.env.REACT_APP_DETECT_LANGUAGE_API_KEY);

    const languageMap = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ru': 'Russian',
        'tl': 'Tagalog',
        'ceb': 'Cebuano',
        'ko': 'Korean',
        'war': 'Waray',
        'null': 'Not available'
    };

    useEffect(() => {
        const fetchAlbums = async (trackId) => {
            try {
                const response = await axios.get(`http://localhost/katalog/beta/api/get-track-albums.php`, {
                    params: { trackId },
                });
                if (response.data.success) {
                    setAlbums(response.data.albums); // Set albums state
                } else {
                    console.error('Failed to fetch albums');
                }
            } catch (error) {
                console.error('Error fetching albums:', error);
            }
        };

        const fetchTrackInfo = async () => {
            try {
                // Fetch track information based on artistVanity and trackVanity
                const response = await axios.get(`http://localhost/katalog/beta/api/track-info.php`, {
                    params: { artistId, trackId },
                });
                const trackData = response.data;
                setTrackInfo(trackData);
                setIsInstrumental(trackData.isInstrumental);
                setIsrcs(trackData.isrc.split(', '));

                if (trackData) {
                    document.title = `${trackData.artistName} - ${trackData.trackName} lyrics | Katalog`;
                    await fetchAlbums(trackData.trackId);
                }

                // Fetch lyrics for the track
                const lyricsResponse = await axios.get(`http://localhost/katalog/beta/api/track-lyrics.php`, {
                    params: { artistId, trackId },
                });

                const fetchedLyrics = lyricsResponse.data.lyrics;
                const contributorDetails = lyricsResponse.data;

                setLyrics(fetchedLyrics); // Store the raw lyrics for editing
                setRawLyrics(fetchedLyrics); // Store the raw lyrics for editing
                setNewLyrics(fetchedLyrics);
                setLyricsInfo(contributorDetails);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching track info or lyrics:', error);
                setLoading(false);
            }
        };
        fetchTrackInfo();
    }, [artistId, trackId]);

    const handleEditClick = () => {
        setIsEditing(true);
        setNewLyrics(rawLyrics);
    };

    const handleLyricsChange = (event) => {
        setNewLyrics(event.target.value); // Update newLyrics state as the user types
    };

    const handleSaveClick = async () => {
        let languageResult = null;

        if (newLyrics !== "@INSTRUMENTAL") {
            try {
                languageResult = await detectlanguage.detectCode(newLyrics);
                console.log("Language found: ", languageResult);
            } catch (error) {
                console.error("Error detecting language:", error);
            }
        }

        try {
            // Make an API call to save the updated lyrics
            await axios.post(`http://localhost/katalog/beta/api/update-lyrics.php`, {
                trackId: trackInfo.trackId,
                newLyrics,
                languageResult
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

    const handleInstrumentalChange = () => {
        if (!isInstrumental) {
            if (window.confirm('Are you sure to mark this song as instrumental?')) {
                setIsInstrumental(true);
                setNewLyrics('@INSTRUMENTAL');
            }
        } else {
            setIsInstrumental(false);
            setNewLyrics(rawLyrics);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' };

        const formattedDate = date.toLocaleString('en-US', options);
        const [datePart, timePart] = formattedDate.split(', ');
        return `${datePart}, ${timePart}`;
    };

    const formattedLyrics = lyrics.replace(/@(.*?)(\n|$)/g, (_, tag) => `<span class="lyrics-tag">${tag.trim().toUpperCase()}</span>\n`);

    const filteredIsrcs = isrcs.filter(isrc => isrc !== "N/A" || isrcs.length === 1);

    const handleFontSizeChange = (size) => {
        setFontSize(size); // Set the font size based on the button clicked
    };

    const fontSizeClass = `lyrics ${fontSize}`;

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
                        <Link style={{ textDecoration: 'none' }} to={`/artist/${trackInfo.artistVanity}`}>
                            <h3 className="artist-name">{trackInfo.artistName}</h3>
                        </Link>
                        <Link style={{ textDecoration: 'none' }} to={`/album/${trackInfo.albumArtistVanity}/${trackInfo.albumVanity}`}>
                            <p className="album-name" title={`Disc #${trackInfo.discNumber}`}>Track {trackInfo.trackNumber} on <strong>{trackInfo.albumName}</strong> · {new Date(trackInfo.releaseDate).getFullYear()}</p>
                        </Link>
                    </div>
                    {isAdmin && !isEditing && (
                        <button className="edit-lyrics-button" onClick={handleEditClick}>
                            {lyrics ? 'Edit lyrics' : 'Add lyrics'}
                        </button>
                    )}
                </div>

                {/* <div className="font-size-toggle">
                    <h3>Font size:</h3>
                    <button onClick={() => handleFontSizeChange('small')}>Small</button>
                    <button onClick={() => handleFontSizeChange('normal')}>Normal</button>
                    <button onClick={() => handleFontSizeChange('big')}>Big</button>
                </div> */}

                <div className="lyrics-section">
                    <strong className="lyrics-header">Lyrics</strong>
                    {isEditing ? (
                        <div>
                            <textarea
                                className="lyrics-textarea"
                                value={newLyrics} // Use newLyrics state for textarea value
                                onChange={handleLyricsChange}
                                rows="10"
                                disabled={isInstrumental}
                            />
                            <div className="lyrics-options">
                                <label className="instrumental-label">
                                    <input
                                        type="checkbox"
                                        checked={isInstrumental}
                                        onChange={handleInstrumentalChange}
                                    />
                                    <div className="custom-checkbox"></div>
                                    Mark as instrumental
                                </label>
                                <div style={{ marginLeft: 'auto' }}> {/* Ensure the buttons are to the right */}
                                    <button className="save-lyrics-button" onClick={handleSaveClick}>
                                        Save
                                    </button>
                                    <button className="cancel-lyrics-button" onClick={handleCancelClick}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={fontSizeClass}>
                            {isInstrumental ? (
                                <p>This song is instrumental.</p>
                            ) : (
                                <p dangerouslySetInnerHTML={{ __html: formattedLyrics || "There's no lyrics for this yet." }} />
                            )}
                        </div>
                    )}
                </div>

                <div className="additional-info">
                    <div className="more-information">
                        <strong className="info-header">More information</strong>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td>Language</td>
                                    <td>{lyricsInfo.language ? languageMap[lyricsInfo.language] || lyricsInfo.language : 'Unknown'}</td>
                                </tr>
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
                                    <td>{filteredIsrcs.length > 1 ? `ISRCs` : `ISRC`}</td>
                                    <td>
                                        {filteredIsrcs.length === 1 ? (
                                            <span>{filteredIsrcs[0]}</span>
                                        ) : (
                                            <span>
                                                {isrcsVisible ? (
                                                    <>
                                                        {filteredIsrcs.map((isrc, index) => (
                                                            <div key={index}>{isrc}</div>
                                                        ))}
                                                        <button onClick={() => setIsrcsVisible(false)} className="isrc-buttons">
                                                            Collapse
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{filteredIsrcs[0]} </span>
                                                        <small>+ {filteredIsrcs.length - 1} more </small>
                                                    </>
                                                )}
                                                {filteredIsrcs.length > 1 && !isrcsVisible && (
                                                    <button onClick={() => setIsrcsVisible(true)} className="isrc-buttons">
                                                        Expand
                                                    </button>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Label</td>
                                    <td>{trackInfo.labelName}</td>
                                </tr>
                                <tr>
                                    <td>Last modified by</td>
                                    <td>{lyricsInfo ? `${lyricsInfo.userName} (${lyricsInfo.firstName} ${lyricsInfo.lastName}) [${lyricsInfo.userType}]` : 'Unknown'}</td>
                                </tr>
                                <tr>
                                    <td>Last updated at</td>
                                    <td>{lyricsInfo.lyrics ? formatTimestamp(lyricsInfo.updateTimestamp) : 'Never'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="track-albums">
                        <strong className="track-album-header">Albums where this track is listed</strong>
                        {albums.length > 0 ? (
                            <div>
                                {albums.map((album) => (
                                    <div key={album.album_id} className="album-entry">
                                        <Link to={`/album/${album.artist_vanity}/${album.album_vanity}`} className="album-link">
                                            <img src={album.album_cover_url} alt={`${album.album_name} cover`} className="album-cover" />
                                            <div className="album-details">
                                                <p className="album-name">{album.album_name}</p>
                                                <p className="track-number" title={`Disc #${album.disc_number}`}>Track {album.track_number}</p>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No albums found for this track.</p>
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
}

export default LyricsPage;
