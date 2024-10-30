import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import './ArtistPage.css';

function ArtistPage() {
    const { artistVanity } = useParams();
    const [artistInfo, setArtistInfo] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [relatedArtists, setRelatedArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAlbums, setShowAlbums] = useState(true);
    const [showTracks, setShowTracks] = useState(false);

    useEffect(() => {
        const fetchArtistInfo = async () => {
            try {
                // Fetch artist information based on artistVanity
                const response = await axios.get(`http://192.168.100.8/katalog/beta/api/artist-info.php`, {
                    params: { artistVanity },
                });
                const artistData = response.data;
                setArtistInfo(artistData);

                if (artistData) {
                    document.title = `${artistData.artistName} | Katalog`;
                }

                const tracksResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/artist-tracks.php`, {
                    params: { artistVanity },
                });
                setTracks(tracksResponse.data.tracks);
                console.log(tracksResponse.data.tracks);

                const albumsResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/artist-albums.php`, {
                    params: { artistVanity },
                });
                setAlbums(albumsResponse.data.albums);
                console.log(albumsResponse.data.albums);

                const relatedArtistsResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/related-artists.php`, {
                    params: { artistVanity },
                });
                setRelatedArtists(relatedArtistsResponse.data.artists);
                console.log(relatedArtistsResponse.data.artists);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching artist info or tracks:', error);
                setLoading(false);
            }
        };
        fetchArtistInfo();
    }, [artistVanity]);

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="artist-page-container">
                    <p>Working on it!</p>
                </div>
            </div>
        );
    }

    if (!artistInfo) {
        return (
            <div>
                <MenuBar />
                <div className="artist-page-container">
                    <p>This artist doesn't exist.</p>
                </div>
            </div>
        );
    }

    function formatAlbumType(albumType) {
        switch (albumType) {
            case 'ep':
                return 'EP';
            case 'single':
                return 'Single';
            case 'album':
                return 'Album';
            case 'compilation':
                return 'Compilation';
            default:
                return albumType;
        }
    }

    function formatReleaseDate(releaseDate) {
        const date = new Date(releaseDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    return (
        <div>
            <MenuBar />
            <div className="artist-page-container">
                <div className="dynamic-background" style={{ backgroundImage: `url(${artistInfo.artistPictureUrl})` }}></div>
                <div className="artist-info">
                    <img
                        src={artistInfo.artistPictureUrl ? artistInfo.artistPictureUrl : '/assets_public/music-artist.svg'}
                        alt="artist"
                        className="artist-picture"
                    />
                    <div className="artist-details">
                        <h1 className="artist-name">{artistInfo.artistName}</h1>
                        {artistInfo.artistSpotifyId && (
                            <span className="artist-spotify-link">
                                <a href={`https://open.spotify.com/artist/${artistInfo.artistSpotifyId}`} target="_blank" rel="noopener noreferrer">
                                    <FontAwesomeIcon icon={faSpotify} className="spotify-icon" />
                                </a>
                            </span>
                        )}
                    </div>

                </div>
                <div className="albums-section">
                    <h3 onClick={() => setShowAlbums(!showAlbums)} className="toggle-header">
                        Albums by {artistInfo.artistName} {showAlbums ? '▼' : '►'}
                    </h3>
                    {showAlbums && (
                        albums.length > 0 ?
                            (<ul className="album-list">
                                {albums.map((album, index) => (
                                    <li key={`${album.albumSpotifyId}-${index}`}>
                                        <a href={`/album/${album.artistVanity}/${album.albumVanity}`}>
                                            <img src={album.albumCoverUrl} alt={album.albumName} className="album-cover" />
                                            <span className="album-name">{album.albumName}</span><br />
                                            <small className="album-details"><span>{formatAlbumType(album.albumType)} | {formatReleaseDate(album.releaseDate)}</span></small>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            ) : (
                                <p>There are no albums listed under this artist.</p>
                            )
                    )
                    }
                </div>
                <div className="tracks-section">
                    <h3 onClick={() => setShowTracks(!showTracks)} className="toggle-header">
                        Songs by {artistInfo.artistName} {showTracks ? '▼' : '►'}
                    </h3>
                    {showTracks && (
                        tracks.length > 0 ? (
                            <ul className="track-list">
                                {tracks.reduce((accumulator, track) => {
                                    // Check if the trackId already exists in the accumulator
                                    if (!accumulator.some(item => item.trackId === track.trackId)) {
                                        accumulator.push(track); // Add the track if it's not already present
                                    }
                                    return accumulator; // Return the accumulator for the next iteration
                                }, []).map((track, index) => (
                                    <div className="track-list-div" key={`${track.trackId}-${index}`}>
                                        <img src={track.albumCoverUrl} alt={track.albumName} className="track-album-cover" />
                                        <div className="track-list-info">
                                            <a href={`/lyrics/${track.trackMainArtistId}/${track.trackId}`}>{track.trackName}</a>
                                            <small>{track.artistName}</small>
                                        </div>
                                    </div>
                                ))}
                            </ul>
                        ) : (
                            <p>There are no tracks listed under this artist.</p>
                        )
                    )}
                </div>
                <div className="related-artists-section">
                    <h3>Related Artists</h3>
                    <ul className="related-artist-list">
                        {relatedArtists.length > 0 ? (
                            relatedArtists.map((artist, index) => (
                                <li key={`${artist.artistVanity}-${index}`} className="related-artist-item">
                                    <a href={`/artist/${artist.artistVanity}`}>
                                        <img src={artist.artistPictureUrl || '/assets_public/music-artist.svg'}
                                            alt={artist.artistName}
                                            className="related-artist-picture" /><br />
                                        <span>{artist.artistName}</span>
                                    </a>
                                </li>
                            ))
                        ) : (
                            <li>No related artists found.</li> // Message for no related artists
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ArtistPage;
