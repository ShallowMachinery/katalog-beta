import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './artistImporter.css';
import { getSpotifyAccessToken } from '../../../spotifyAuth';

function ArtistImporter() {
    const [spotifyArtistId, setSpotifyArtistId] = useState('');
    const [artistData, setArtistData] = useState(null);
    const [albumsData, setAlbumsData] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [timer, setTimer] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        const fetchTimer = async () => {
            try {
                const response = await axios.get(`/backend/timer.php?type=artist`);
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
        return () => clearInterval(intervalRef.current);
    }, [timer]);

    const disableButtonForFifteenMinutes = async () => {
        const fifteenMinutes = 900;
        const expiryTime = Math.floor(Date.now() / 1000) + fifteenMinutes;
        setIsButtonDisabled(true);
        startCountdown(fifteenMinutes);
        try {
            await axios.post(`/backend/timer.php`, {
                type: 'artist',
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
        disableButtonForFifteenMinutes();

        const filteredSpotifyArtistId = (() => {
            if (spotifyArtistId.startsWith('spotify:artist:')) {
                return spotifyArtistId.replace('spotify:artist:', '');
            } else if (spotifyArtistId.includes('open.spotify.com/artist/')) {
                const match = spotifyArtistId.match(/artist\/([a-zA-Z0-9]+)(\?|$)/);
                return match ? match[1] : spotifyArtistId;
            } else {
                return spotifyArtistId;
            }
        })();

        try {
            const accessToken = await getSpotifyAccessToken();

            const spotifyArtistResponse = await axios.get(`https://api.spotify.com/v1/artists/${filteredSpotifyArtistId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const artistData = spotifyArtistResponse.data;
            setArtistData(artistData);
            const allAlbumData = await fetchAndProcessAlbums(filteredSpotifyArtistId, accessToken, artistData.name);
            setAlbumsData(allAlbumData);
            await uploadAlbumsData(allAlbumData, artistData);

        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAndProcessAlbums = async (artistId, accessToken, artistName) => {
        let allAlbumsData = [];
        let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`;

        try {
            while (nextUrl) {
                const response = await axios.get(nextUrl, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                const albumsData = response.data.items;
                allAlbumsData = allAlbumsData.concat(albumsData);
                nextUrl = response.data.next;
            }

            allAlbumsData = await Promise.all(allAlbumsData.map(async (album) => {
                try {
                    const albumDetailsResponse = await axios.get(`https://api.spotify.com/v1/albums/${album.id}`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    });
                    const albumDetails = albumDetailsResponse.data;
                    const trackIDs = albumDetails.tracks.items.map(track => track.id);
                    const externalIDs = await fetchExternalIDs(trackIDs, accessToken);
                    albumDetails.tracks.items.forEach(track => {
                        const externalID = externalIDs.find(id => id.track_id === track.id);
                        track.isrc = externalID ? externalID.isrc : 'N/A';
                        track.upc = externalID ? externalID.upc : 'N/A';
                        track.ean = externalID ? externalID.ean : 'N/A';
                    });

                    album.tracks = albumDetails.tracks.items;
                    album.label = albumDetails.label;

                } catch (error) {
                    console.error(`Error fetching album details, tracks, or ISRCs for album ${album.name}:`, error);
                }
                return album;
            }));

            allAlbumsData.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
            return allAlbumsData;

        } catch (error) {
            console.error('Error fetching and processing albums:', error);
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

    const uploadAlbumsData = async (allAlbumData, artistData) => {
        if (!allAlbumData.length) {
            console.error('No albums data to upload.');
            setMessage('No albums data to upload.');
            return;
        }

        let allSuccess = true;
        let messages = [];

        try {
            const accessToken = await getSpotifyAccessToken();
            const userToken = localStorage.getItem("access_token");

            for (let albumData of allAlbumData) {
                const totalDurationMs = albumData.tracks
                    .map(track => track.duration_ms)
                    .reduce((acc, duration) => acc + duration, 0);

                const albumDuration = new Date(totalDurationMs).toISOString().substr(11, 8);

                let albumReleaseType = albumData.album_type;
                const albumTrackCount = albumData.tracks.length;
                if (albumReleaseType === 'single' && (albumTrackCount > 2 && albumTrackCount < 7) && totalDurationMs >= 600000 && totalDurationMs <= 1800000) {
                    albumReleaseType = 'ep';
                }

                const trackIDs = albumData.tracks.map(track => track.id);
                const externalIDs = await fetchExternalIDs(trackIDs, accessToken);

                const data = {
                    album_id: albumData.id,
                    album_name: albumData.name,
                    album_release_date: albumData.release_date,
                    album_release_type: albumReleaseType,
                    album_duration: albumDuration,
                    album_label: albumData.label,
                    album_track_count: albumData.tracks.length,
                    album_discs_count: Math.max(...albumData.tracks.map(track => track.disc_number)),
                    album_cover_url: albumData.images && albumData.images.length > 0 ? albumData.images[0].url : null,
                    album_artists: albumData.artists.map(artist => ({
                        album_artist_name: artist.name,
                        album_artist_id: artist.id,
                        artist_picture_url: artistData.images && artistData.images.length > 0 ? artistData.images[0].url : null
                    })),
                    album_tracks: albumData.tracks.map(track => {

                        const trackArtists = track.artists.map(artist => ({
                            track_artist_name: artist.name,
                            track_artist_id: artist.id,
                            track_artist_role: track.artists.indexOf(artist) === 0 ? 'Primary' : 'Featuring'
                        }));

                        const externalID = externalIDs.find(id => id.track_id === track.id);

                        return {
                            track_id: track.id,
                            track_name: track.name,
                            track_duration: new Date(track.duration_ms).toISOString().substr(14, 5),
                            track_number: track.track_number,
                            disc_number: track.disc_number,
                            explicit: track.explicit ? '1' : '0',
                            isrc: externalID ? externalID.isrc : 'N/A',
                            upc: externalID ? externalID.upc : 'N/A',
                            ean: externalID ? externalID.ean : 'N/A',
                            track_artists: trackArtists
                        };
                    })
                };

                try {
                    const response = await fetch(`/backend/importAlbum.php`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userToken}`
                        },
                        body: JSON.stringify(data)
                    });
                    const textResponse = await response.text();
                    const result = JSON.parse(textResponse);
                    if (response.ok) {
                        messages.push(`Album "${albumData.name}" added successfully.`);
                    } else {
                        console.error('Data passing error:', result.error || 'Unexpected error occurred');
                        messages.push(`Failed to add album "${albumData.name}": ${result.error || 'Unexpected error'}`);
                        allSuccess = false;
                    }
                } catch (error) {
                    console.error('Fetch error:', error.message || error);
                    messages.push(`Fetch error for album "${albumData.name}": ${error.message || error}`);
                    allSuccess = false;
                }
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
            if (allSuccess) {
                setMessage('All albums have been uploaded successfully.');
            } else {
                setMessage(messages.join('\n'));
            }
        }
    };

    const fetchExternalIDs = async (trackIDs, accessToken) => {
        const batchTrackIDs = (ids, batchSize) => {
            const result = [];
            for (let i = 0; i < ids.length; i += batchSize) {
                result.push(ids.slice(i, i + batchSize).join(','));
            }
            return result;
        };

        const trackIDBatches = batchTrackIDs(trackIDs, 50);
        const allExternalIDs = [];

        for (const batch of trackIDBatches) {
            try {
                const response = await axios.get(`https://api.spotify.com/v1/tracks`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    },
                    params: {
                        ids: batch
                    }
                });

                const externalIDs = response.data.tracks.map(track => ({
                    track_id: track.id,
                    isrc: track.external_ids.isrc || 'N/A',
                    upc: track.external_ids.upc || 'N/A',
                    ean: track.external_ids.ean || 'N/A',
                    name: track.name
                }));

                allExternalIDs.push(...externalIDs);
            } catch (error) {
                console.error('Error fetching external IDs:', error);
            }
        }

        return allExternalIDs;
    };



    return (
        <div className="import-component">
            <div className="import-box">
                <div className="import-form">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Enter Spotify Artist Link or URI"
                            className="inputField"
                            value={spotifyArtistId}
                            onChange={(e) => setSpotifyArtistId(e.target.value)}
                        />
                        <button
                            title={isButtonDisabled ? "To prevent rate-limiting, this process is only allowed with a 15-minute interval." : ''}
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
                    <ArtistInformation artistData={artistData} />
                    <AlbumsList albumsData={albumsData} />
                </div>

            </div>
        </div>
    );

}

function ArtistInformation({ artistData }) {
    if (!artistData) return null;

    return (
        <div className="artist-information">
            <h3>Artist Information</h3>
            <div className="artist-data">
                <div className="artist-info-importer">
                    {artistData.images.length > 0 && (
                        <div>
                            <img src={artistData.images[0].url} alt={artistData.name} className="artist-image" />
                        </div>
                    )}
                    <h3>{artistData.name}</h3>
                    <p>Genres: {artistData.genres.join(', ')}</p>
                    <p>Spotify ID: {artistData.id}</p>
                    <p>Followers: {artistData.followers.total.toLocaleString()}</p>
                    <p>Popularity: {artistData.popularity}</p>
                </div>
            </div>
        </div>
    );
}

function AlbumsList({ albumsData }) {
    if (!albumsData || albumsData.length === 0) return null;

    return (
        <div className="albums-list">
            <h3>Albums</h3>
            <div className="albums-data">
                <table className="albums-table">
                    <thead>
                        <tr>
                            <th>Album Name</th>
                            <th>Release Date</th>
                            <th>Album Type</th>
                            <th>Spotify Album ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {albumsData.map((album) => {
                            const totalDurationMs = album.tracks
                                .map(track => track.duration_ms)
                                .reduce((acc, duration) => acc + duration, 0);

                            let displayAlbumType = album.album_type;
                            const albumTrackCount = album.tracks.length;
                            if (album.album_type === 'single' && (albumTrackCount > 2 && albumTrackCount < 7) && totalDurationMs >= 600000 && totalDurationMs <= 1800000) {
                                displayAlbumType = 'ep';
                            }

                            return (
                                <tr key={album.id}>
                                    <td>{album.name}</td>
                                    <td>{new Date(album.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    <td>{displayAlbumType}</td>
                                    <td>{album.id}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export default ArtistImporter;
