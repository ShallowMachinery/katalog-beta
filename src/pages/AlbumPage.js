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
                const response = await axios.get(`http://192.168.100.8/katalog/beta/api/album-info.php`, {
                    params: { albumVanity, artistVanity },
                });

                const albumData = response.data;
                console.log(albumData);
                setAlbumInfo(albumData);

                if (albumData && albumData.status !== 'error') {
                    document.title = `${albumData.albumName} album by ${albumData.artistName} | Katalog`;
                }

                // Fetch tracks in the album
                const tracksResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/album-tracks.php`, {
                    params: { albumVanity, artistVanity },
                });
                setTracks(tracksResponse.data.tracks);

                const multiDisc = tracksResponse.data.tracks.some(track => track.discNumber !== 1);
                setIsMultiDisc(multiDisc);

                const moreAlbumsResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/artist-albums.php`, {
                    params: { artistVanity },
                });
                setMoreAlbums(moreAlbumsResponse.data.albums);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    setAlbumInfo(null);
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
                                    <div key={track.trackId} className="track-list-item">
                                        <span className="track-number">{track.trackNumber}</span>
                                        <div className="track-info">
                                            <Link to={`/lyrics/${track.trackMainArtistId}/${track.trackId}`}>
                                                {track.trackName}
                                            </Link><br />
                                            <small>{track.artistName}</small>
                                        </div>
                                        <span className="track-duration">{track.trackDuration}</span>
                                    </div>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="more-albums-section">
                    {/* Check if the artist has more than one album */}
                    {moreAlbums.length > 1 && (
                        <>
                            <h2 className="more-albums-header">More Albums by {albumInfo.artistName}</h2>
                            <ul className="more-albums-list">
                                {shuffleArray(moreAlbums)
                                    .filter(album => album.albumId !== albumInfo.albumId) // Exclude the current album
                                    .slice(0, 6) // Limit to 6 albums
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
