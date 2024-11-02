import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import MenuBar from '../components/MenuBar';
import Modal from '../components/Modal';
import DetectLanguage from 'detectlanguage';
import NotificationToast from '../components/NotificationToast';
import './LyricsPage.css';

function LyricsPage() {
    const { artistVanity, trackVanity } = useParams();
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [trackInfo, setTrackInfo] = useState(null);
    const [lyrics, setLyrics] = useState('');
    const [rawLyrics, setRawLyrics] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [newLyrics, setNewLyrics] = useState('');  // This will hold the lyrics for editing
    const [lyricsInfo, setLyricsInfo] = useState(null);
    const [isLyricsVerified, setIsLyricsVerified] = useState(false);
    const [verifierInfo, setVerifierInfo] = useState(null);
    const [isInstrumental, setIsInstrumental] = useState(false);
    const [loading, setLoading] = useState(true);
    const [albums, setAlbums] = useState([]);
    const [fontSize, setFontSize] = useState('small');
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const optionsRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [isrcsVisible, setIsrcsVisible] = useState(false); // State to control visibility of ISRCs
    const [isrcs, setIsrcs] = useState([]); // State to hold ISRCs
    const [userHierarchy, setUserHierarchy] = useState(0);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showInstrumentalModal, setShowInstrumentalModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const userToken = localStorage.getItem('access_token');

    useEffect(() => {
        // Decode the user token to get the user hierarchy
        if (userToken) {
            const decodedToken = jwtDecode(userToken);
            setUserHierarchy(decodedToken.data.user_hierarchy || 0); // Set the user hierarchy
        }
    }, [userToken]);

    const detectlanguage = new DetectLanguage(process.env.REACT_APP_DETECT_LANGUAGE_API_KEY);

    const cancelModalMessage = 'Are you sure you want to cancel? Any unsaved changes will be lost.';
    const saveModalMessage = 'Do you want to save your changes to the lyrics?';
    const instrumentalModalMessage = 'Are you sure you want to mark this song as instrumental?';
    const verifyModalMessage = 'This will lock the lyrics and grant points to the last contributor. Make sure the lyrics are correct.';
    const deleteModalMessage = 'This will remove the lyrics from the database and deduct points from the last contributor. Are you sure you want to proceed?';

    const isMobile = window.innerWidth <= 768;

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

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        const fetchAlbums = async (trackId) => {
            try {
                const response = await axios.get(`http://192.168.100.8/katalog/beta/api/get-track-albums.php`, {
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

        const fetchVerifierInfo = async (trackId, artistId) => {
            try {
                const verifierInfoResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/verified-lyrics-info.php`, {
                    params: { artistId, trackId },
                });
                const fetchedVerifierInfo = verifierInfoResponse.data;
                setVerifierInfo(fetchedVerifierInfo);
            } catch (error) {
                console.error('Error fetching verifier info:', error);
            }
        };

        const fetchTrackInfo = async () => {
            try {
                const response = await axios.get(`http://192.168.100.8/katalog/beta/api/track-info.php`, {
                    params: { artistVanity, trackVanity },
                });
                const trackData = response.data;
                setTrackInfo(trackData);

                if (trackData) {
                    document.title = `${trackData.artistName} - ${trackData.trackName} lyrics | Katalog`;
                    setIsInstrumental(trackData.isInstrumental);
                    setIsrcs(trackData.isrc.split(', '));

                    // Fetch lyrics for the track
                    const lyricsResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/track-lyrics.php`, {
                        params: { artistId: trackData.trackMainArtistId, trackId: trackData.trackId },
                    });

                    const fetchedLyrics = lyricsResponse.data.lyrics;
                    const contributorDetails = lyricsResponse.data;
                    setLyrics(fetchedLyrics);
                    setRawLyrics(fetchedLyrics);
                    setNewLyrics(fetchedLyrics);
                    setLyricsInfo(contributorDetails);
                    setIsLyricsVerified(lyricsResponse.data.verified);

                    // Check if lyrics are verified before calling fetchVerifierInfo
                    if (lyricsResponse.data.verified === 1) {
                        await fetchVerifierInfo(trackData.trackId, trackData.trackMainArtistId);
                    }

                    await fetchAlbums(trackData.trackId);
                }
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

    const handleInstrumentalChange = () => {
        if (!isInstrumental) {
            setShowInstrumentalModal(true);
        } else {
            setIsInstrumental(false);
            setNewLyrics(rawLyrics);
        }
    };

    const confirmInstrumental = () => {
        setIsInstrumental(true);
        setNewLyrics('@INSTRUMENTAL');
        setShowInstrumentalModal(false); // Close the modal
    };

    const handleOptionsClick = () => {
        setShowMoreOptions(prevShowOptions => !prevShowOptions);
    };

    const handleClickOutside = (event) => {
        if (optionsRef.current && !optionsRef.current.contains(event.target)) {
            setShowMoreOptions(false);
        }
    };

    useEffect(() => {
        // Attach the event listener when options are shown
        if (showMoreOptions) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            // Clean up event listener
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMoreOptions]);

    const handleVerifyClick = () => {
        setShowVerifyModal(true); // Show save confirmation modal
    };

    const confirmVerifyLyrics = async () => {
        try {
            // Make an API call to save the updated lyrics
            await axios.post(`http://192.168.100.8/katalog/beta/api/verify-lyrics.php`, {
                trackId: trackInfo.trackId,
                lyricsId: lyricsInfo.lyricsId,
                submitterId: lyricsInfo.lastContributorId
            }, {
                headers: {
                    Authorization: `Bearer ${userToken}` // Set the Authorization header
                }
            });
        } catch (error) {
            console.error('Error verifying lyrics:', error);
            showToast('There was an error verifying these lyrics. Please try again.', 'error');
        }
        showToast('Lyrics successfully verified!', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 2000); // Wait 2 seconds to allow the user to see the toast
    }

    const handleDeleteClick = () => {
        setShowDeleteModal(true); // Show save confirmation modal
    };

    const confirmDeleteLyrics = async () => {
        try {
            await axios.post(`http://192.168.100.8/katalog/beta/api/delete-lyrics.php`, {
                trackId: trackInfo.trackId,
                lyricsId: lyricsInfo.lyricsId,
                submitterId: lyricsInfo.lastContributorId
            }, {
                headers: {
                    Authorization: `Bearer ${userToken}` // Set the Authorization header
                }
            });
        } catch (error) {
            console.error('Error deleting lyrics:', error);
            showToast('There was an error deleting these lyrics. Please try again.', 'error');
        }
        showToast('Lyrics successfully deleted!', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 2000); // Wait 2 seconds to allow the user to see the toast
    }

    const handleSaveClick = () => {
        setShowSaveModal(true); // Show save confirmation modal
    };

    const confirmSaveLyrics = async () => {
        let languageResult = null;
        if (newLyrics !== "@INSTRUMENTAL") {
            try {
                languageResult = await detectlanguage.detectCode(newLyrics);
            } catch (error) {
                console.error("Error detecting language:", error);
            }
        }
        try {
            // Make an API call to save the updated lyrics
            await axios.post(`http://192.168.100.8/katalog/beta/api/update-lyrics.php`, {
                trackId: trackInfo.trackId,
                newLyrics,
                languageResult
            }, {
                headers: {
                    Authorization: `Bearer ${userToken}` // Set the Authorization header
                }
            });
            setLyrics(newLyrics); // Update the displayed lyrics with the new lyrics
            setRawLyrics(newLyrics); // Update the raw lyrics
            setShowSaveModal(false);
            setIsEditing(false); // Exit editing mode
            showToast('Lyrics successfully saved!', 'success');

            setTimeout(() => {
                window.location.reload();
            }, 2000); // Wait 2 seconds to allow the user to see the toast
        } catch (error) {
            console.error('Error saving lyrics:', error);
        }
    }

    const handleCancelClick = () => {
        setShowCancelModal(true); // Show cancel confirmation modal
    };

    const confirmCancelEditing = () => {
        setIsEditing(false);
        setNewLyrics(rawLyrics);
        setShowCancelModal(false);
    };

    const formattedLyrics = lyrics.replace(/@(.*?)(\n|$)/g, (_, tag) => `<span class="lyrics-tag">${tag.trim().toUpperCase()}</span>\n`);
    const filteredIsrcs = isrcs.filter(isrc => isrc !== "N/A" || isrcs.length === 1);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' };

        const formattedDate = date.toLocaleString('en-US', options);
        const [datePart, timePart] = formattedDate.split(', ');
        return `${datePart}, ${timePart}`;
    };

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

    const isUserAdmin = userHierarchy === 1;
    const isUserMember = userHierarchy === 3;
    const hasLyrics = lyricsInfo.lyrics;
    const isLyricsAdminLocked = lyricsInfo.userHierarchy === 1;
    // const isLyricsMemberDone = lyricsInfo.userHierarchy === 3;
    // const isLyricsEditableByAdmin = userHierarchy === lyricsInfo.userHierarchy && userHierarchy === 1;
    // const isLyricsEditableByUser = userHierarchy === lyricsInfo.userHierarchy && userHierarchy === 3;

    return (
        <div>
            <MenuBar />
            <div className="lyrics-page-container">
                {toast.show && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
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
                </div>
                <iframe
                    className="spotify-embed"
                    style={{ borderRadius: "12px", width: "100%", height: "100", marginBottom: "0px", marginTop: "-10px" }}
                    src={`https://open.spotify.com/embed/track/${trackInfo.trackSpotifyId}?utm_source=generator&theme=1`}
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>

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
                                    <span>Mark as instrumental</span>
                                </label>
                                <div style={{ marginLeft: 'auto' }}>
                                    {isUserAdmin && lyrics && (
                                        <button className="more-options-lyrics-button" onClick={handleOptionsClick}>
                                            {isMobile ? 'More' : 'More options'}
                                        </button>)}
                                    {showMoreOptions && (
                                        <>
                                            <div ref={optionsRef} className="options-overlay">
                                                <ul
                                                    onClick={!isLyricsVerified ? handleVerifyClick : undefined}
                                                    className={isLyricsVerified ? "disabled" : ""}
                                                    title={isLyricsVerified ? "Lyrics are already verified." : ""}
                                                >
                                                    Verify lyrics
                                                </ul>
                                                <Modal
                                                    isOpen={showVerifyModal}
                                                    onClose={() => setShowVerifyModal(false)}
                                                    onConfirm={confirmVerifyLyrics}
                                                    message={verifyModalMessage}
                                                />
                                                <ul onClick={handleDeleteClick}>Delete lyrics</ul>
                                                <Modal
                                                    isOpen={showDeleteModal}
                                                    onClose={() => setShowDeleteModal(false)}
                                                    onConfirm={confirmDeleteLyrics}
                                                    message={deleteModalMessage}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <button className="save-lyrics-button" onClick={handleSaveClick} disabled={newLyrics === ''} title={newLyrics === '' ? "You haven't entered some lyrics yet." : ""}>
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
                            <div className="edit-lyrics-button-container">
                                {userToken && (
                                    <button
                                        className="edit-lyrics-button"
                                        onClick={handleEditClick}
                                        disabled={(hasLyrics && isLyricsAdminLocked && isUserMember)}
                                        title={(hasLyrics && isLyricsAdminLocked && isUserMember ? 'This song is locked by an administrator.' : "")}
                                    >
                                        {hasLyrics ? (isLyricsAdminLocked ? (isUserAdmin ? 'Edit lyrics' : 'Locked lyrics') : 'Edit lyrics') : 'Add lyrics'}
                                    </button>
                                )}
                            </div>

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
                                    <td>
                                        {lyricsInfo ? (
                                            <Link to={`/user/${lyricsInfo.userName}`} style={{ textDecoration: 'none', color: 'gray' }}>
                                                {`${lyricsInfo.userName} ${userToken ? `(${lyricsInfo.firstName} ${lyricsInfo.lastName})` : ''} [${lyricsInfo.userType}]`}
                                            </Link>
                                        ) : 'Unknown'}
                                    </td>
                                </tr>
                                {isLyricsVerified === 1 && (
                                    <tr>
                                        <td>Verified by</td>
                                        <td>
                                            {verifierInfo ? (
                                                <Link to={`/user/${verifierInfo.verifierUserName}`} style={{ textDecoration: 'none', color: 'gray' }}>
                                                    {`${verifierInfo.verifierUserName} ${userToken ? `(${verifierInfo.verifierFirstName} ${verifierInfo.verifierLastName})` : ''} [${verifierInfo.verifierUserType}]`}
                                                </Link>
                                            ) : 'Unknown'}
                                        </td>
                                    </tr>
                                )}
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
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancelEditing}
                message={cancelModalMessage}
            />

            <Modal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onConfirm={confirmSaveLyrics}
                message={saveModalMessage}
            />

            {showInstrumentalModal && (
                <Modal
                    isOpen={showInstrumentalModal}
                    onClose={() => setShowInstrumentalModal(false)}
                    onConfirm={confirmInstrumental}
                    message={instrumentalModalMessage}
                />
            )}
        </div>
    );
}

export default LyricsPage;
