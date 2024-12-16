import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../../MenuBar';
import NotificationToast from '../../NotificationToast';
import { getSpotifyAccessToken } from '../../spotifyAuth';
import './artistEditor.css';

function ArtistEditor() {
    const { artistId } = useParams();
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [artistInfo, setArtistInfo] = useState(null);
    const [legacyArtistVanity, setLegacyArtistVanity] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArtistInfo = async () => {
            const userToken = localStorage.getItem('access_token');
            try {
                const artistInfoResponse = await axios.get(`/backend/editor-get-artist-info.php`, {
                    params: { artistId },
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });
                const artistData = artistInfoResponse.data;
                setLegacyArtistVanity(artistData.artistVanity);
                setArtistInfo(artistData);

                if (artistData) {
                    document.title = `${artistData.artistName} - Artist information | Katalog`;
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching artist info:', error);
                setLoading(false);
            }
        };
        fetchArtistInfo();
    }, [artistId]);

    const fetchArtistInfo = async (artistSpotifyId) => {
        try {
            const accessToken = await getSpotifyAccessToken();
            const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistSpotifyId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const artistData = artistResponse.data;
            setArtistInfo(prevState => ({
                ...prevState,
                artistName: artistData.name,
                artistVanity: artistData.name
                    .replace(/[^a-zA-Z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, ''),
                artistPictureUrl: artistData.images?.[0]?.url,
            }));
            setToast({ show: true, message: 'Artist information fetched successfully!', type: 'success' });
        } catch (error) {
            console.error('Error fetching artist information:', error);
            setToast({ show: true, message: 'Error fetching artist information.', type: 'error' });
        }
    };

    const checkArtistVanityExists = async (artistVanity) => {
        const userToken = localStorage.getItem('access_token');
        try {
            if (artistVanity !== legacyArtistVanity) {
                const response = await axios.get(`/backend/editor-check-vanity.php?type=artist`, {
                    params: { artistVanity },
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });
                const vanityResponse = response.data;
                if (vanityResponse.status === 'error') {
                    setToast({ show: true, message: 'Artist vanity already exists.', type: 'error' });
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        } catch (error) {
            console.error('Error checking artist vanity:', error);
            setToast({ show: true, message: 'Error checking artist vanity.', type: 'error' });
            return false;
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        if (artistInfo.artistVanity.startsWith('-')) {
            setToast({ show: true, message: 'Artist vanity cannot start with a dash.', type: 'error' });
            setIsSaving(false);
            return;
        }

        if (artistInfo.artistVanity.includes('--')) {
            setToast({ show: true, message: 'Artist vanity cannot contain consecutive dashes.', type: 'error' });
            setIsSaving(false);
            return;
        }

        if (!artistInfo.artistVanity.trim()) {
            setToast({ show: true, message: 'Artist vanity cannot be empty.', type: 'error' });
            setIsSaving(false);
            return;
        }

        try {
            if (await checkArtistVanityExists(artistInfo.artistVanity)) {
                const dataToSend = {
                    artistId: artistId,
                    artistName: artistInfo.artistName,
                    artistVanity: artistInfo.artistVanity,
                    artistPictureUrl: artistInfo.artistPictureUrl,
                };
                console.log(dataToSend);
                const response = await axios.post(`/backend/editor-update-artist-info.php`,
                    dataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access_token')}`
                        }
                    }
                );
                if (response.data.status === "success") {
                    setToast({ show: true, message: 'Artist information saved!', type: 'success' });
                    setTimeout(() => {
                        navigate(`/artist/${artistInfo.artistVanity}`);
                    }, 2000);
                } else if (response.data.status === "error") {
                    setToast({ show: true, message: response.data.message, type: 'error' });
                }
            }
        } catch (error) {
            setToast({ show: true, message: 'Error saving artist.', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="artist-info-page-container">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!artistInfo) {
        return (
            <div>
                <MenuBar />
                <div className="artist-info-page-container">
                    <p className="artist-not-existing">This artist doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <MenuBar />
            <div className="artist-info-page-container">
                <div className="dynamic-background" style={{ backgroundImage: `url(${artistInfo.artistPictureUrl})` }}></div>
                {toast.show && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
                <div className="artist-main-information">
                    <img src={artistInfo.artistType === "Multiple" ? '/assets_public/person.svg' : (artistInfo.artistPictureUrl ?? '/assets_public/person.svg')} alt={artistInfo.artistName} className="artist-picture" />
                    <Link style={{ textDecoration: 'none' }} to={`/artist/${legacyArtistVanity}`}>
                        <h2 className="artist-name">{artistInfo.artistName}</h2>
                    </Link>
                </div>
                <div className="artist-information-form">
                    <h3>Edit artist information</h3>
                    <form>
                        <div className="form-group-row">
                            <div className="form-group">
                                <label htmlFor="artistName">Artist name</label>
                                <input
                                    type="text"
                                    id="artistName"
                                    value={artistInfo.artistName}
                                    onChange={(e) => {
                                        const artistName = e.target.value;
                                        const artistVanity = artistName
                                            .replace(/[^a-zA-Z0-9]+/g, '-')
                                            .replace(/^-+|-+$/g, '');
                                        setArtistInfo({ ...artistInfo, artistName, artistVanity });
                                    }}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="artistVanity">Artist vanity</label>
                                <input
                                    type="text"
                                    id="artistVanity"
                                    value={artistInfo.artistVanity}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '');
                                        if (value.endsWith('--')) {
                                            if (e.target.value === '-') {
                                                return;
                                            };
                                        }
                                        setArtistInfo({ ...artistInfo, artistVanity: value });
                                    }}
                                    className="form-control"
                                />
                            </div>
                            {artistInfo.artistType !== "Multiple" &&
                                <div className="form-group">
                                    <label htmlFor="artistSpotifyId">Artist Spotify ID</label>
                                    <input
                                        type="text"
                                        id="artistSpotifyId"
                                        value={artistInfo.artistSpotifyId}
                                        disabled
                                        className="form-control"
                                    />
                                </div>
                            }
                        </div>
                    </form>
                    <div className="buttons">
                        {artistInfo.artistType !== "Multiple" && <button type="button" className="fetch-artist-info-button" onClick={() => fetchArtistInfo(artistInfo.artistSpotifyId)}>Fetch info from Spotify</button>}
                        <button type="button" className="go-back-button" onClick={() => navigate(`/artist/${legacyArtistVanity}`)}>Cancel and go back</button>
                        <button type="button" className="save-button" onClick={handleSave}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ArtistEditor;
