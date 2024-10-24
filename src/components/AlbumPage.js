import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import MenuBar from './MenuBar';
import './AlbumPage.css';

function AlbumPage() {
    const { albumVanity, artistVanity } = useParams();
    const [albumInfo, setAlbumInfo] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlbumInfo = async () => {
            try {
                const response = await axios.get(`http://localhost/katalog/beta/api/album-info.php`, {
                    params: { albumVanity, artistVanity },
                });
    
                const albumData = response.data;
                setAlbumInfo(albumData);
    
                if (albumData && albumData.status !== 'error') {
                    document.title = `${albumData.albumName} album by ${albumData.artistName} | Katalog`;
                }
    
                // Fetch tracks in the album
                const tracksResponse = await axios.get(`http://localhost/katalog/beta/api/album-tracks.php`, {
                    params: { albumVanity, artistVanity },
                });
                setTracks(tracksResponse.data.tracks);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    setAlbumInfo(null); // Trigger the "This album doesn't exist" message
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAlbumInfo();
    }, [albumVanity, artistVanity]);

    function formatReleaseDate(releaseDate) {
        const date = new Date(releaseDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="album-page-container">
                    <p>Working on it!</p>
                </div>
            </div>
        );
    }

    if (!albumInfo) {
        return (
            <div>
                <MenuBar />
                <div className="album-page-container">
                    <p>This album doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <MenuBar />
            <div className="album-page-container">
                <div className="dynamic-background" style={{ backgroundImage: `url(${albumInfo.albumCoverUrl})` }}></div>
                <div className="album-info">
                    <img
                        src={albumInfo.albumCoverUrl}
                        alt="album"
                        className="album-cover"
                    />
                    <div className="album-details">
                        <h1 className="album-name">{albumInfo.albumName} <span className="album-type">{albumInfo.albumType}</span></h1>
                        <h2 className="artist-name"><Link style={{ textDecoration: 'none' }} to={`/artist/${artistVanity}`}>{albumInfo.artistName}</Link></h2>
                        <p className="release-date">Released on {formatReleaseDate(albumInfo.releaseDate)}</p>
                    </div>
                </div>

                <div className="tracks-section">
                    <ul className="track-list">
                        {tracks.map(track => (
                            <div key={track.trackId} className="track-list-item">
                                <span className="track-number">{track.trackNumber}</span>
                                <div className="track-info">
                                    <Link to={`/lyrics/${track.artistVanity}/${track.trackVanity}`}>
                                        {track.trackName}
                                    </Link><br />
                                    <small>{track.artistName}</small>
                                </div>
                                <span className="track-duration">{track.trackDuration}</span>
                            </div>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AlbumPage;
