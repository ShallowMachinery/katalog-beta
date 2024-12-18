import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import './AlbumPage.css';

function AlbumPage() {
    const { albumVanity, artistVanity } = useParams();
    const [albumInfo, setAlbumInfo] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [moreAlbums, setMoreAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMultiDisc, setIsMultiDisc] = useState(false);

    useEffect(() => {
        const fetchAlbumInfo = async () => {
            try {
                setLoading(true);
                const [albumInfoResponse, albumTracksResponse, artistAlbumsResponse] = await Promise.all([
                    axios.get(`/backend/album-info.php`, { params: { albumVanity, artistVanity } }),
                    axios.get(`/backend/album-tracks.php`, { params: { albumVanity, artistVanity } }),
                    axios.get(`/backend/artist-albums.php`, { params: { artistVanity } }),
                ]);

                const albumData = albumInfoResponse.data;
                setAlbumInfo(albumData);

                if (albumData && albumData.status !== 'error') {
                    document.title = `${albumData.albumName} album by ${albumData.artistName} | Katalog`;
                } else {
                    setAlbumInfo(null);
                }

                const tracksData = albumTracksResponse.data.tracks;
                setTracks(tracksData);

                const isMultiDisc = tracksData.some(track => track.discNumber !== 1);
                setIsMultiDisc(isMultiDisc);

                setMoreAlbums(artistAlbumsResponse.data.albums);
            } catch (error) {
                console.error("Error fetching album data:", error);
                if (error.response && error.response.status === 404) {
                    setAlbumInfo(null);
                } else {
                    setAlbumInfo(null);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAlbumInfo();
    }, [albumVanity, artistVanity]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    function formatReleaseDate(releaseDate) {
        const date = new Date(releaseDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="album-page-container">
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
                <div className="album-page-container">
                    <p className="album-not-existing">This album doesn't exist.</p>
                </div>
            </div>
        );
    }

    const groupedTracks = tracks.reduce((acc, track) => {
        if (!acc[track.discNumber]) {
            acc[track.discNumber] = [];
        }
        acc[track.discNumber].push(track);
        return acc;
    }, {});

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
                                        </div>
                                    </a>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="more-albums-section">
                    {moreAlbums.length > 1 && (
                        <>
                            <h2 className="more-albums-header">More albums by {albumInfo.artistName}</h2>
                            <ul className="more-albums-list">
                                {shuffleArray(moreAlbums)
                                    .filter(album => album.albumId !== albumInfo.albumId)
                                    .slice(0, 5)
                                    .map(album => (
                                        <li key={album.albumId} className="more-album-item">
                                            <Link to={`/album/${artistVanity}/${album.albumVanity}`}>
                                                <img src={album.albumCoverUrl} alt={album.albumName} className="more-album-cover" /><br />
                                                <span>{album.albumName}</span>
                                            </Link>
                                        </li>
                                    ))}
                            </ul>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}

export default AlbumPage;
