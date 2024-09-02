import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './albumImporter.css';
import { getSpotifyAccessToken } from '../spotifyAuth';

function AlbumImporter() {
    const [spotifyAlbumId, setSpotifyAlbumId] = useState('');
    const [albumData, setAlbumData] = useState(null);
    const [trackExternalIDs, setTrackExternalIDs] = useState([]);
    const [allArtistData, setAllArtistData] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [timer, setTimer] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        // Fetch the timer details from the server when the component mounts
        const fetchTimer = async () => {
            try {
                const response = await axios.get('http://localhost/katalog/beta/api/timer.php?type=album');
                const expiryTime = response.data.expiryTime;
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (expiryTime > currentTime) {
                    setTimer(expiryTime - currentTime);
                    setIsButtonDisabled(true);
                    startCountdown(expiryTime - currentTime);
                }
            } catch (error) {
                console.error('Error fetching timer:', error);
            }
        };

        fetchTimer();
    }, []);

    const startCountdown = (initialTime) => {
        setTimer(initialTime);
        setIsButtonDisabled(true);
    };

    useEffect(() => {
        if (timer > 0) {
            intervalRef.current = setInterval(() => {
                setTimer((prevTimer) => {
                    if (prevTimer <= 1) {
                        clearInterval(intervalRef.current);
                        setIsButtonDisabled(false);
                        return 0;
                    }
                    return prevTimer - 1;
                });
            }, 1000);
        }

        // Cleanup function to clear the interval
        return () => clearInterval(intervalRef.current);
    }, [timer]);

    const disableButtonForFiveMinutes = async () => {
        const fiveMinutes = 300;
        const expiryTime = Math.floor(Date.now() / 1000) + fiveMinutes;
        setIsButtonDisabled(true);
        startCountdown(fiveMinutes);

        // Store the expiry time in the backend
        try {
            await axios.post('http://localhost/katalog/beta/api/timer.php', {
                type: 'album',
                expiryTime: expiryTime
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error setting timer:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        disableButtonForFiveMinutes();

        const filteredSpotifyAlbumId = (() => {
            if (spotifyAlbumId.startsWith('spotify:album:')) {
                return spotifyAlbumId.replace('spotify:album:', '');
            } else if (spotifyAlbumId.includes('open.spotify.com/album/')) {
                const match = spotifyAlbumId.match(/album\/([a-zA-Z0-9]+)(\?|$)/);
                return match ? match[1] : spotifyAlbumId;
            } else {
                return spotifyAlbumId;
            }
        })();

        try {
            const accessToken = await getSpotifyAccessToken();

            const spotifyAlbumResponse = await axios.get(`https://api.spotify.com/v1/albums/${filteredSpotifyAlbumId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const albumData = spotifyAlbumResponse.data;
            setAlbumData(albumData);

            const trackIds = albumData.tracks.items.map(track => track.id);
            const tracksData = await fetchMultipleTracks(trackIds, accessToken);
            setTrackExternalIDs(tracksData.map(track => ({
                id: track.id,
                isrc: track.external_ids.isrc || 'N/A',
                upc: track.external_ids.upc || 'N/A',
                ean: track.external_ids.ean || 'N/A'
            })));

            const artistDataArray = await Promise.all(albumData.artists.map(async (artist) => {
                const artistSpotifyResponse = await fetchArtistSpotifyData(artist.id, accessToken);
                return artistSpotifyResponse;
            }));
            setAllArtistData(artistDataArray);

            // Automatically upload album data after fetching
            await uploadData(albumData, artistDataArray, tracksData);

        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMultipleTracks = async (trackIds, accessToken) => {
        try {
            const response = await axios.get(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data.tracks;
        } catch (error) {
            console.error('Error fetching Spotify tracks data:', error);
            setMessage('There was an error fetching Spotify tracks data. Please try again.');
            return [];
        }
    };

    const fetchArtistSpotifyData = async (artistId, accessToken) => {
        try {
            const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching Spotify artist data:', error);
            setMessage('There was an error fetching Spotify artist data. Please try again.');
        }
    };

    const handleError = (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    setMessage("Token expired.");
                    break;
                case 429:
                    setMessage("Rate-limited!");
                    break;
                case 404:
                    setMessage("Invalid link or URI.");
                    break;
                default:
                    setMessage("An error occurred. Please try again.");
            }
        } else {
            setMessage("An error occurred. Please try again.");
        }
    };

    const uploadData = async (albumData, allArtistData, tracksData) => {
        if (!albumData) {
            console.error('No data to upload.');
            setMessage('No data to upload.');
            return;
        }

        const accessToken = await getSpotifyAccessToken();

        const totalDurationMs = albumData.tracks.items
            .map(track => track.duration_ms)
            .reduce((acc, duration) => acc + duration, 0);

        const albumDuration = new Date(totalDurationMs).toISOString().substr(11, 8);
        const albumTrackCount = albumData.tracks.items.length;

        let albumReleaseType = albumData.album_type;

        if (albumReleaseType === 'single' && (albumTrackCount > 2 && albumTrackCount < 7) && totalDurationMs >= 600000 && totalDurationMs <= 1800000) {
            albumReleaseType = 'ep';
        }

        const data = {
            album_id: albumData.id,
            album_name: albumData.name,
            album_release_date: albumData.release_date,
            album_release_type: albumReleaseType,
            album_duration: albumDuration,
            album_label: albumData.label,
            album_track_count: albumTrackCount,
            album_discs_count: Math.max(...albumData.tracks.items.map(track => track.disc_number)),
            album_cover_url: albumData.images && albumData.images.length > 0 ? albumData.images[0].url : null,
            album_artists: allArtistData.map((artistData) => ({
                album_artist_name: artistData.name,
                album_artist_id: artistData.id,
                artist_picture_url: artistData.images && artistData.images.length > 0 ? artistData.images[0].url : null
            })),
            album_tracks: await Promise.all(albumData.tracks.items.map(async track => {
                const trackArtists = await Promise.all(track.artists.map(async (artist) => {
                    const artistData = await fetchArtistSpotifyData(artist.id, accessToken);
                    return {
                        track_artist_name: artist.name,
                        track_artist_id: artist.id,
                        track_artist_role: track.artists.indexOf(artist) === 0 ? 'Primary' : 'Featuring',
                        track_artist_picture_url: artistData.images && artistData.images.length > 0 ? artistData.images[0].url : null
                    };
                }));

                const externalIDs = getExternalIDsForTrack(track.id);

                return {
                    track_id: track.id,
                    track_name: track.name,
                    track_duration: new Date(track.duration_ms).toISOString().substr(14, 5),
                    track_number: track.track_number,
                    disc_number: track.disc_number,
                    explicit: track.explicit ? 'Yes' : 'No',
                    isrc: externalIDs.isrc,
                    upc: externalIDs.upc,
                    ean: externalIDs.ean,
                    track_artists: trackArtists
                };
            }))
        };

        console.log(data);

        try {
            const response = await fetch('http://localhost/katalog/beta/api/importAlbum.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const text = await response.text(); // Get the raw response as text
            console.log('Raw response:', text);

            const result = JSON.parse(text);
            if (response.ok) {
                console.log('Data passed successfully: ', result);
                setMessage(
                    result.status === 'success'
                        ? 'This album and its corresponding information has been added successfully to the database.'
                        : result.status === 'error'
                            ? result.message
                            : 'Unexpected status received.'
                );
            } else {
                console.error('Data passing error:', result.error || 'Unexpected error occurred');
                setMessage(result.error || 'An unexpected error occurred.');
            }
        } catch (error) {
            console.error('Fetch error:', error.message || error);
            setMessage('Fetch error: ' + (error.message || error));
        } finally {
            setLoading(false);
        }
    };

    const getExternalIDsForTrack = (trackId) => {
        const track = trackExternalIDs.find(t => t.id === trackId);
        return {
            isrc: track ? track.isrc : 'N/A',
            upc: track ? track.upc : 'N/A',
            ean: track ? track.ean : 'N/A'
        };
    };

    return (
        <div className="import-component">
            <div className="import-box">
                <div className="import-form">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Enter Spotify Album Link or URI"
                            className="inputField"
                            value={spotifyAlbumId}
                            onChange={(e) => setSpotifyAlbumId(e.target.value)}
                        />
                        <button
                            title={isButtonDisabled ? "To prevent rate-limiting, this process is only allowed with a 5-minute interval." : ''}
                            type="submit"
                            className="submitButton"
                            disabled={loading || isButtonDisabled}
                        >
                            {isButtonDisabled ? `Submit (Wait ${Math.floor(timer / 60)}m ${timer % 60}s)` : 'Submit'}
                        </button>
                    </form>
                </div>

                {loading && <p className="message">Working on it!</p>}
                {message && <p className="message">{message}</p>}

                <div className="information">
                    <AlbumInformation albumData={albumData} />
                    <TrackList albumData={albumData} getExternalIDsForTrack={getExternalIDsForTrack} />
                    <ArtistInformation allArtistData={allArtistData} />
                </div>
            </div>
        </div>
    );
}

function AlbumInformation({ albumData }) {
    if (!albumData) return null;
    const totalDurationMs = albumData.tracks.items
        .map(track => track.duration_ms)
        .reduce((acc, duration) => acc + duration, 0);

    let displayAlbumType = albumData.album_type;
    const albumTrackCount = albumData.tracks.items.length;

    if (albumData.album_type === 'single' && (albumTrackCount > 2 && albumTrackCount < 7) && totalDurationMs >= 600000 && totalDurationMs <= 1800000) {
        displayAlbumType = 'ep';
    }

    return (
        <div className="album-information">
            <h3>Album Information</h3>
            <div className="album-data">
                <div className="album-info">
                    {albumData.images.length > 0 && (
                        <div>
                            <img src={albumData.images[0].url} alt="Album cover" className="album-image" />
                        </div>
                    )}
                    <h3 className="album-name-type">{albumData.name} <span className="album-type"><small>{displayAlbumType}</small></span></h3>
                    <p>Artist(s): {
                        albumData.artists.map((artist, index) => (
                            <span key={artist.id} title={`Spotify Artist ID: ${artist.id}`}>
                                {artist.name}
                                {index < albumData.artists.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </p>
                    <p>Released on: {new Date(albumData.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p>Tracks: {albumTrackCount}</p>
                    <p>Discs: {Math.max(...albumData.tracks.items.map(track => track.disc_number))}</p>
                    <p>Duration: {new Date(totalDurationMs).toISOString().substr(11, 8)}</p>
                    <p>Label: {albumData.label}</p>
                </div>
            </div>
        </div>
    );
}

function TrackList({ albumData, getExternalIDsForTrack }) {
    if (!albumData || !albumData.tracks.items.length) return null;

    return (
        <div className="tracks-information">
            <h3>Album Tracks</h3>
            <div className="tracks-data">
                <table className="tracks-table">
                    <thead>
                        <tr>
                            <th rowSpan="2">Track #</th>
                            <th rowSpan="2">Track Name</th>
                            <th rowSpan="2">Track Artist(s)</th>
                            <th rowSpan="2">Duration</th>
                            <th rowSpan="2">Explicit</th>
                            <th colSpan="3">External IDs</th>
                        </tr>
                        <tr>
                            <th>ISRC</th>
                            <th>UPC</th>
                            <th>EAN</th>
                        </tr>
                    </thead>
                    {Array.from(new Set(albumData.tracks.items.map(track => track.disc_number))).map(discNumber => (
                        <tbody key={discNumber}>
                            <tr>
                                <td colSpan="8"><strong>Disc {discNumber}</strong></td>
                            </tr>
                            {albumData.tracks.items
                                .filter(track => track.disc_number === discNumber)
                                .map((track, index) => (
                                    <tr key={track.id}>
                                        <td>{index + 1}</td>
                                        <td><span title={`Spotify Track ID: ${track.id}`}>{track.name}</span></td>
                                        <td>{
                                            track.artists.map((artist, index) => (
                                                <span key={artist.id} title={`Spotify ID: ${artist.id}`}>
                                                    {artist.name}
                                                    {index < track.artists.length - 1 ? ', ' : ''}
                                                </span>
                                            ))}
                                        </td>
                                        <td>{new Date(track.duration_ms).toISOString().substr(14, 5)}</td>
                                        <td>{track.explicit ? 'Yes' : 'No'}</td>
                                        <td>{getExternalIDsForTrack(track.id).isrc}</td>
                                        <td>{getExternalIDsForTrack(track.id).upc}</td>
                                        <td>{getExternalIDsForTrack(track.id).ean}</td>
                                    </tr>
                                ))}
                        </tbody>
                    ))}
                </table>
            </div>
        </div>
    );
}

function ArtistInformation({ allArtistData }) {
    if (!allArtistData.length) return null;

    return (
        <div className="artist-information">
            <h3>Artist Information</h3>
            <div className="artist-data">
                {allArtistData.map((artistData, index) => (
                    <div key={index} className="artist-info">
                        {artistData.images.length > 0 && (
                            <div>
                                <img src={artistData.images[0].url} alt="Artist image" className="artist-image" />
                            </div>
                        )}
                        <h3>{artistData.name}</h3>
                        <p>Genres: {artistData.genres.join(', ')}</p>
                        <p>Spotify ID: {artistData.id}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AlbumImporter;
