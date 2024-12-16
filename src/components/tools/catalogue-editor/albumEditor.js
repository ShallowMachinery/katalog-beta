import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../../MenuBar';
import Modal from '../../Modal';
import NotificationToast from '../../NotificationToast';
import { getSpotifyAccessToken } from '../../spotifyAuth';
import './albumEditor.css';

function AlbumEditor() {
    const { albumId } = useParams();
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [albumInfo, setAlbumInfo] = useState(null);
    const [albumTracks, setAlbumTracks] = useState([]);
    const [legacyAlbumVanity, setLegacyAlbumVanity] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMultiDisc, setIsMultiDisc] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAlbumInfo = async () => {
            const userToken = localStorage.getItem('access_token');
            try {
                const albumInfoResponse = await axios.get(`/backend/editor-get-album-info.php`, {
                    params: { albumId },
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });
                const albumData = albumInfoResponse.data;
                setLegacyAlbumVanity(albumData.albumVanity);
                setAlbumInfo(albumData);

                if (albumData) {
                    document.title = `${albumData.albumName} by ${albumData.artistName} - Album information | Katalog`;
                }

                const albumTracksResponse = await axios.get(`/backend/editor-get-album-tracks.php`, {
                    params: { albumId },
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });
                const albumTracks = albumTracksResponse.data;
                setAlbumTracks(albumTracks);

                const isMultiDisc = albumTracks.some(track => track.discNumber !== 1);
                setIsMultiDisc(isMultiDisc);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching album info:', error);
                setLoading(false);
            }
        };
        fetchAlbumInfo();
    }, [albumId]);

    const fetchAlbumInfo = async (albumSpotifyId) => {
        try {
            const accessToken = await getSpotifyAccessToken();
            const albumResponse = await axios.get(`https://api.spotify.com/v1/albums/${albumSpotifyId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const albumData = albumResponse.data;
            setAlbumInfo(prevState => ({
                ...prevState,
                albumName: albumData.name,
                albumVanity: albumData.name
                    .replace(/[^a-zA-Z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, ''),
                albumCoverUrl: albumData.images?.[0]?.url,
                albumLabel: albumData.label,
                albumReleaseDate: albumData.release_date,
            }));
            console.log(albumData);
            setToast({ show: true, message: 'Album information fetched successfully!', type: 'success' });
        } catch (error) {
            console.error('Error fetching album information:', error);
            setToast({ show: true, message: 'Error fetching album information.', type: 'error' });
        }
    };

    const checkAlbumVanityExists = async (albumVanity, artistId) => {
        const userToken = localStorage.getItem('access_token');
        try {
            if (albumVanity !== legacyAlbumVanity) {
                const response = await axios.get(`/backend/editor-check-vanity.php?type=album`, {
                    params: { albumVanity, artistId },
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });
                const vanityResponse = response.data;
                console.log(vanityResponse);
                if (vanityResponse.status === 'error') {
                    setToast({ show: true, message: 'Album vanity already exists.', type: 'error' });
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        } catch (error) {
            console.error('Error checking album vanity:', error);
            setToast({ show: true, message: 'Error checking album vanity.', type: 'error' });
            return false;
        }
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        if (albumInfo.albumVanity.startsWith('-')) {
            setToast({ show: true, message: 'Album vanity cannot start with a dash.', type: 'error' });
            setIsSaving(false);
            return;
        }

        if (albumInfo.albumVanity.includes('--')) {
            setToast({ show: true, message: 'Album vanity cannot contain consecutive dashes.', type: 'error' });
            setIsSaving(false);
            return;
        }

        if (!albumInfo.albumVanity.trim()) {
            setToast({ show: true, message: 'Album vanity cannot be empty.', type: 'error' });
            setIsSaving(false);
            return;
        }

        try {
            if (await checkAlbumVanityExists(albumInfo.albumVanity, albumInfo.artistId)) {
                const dataToSend = {
                    albumId: albumId,
                    albumName: albumInfo.albumName,
                    albumVanity: albumInfo.albumVanity,
                    albumCoverUrl: albumInfo.albumCoverUrl,
                    albumLabel: albumInfo.albumLabel,
                    albumReleaseDate: albumInfo.albumReleaseDate,
                };
                const response = await axios.post(`/backend/editor-update-album-info.php`,
                    dataToSend,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access_token')}`
                        }
                    }
                );
                if (response.data.status === "success") {
                    setToast({ show: true, message: 'Album information saved!', type: 'success' });
                    setTimeout(() => {
                        navigate(`/album/${albumInfo.artistVanity}/${albumInfo.albumVanity}`);
                    }, 2000);
                    setIsSaving(false);
                } else if (response.data.status === "error") {
                    setToast({ show: true, message: response.data.message, type: 'error' });
                    setIsSaving(false);
                }
            }
        } catch (error) {
            setToast({ show: true, message: 'Error saving album.', type: 'error' });
            setIsSaving(false);
        }
    };


    function formatReleaseDate(releaseDate) {
        const date = new Date(releaseDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    const groupedTracks = albumTracks.reduce((acc, track) => {
        if (!acc[track.discNumber]) {
            acc[track.discNumber] = [];
        }
        acc[track.discNumber].push(track);
        return acc;
    }, {});

    
    const deleteAlbumMessage = "Are you sure you want to delete this album? This action is irreversible.";

    const handleDelete = () => {
        setShowDeleteModal(true);
    }

    const confirmDeleteAlbum = async () => {
        const userToken = localStorage.getItem('access_token');
        try {
            const response = await axios.post(`/backend/delete-album.php`, {
                albumId: albumInfo.albumId,
            }, {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            const deleteAlbumResponse = response.data;
            if (deleteAlbumResponse.status === 'success') {
                setShowDeleteModal(false);
                showToast('Album successfully deleted!', 'success');
                setTimeout(() => {
                    navigate(`/artist/${albumInfo.artistVanity}`);
                }, 2000);
            } else {
                setShowDeleteModal(false);
                console.error('Error deleting album:', deleteAlbumResponse.message);
                showToast(deleteAlbumResponse.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting album:', error);
            showToast('There was an error deleting this album. Please try again.', 'error');
        }
    }

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="album-info-page-container">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!albumInfo) {
        return (
            <div>
                <MenuBar />
                <div className="album-info-page-container">
                    <p className="album-not-existing">This album doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <MenuBar />
            <div className="album-info-page-container">
                <div className="dynamic-background" style={{ backgroundImage: `url(${albumInfo.albumCoverUrl})` }}></div>
                {toast.show && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
                <div className="album-main-information">
                    <img src={albumInfo.albumCoverUrl} alt={albumInfo.albumName} className="album-cover" />
                    <div className="album-details">
                        <Link style={{ textDecoration: 'none' }} to={`/album/${albumInfo.artistVanity}/${legacyAlbumVanity}`}>
                            <h1 className="album-name">{albumInfo.albumName} <span className="album-type">{albumInfo.albumReleaseType}</span></h1>
                        </Link>
                        <h2 className="artist-name"><Link style={{ textDecoration: 'none' }} to={`/artist/${albumInfo.artistVanity}`}>{albumInfo.artistName}</Link></h2>
                        <p className="release-date">Released on {formatReleaseDate(albumInfo.albumReleaseDate)}</p>
                    </div>
                </div>
                <div className="album-information-form">
                    <h3>Edit album information</h3>
                    <form>
                        <div className="form-group-row">
                            <div className="form-group">
                                <label htmlFor="albumName">Album name</label>
                                <input
                                    type="text"
                                    id="albumName"
                                    value={albumInfo.albumName}
                                    onChange={(e) => {
                                        const albumName = e.target.value;
                                        const albumVanity = albumName
                                            .replace(/[^a-zA-Z0-9]+/g, '-')
                                            .replace(/^-+|-+$/g, '');
                                        setAlbumInfo({ ...albumInfo, albumName, albumVanity });
                                    }}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="albumVanity">Album vanity</label>
                                <input
                                    type="text"
                                    id="albumVanity"
                                    value={albumInfo.albumVanity}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '');
                                        if (value.endsWith('--')) {
                                            if (e.target.value === '-') {
                                                return;
                                            };
                                        }
                                        setAlbumInfo({ ...albumInfo, albumVanity: value });
                                    }}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="albumSpotifyId">Album Spotify ID</label>
                                <input
                                    type="text"
                                    id="albumSpotifyId"
                                    value={albumInfo.albumSpotifyId}
                                    disabled
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <div className="form-group-row">
                            <div className="form-group" title="To edit this field, edit this in the artist editor.">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <label htmlFor="artistName">Artist name</label>
                                    <Link
                                        to={`/katalog-admin/catalogue-editor/artist/${albumInfo.artistId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="edit-button"
                                    >
                                        Edit artist
                                    </Link>
                                </div>
                                <input
                                    type="text"
                                    id="albumName"
                                    value={albumInfo.artistName}
                                    disabled
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="albumReleaseDate">Release date</label>
                                <input
                                    type="date"
                                    id="albumReleaseDate"
                                    value={albumInfo.albumReleaseDate}
                                    onChange={(e) => {
                                        setAlbumInfo({ ...albumInfo, albumReleaseDate: e.target.value });
                                    }}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="albumLabel">Album label</label>
                                <input
                                    type="text"
                                    id="albumLabel"
                                    value={albumInfo.albumLabel}
                                    onChange={(e) => {
                                        setAlbumInfo({ ...albumInfo, albumLabel: e.target.value });
                                    }}
                                    className="form-control"
                                />
                            </div>
                        </div>
                    </form>
                    <div className="buttons">
                        <button type="button" className="fetch-album-info-button" onClick={() => fetchAlbumInfo(albumInfo.albumSpotifyId)}>Fetch info from Spotify</button>
                        <button type="button" className="delete-album-button" onClick={handleDelete}>Delete album</button>
                    </div>
                    <div className="tracks-section">
                        <h3>Tracks</h3>
                        {Object.keys(groupedTracks).map(discNumber => (
                            <div key={discNumber}>
                                {isMultiDisc && <h3>Disc {discNumber}</h3>}
                                <ul className="track-list">
                                    {groupedTracks[discNumber].map(track => (
                                        <a key={track.trackId} href={`/lyrics/${track.artistVanity}/${track.trackVanity}`}>
                                            <div key={track.trackId} className="track-list-item">
                                                <span className="track-number">{track.trackNumber}</span>
                                                <div className="track-info">
                                                    <span className="track-title">{track.trackName}</span><br />
                                                    <small>{track.artistName}</small>
                                                </div>
                                                <span className="track-duration">{track.trackDuration}</span>
                                                <Link
                                                    to={`/katalog-admin/catalogue-editor/track/${track.trackId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="edit-button"
                                                >
                                                    Edit track
                                                </Link>
                                            </div>
                                        </a>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="buttons">
                        <button type="button" className="go-back-button" onClick={() => navigate(`/album/${albumInfo.artistVanity}/${legacyAlbumVanity}`)}>Cancel and go back</button>
                        <button type="button" className="save-button" onClick={handleSave}>Save</button>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDeleteAlbum}
                message={deleteAlbumMessage}
            />
        </div>
    );
}

export default AlbumEditor;
