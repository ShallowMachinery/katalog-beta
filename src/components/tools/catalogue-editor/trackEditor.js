import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../../MenuBar';
import NotificationToast from '../../NotificationToast';
import './trackEditor.css';
import { getSpotifyAccessToken } from '../../spotifyAuth';

function TrackEditor() {
    const { trackId } = useParams();
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [trackInfo, setTrackInfo] = useState(null);
    const [genres, setGenres] = useState(null);
    const [writers, setWriters] = useState([]);
    const [trackGenre, setTrackGenre] = useState({ genre_id: null, genre_name: null });
    const [trackWriters, setTrackWriters] = useState([]);
    const [trackISRCs, setTrackISRCs] = useState([]);
    const [isISRCValid, setIsISRCValid] = useState(true);
    const [loading, setLoading] = useState(true);
    const [showSuggestions, setShowSuggestions] = useState(null);
    const suggestionsOverlayRef = useRef(null);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const navigate = useNavigate();

    const languages = {
        'tl': 'Tagalog',
        'en': 'English',
        'ceb': 'Cebuano',
        'war': 'Waray',
        'zh': 'Chinese',
        'es': 'Spanish',
        'fr': 'French',
        'ru': 'Russian',
        'id': 'Indonesian',
        'de': 'German',
        'ja': 'Japanese',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ko': 'Korean',
        '': 'Unknown'
    };

    const userToken = localStorage.getItem('access_token');

    useEffect(() => {
        const fetchTrackInfo = async () => {
            try {
                const trackInfoResponse = await axios.get(`/backend/editor-get-track-info.php`, {
                    params: { trackId },
                });
                const trackData = trackInfoResponse.data;
                trackData.language = trackData.language ?? '';
                setTrackInfo(trackData);
                setTrackGenre({
                    genre_id: trackData.trackGenreId != null ? trackData.trackGenreId : 1,
                    genre_name: trackData.trackGenre != null ? trackData.trackGenre : "Pop"
                });

                const trackWritersResponse = await axios.get(`/backend/editor-get-track-composers.php`, {
                    params: { trackId },
                });
                const trackWritersData = trackWritersResponse.data;
                setTrackWriters(trackWritersData);

                const trackISRCsResponse = await axios.get(`/backend/editor-get-track-isrcs.php`, {
                    params: { trackId },
                });
                const trackISRCsData = trackISRCsResponse.data;
                setTrackISRCs(trackISRCsData);

                const genreResponse = await axios.get(`/backend/editor-get-genres.php`);
                setGenres(genreResponse.data);

                const writersResponse = await axios.get(`/backend/editor-get-composers.php`);
                setWriters(writersResponse.data);

                if (trackData) {
                    document.title = `${trackData.artistName} - ${trackData.trackName} track information | Katalog`;
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching track info:', error);
                setLoading(false);
            }
        };
        fetchTrackInfo();
    }, [trackId]);

    const fetchTrackISRC = async (trackId) => {
        try {
            const accessToken = await getSpotifyAccessToken();
            const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const isrc = trackResponse.data.external_ids.isrc;
            if (isrc) {
                const filteredISRCs = trackISRCs.filter(trackISRC => trackISRC.isrc !== "N/A");
                const isISRCExists = filteredISRCs.some(trackISRC => trackISRC.isrc === isrc);
                if (!isISRCExists) {
                    setTrackISRCs([...filteredISRCs, { isrc }]);
                    setToast({ show: true, message: 'ISRC fetched from Spotify!', type: 'success' });
                } else {
                    setToast({ show: true, message: 'ISRC is already in the list.', type: 'error' });
                }
            } else {
                setToast({ show: true, message: 'ISRC not found on Spotify.', type: 'error' });
            }
        } catch (error) {
            console.error('Error fetching track ISRC:', error);
            setToast({ show: true, message: 'Error fetching ISRC from Spotify.', type: 'error' });
        }
    };

    const handleGenreChange = (e) => {
        const selectedGenreId = parseInt(e.target.value);
        const selectedGenreName = genres.find(genre => genre.genre_id === selectedGenreId)?.genre_name || 'Pop';
        setTrackGenre({ genre_id: selectedGenreId, genre_name: selectedGenreName });

        if (trackInfo) {
            setTrackInfo({
                ...trackInfo,
                trackGenreId: selectedGenreId,
                trackGenre: selectedGenreName
            });
        }
    };

    const handleLanguageChange = (e) => {
        const selectedLanguageCode = e.target.value;
        const selectedLanguageName = languages[selectedLanguageCode] || 'Not available';
    
        if (trackInfo) {
            setTrackInfo({
                ...trackInfo,
                language: selectedLanguageCode,
                languageName: selectedLanguageName
            });
        }
    };

    const addTrackWriter = () => {
        setTrackWriters([...trackWriters, { composerName: '' }]);
    };

    const removeTrackWriter = (index) => {
        const updatedTrackWriters = trackWriters.filter((_, i) => i !== index);
        setTrackWriters(updatedTrackWriters);
    };

    const handleTrackWriterChange = (e, index) => {
        const { value } = e.target;
        const updatedTrackWriters = trackWriters.map((writer, i) =>
            i === index ? { ...writer, composerName: value } : writer
        );
        setTrackWriters(updatedTrackWriters);

        const suggestions = writers.filter((writer) =>
            writer.composer_name && writer.composer_name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(suggestions);
        setShowSuggestions(index);
    };

    const handleSuggestionClick = (suggestion, index) => {
        const updatedTrackWriters = trackWriters.map((writer, i) =>
            i === index ? { ...writer, composerName: suggestion.composer_name } : writer
        );
        setTrackWriters(updatedTrackWriters);
        setShowSuggestions(null);
    };

    const handleClickOutside = (event) => {
        if (suggestionsOverlayRef.current && !suggestionsOverlayRef.current.contains(event.target)) {
            setShowSuggestions(null);
        }
    };

    useEffect(() => {
        if (showSuggestions !== null) {
            document.addEventListener("click", handleClickOutside);
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [showSuggestions]);

    const removeISRC = (index) => {
        const updatedTrackISRCs = trackISRCs.filter((_, i) => i !== index);
        setTrackISRCs(updatedTrackISRCs);
    };

    const handleISRCChange = (e, index) => {
        const newISRC = e.target.value;
        const isValidISRC = /^[A-Z0-9]{12}$/.test(newISRC);
        setIsISRCValid(isValidISRC || newISRC === '');
        if (isValidISRC || newISRC === '') {
            const updatedTrackISRCs = trackISRCs.map((trackISRC, i) =>
                i === index ? newISRC : trackISRC
            );
            setTrackISRCs(updatedTrackISRCs);
        } else {
            setToast({ show: true, message: 'Invalid ISRC. Only alphanumeric characters and 12 characters long are allowed.', type: 'error' });
        }
    };

    const handleSave = async () => {
        const finalTrackInfo = {
            ...trackInfo,
            trackGenreId: trackInfo.trackGenreId ?? 1,
            trackGenre: trackInfo.trackGenre ?? "Pop",
        };

        const dataToSend = {
            trackId: finalTrackInfo.trackId,
            trackName: finalTrackInfo.trackName,
            isExplicit: finalTrackInfo.isExplicit,
            trackWriters,
            trackISRCs,
            trackGenreId: finalTrackInfo.trackGenreId,
            trackGenre: finalTrackInfo.trackGenre,
            trackLanguage: finalTrackInfo.language
        };

        try {
            const response = await axios.post(`/backend/editor-update-track-info.php`,
                dataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                }
            );
            if (response.data.status === "success") {
                setToast({ show: true, message: 'Track information saved!', type: 'success' });
                setTimeout(() => {
                    navigate(`/lyrics/${trackInfo.artistVanity}/${trackInfo.trackVanity}`);
                }, 2000);
            }
            else if (response.data.status === "error") {
                setToast({ show: true, message: response.data.message, type: 'error' });
            }

        } catch (error) {
            setToast({ show: true, message: 'Error saving track.', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="track-info-page-container">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (!trackInfo) {
        return (
            <div>
                <MenuBar />
                <div className="track-info-page-container">
                    <p>This track doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <MenuBar />
            <div className="track-info-page-container">
                <div className="dynamic-background" style={{ backgroundImage: `url(${trackInfo.albumCoverUrl})` }}></div>
                {toast.show && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
                <div className="track-main-information">
                    <img src={trackInfo.albumCoverUrl} alt="cover" className="album-cover" />
                    <div className="track-details">
                        <h2 className="track-name"><a href={`/lyrics/${trackInfo.artistVanity}/${trackInfo.trackVanity}`}>{trackInfo.trackName}</a> {trackInfo.isExplicit === 1 ? <span className="track-explicit">E</span> : ''}</h2>
                        <Link style={{ textDecoration: 'none' }} to={`/artist/${trackInfo.artistVanity}`}>
                            <h3 className="artist-name">{trackInfo.artistName}</h3>
                        </Link>
                        <Link style={{ textDecoration: 'none' }} to={`/album/${trackInfo.albumArtistVanity}/${trackInfo.albumVanity}`}>
                            <p className="album-name" title={`Disc #${trackInfo.discNumber}`}>Track {trackInfo.trackNumber} on <strong>{trackInfo.albumName}</strong> · {new Date(trackInfo.releaseDate).getFullYear()}</p>
                        </Link>
                    </div>
                </div>
                <div className="track-information-form">
                    <h3>Edit track information</h3>
                    <form>
                        <div className="form-group-row">
                            <div className="form-group">
                                <label htmlFor="trackName">Track name</label>
                                <input
                                    type="text"
                                    id="trackName"
                                    value={trackInfo.trackName}
                                    onChange={(e) => setTrackInfo({ ...trackInfo, trackName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="trackSpotifyId">Track Spotify ID</label>
                                <input
                                    type="text"
                                    id="trackSpotifyId"
                                    value={trackInfo.trackSpotifyId}
                                    disabled
                                    style={{ width: "auto" }}
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label htmlFor="isExplicit" style={{ width: "auto" }}>Explicit?</label>
                                <input
                                    type="checkbox"
                                    id="isExplicit"
                                    checked={trackInfo.isExplicit === 1}
                                    onChange={(e) => setTrackInfo({ ...trackInfo, isExplicit: e.target.checked ? 1 : 0 })}
                                />
                            </div>
                        </div>
                        <div className="form-group-row">
                            <div className="form-group" title="To edit this field, edit this in the artist editor.">
                                <label htmlFor="artistName">Artist name</label>
                                <input
                                    type="text"
                                    id="artistName"
                                    value={trackInfo.artistName}
                                    disabled
                                />
                            </div>
                            <div className="form-group" title="To edit this field, edit this in the album editor.">
                                <label htmlFor="albumName">Main album name</label>
                                <input
                                    type="text"
                                    id="albumName"
                                    value={trackInfo.albumName}
                                    disabled
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="genre">Genre</label>
                                <select
                                    id="genre"
                                    value={trackGenre.genre_id}
                                    onChange={handleGenreChange}
                                >
                                    {genres && genres.map((genre) => (
                                        <option key={genre.genre_id} value={genre.genre_id}>
                                            {genre.genre_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" title="Lyric languages are identified automatically once lyrics are submitted.">
                                <label htmlFor="lyricLanguage">Language</label>
                                <select
                                    id="lyricLanguage"
                                    value={trackInfo.language}
                                    onChange={handleLanguageChange}
                                >
                                    {Object.entries(languages).map(([language_code, language_name]) => (
                                        <option key={language_code} value={language_code}>
                                            {language_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group-row">
                            <div className="form-group">
                                <label htmlFor="trackWriters">Track writer(s)</label>
                                {trackWriters.map((trackWriter, index) => (
                                    <div key={index} className="writer-input-container">
                                        <input
                                            type="text"
                                            id={`writer-${index + 1}`}
                                            value={trackWriter.composerName || ''}
                                            onChange={(e) => handleTrackWriterChange(e, index)}
                                            onClick={() => setShowSuggestions(index)}
                                            placeholder={`Writer ${index + 1}`}
                                        />
                                        <button type="button" onClick={() => removeTrackWriter(index)} className="remove-writer">Remove</button>
                                        {showSuggestions === index && filteredSuggestions.length > 0 && (
                                            <div ref={suggestionsOverlayRef} className="suggestions-overlay">
                                                {filteredSuggestions.map((suggestion) => (
                                                    <div
                                                        key={suggestion.composer_id}
                                                        onClick={() => handleSuggestionClick(suggestion, index)}
                                                        className="suggestion-item"
                                                    >
                                                        {suggestion.composer_name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addTrackWriter} className="add-writer">Add</button>
                            </div>
                            <div className="form-group">
                                <label htmlFor="isrcs">ISRC(s)</label>
                                {trackISRCs.map((trackISRC, index) => (
                                    trackISRC.isrc !== "N/A" && (
                                        <div key={index} className="isrc-input-container">
                                            <input
                                                type="text"
                                                id={`isrc-${index + 1}`}
                                                value={trackISRC.isrc || trackISRC}
                                                onChange={(e) => handleISRCChange(e, index)}
                                                placeholder={`ISRC ${index + 1}`}
                                                className={!isISRCValid ? 'invalid' : ''}
                                                disabled
                                            />
                                            <button type="button" onClick={() => removeISRC(index)} className="remove-isrc">Remove</button>
                                        </div>
                                    )
                                ))}
                                <button type="button" onClick={() => fetchTrackISRC(trackInfo.trackSpotifyId)} className="fetch-isrc">
                                    Fetch ISRC from Spotify
                                </button>
                            </div>
                        </div>
                        <button type="button" className="save-button" onClick={handleSave}>
                            Save
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TrackEditor;