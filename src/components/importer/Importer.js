import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Importer.css';

function Importer() {
    const token = 'BQAk0WOAu29iK7qgnsc0CSPoCrUtHeX1IfEwJwby4yqVvxeb-YjmJPwF4XBlpShbQqOQZJwXB3RXRMBArv3Iehl6tBCx31h9dXWw-VCoYNNkxzTKvhk';
    const [spotifyAlbumId, setSpotifyAlbumId] = useState('');
    const [albumData, setAlbumData] = useState(null);
    const [trackISRCs, setTrackISRCs] = useState([]);
    const [allArtistData, setAllArtistData] = useState([]); // Holds data for all artists
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

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
            const spotifyAlbumResponse = await axios.get(`https://api.spotify.com/v1/albums/${filteredSpotifyAlbumId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const albumData = spotifyAlbumResponse.data;
            setAlbumData(albumData);

            const trackISRCsPromises = albumData.tracks.items.map(async (track) => {
                const spotifyTrackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${track.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return {
                    id: track.id,
                    isrc: spotifyTrackResponse.data.external_ids.isrc || 'N/A'
                };
            });

            const trackISRCs = await Promise.all(trackISRCsPromises);
            setTrackISRCs(trackISRCs);

            const artistDataArray = await Promise.all(albumData.artists.map(async (artist) => {
                const artistSpotifyResponse = await fetchArtistSpotifyData(artist.id, token);
                return artistSpotifyResponse;
            }));
            setAllArtistData(artistDataArray);

        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage("Invalid link or URI.");
        }
    };

    const fetchArtistSpotifyData = async (artistId, token) => {
        try {
            const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching Spotify artist data:', error);
            setMessage('There was an error fetching Spotify artist data. Please try again.');
        }
    };

    const getISRCForTrack = (trackId) => {
        const track = trackISRCs.find(t => t.id === trackId);
        return track ? track.isrc : 'N/A';
    };

    const uploadData = async () => {
        if (!albumData) {
            console.error('No data to upload.');
            setMessage('No data to upload.');
            return;
        }

        const totalDurationMs = albumData.tracks.items
            .map(track => track.duration_ms)
            .reduce((acc, duration) => acc + duration, 0);

        const albumDuration = new Date(totalDurationMs).toISOString().substr(11, 8);

        let albumReleaseType = albumData.album_type;

        if (albumReleaseType === 'single' && totalDurationMs >= 600000 && totalDurationMs <= 1800000) { // 10 minutes to 30 minutes in milliseconds
            albumReleaseType = 'ep';
        }

        const data = {
            album_id: albumData.id,
            album_name: albumData.name,
            album_release_date: albumData.release_date,
            album_release_type: albumReleaseType,
            album_duration: albumDuration,
            album_label: albumData.label,
            album_track_count: albumData.tracks.items.length,
            album_discs_count: Math.max(...albumData.tracks.items.map(track => track.disc_number)),
            album_cover_url: albumData.images && albumData.images.length > 0 ? albumData.images[0].url : null,
            album_artists: allArtistData.map((artistData) => ({
                album_artist_name: artistData.name,
                album_artist_id: artistData.id,
                artist_picture_url: artistData.images && artistData.images.length > 0 ? artistData.images[0].url : null
            })),
            album_tracks: await Promise.all(albumData.tracks.items.map(async track => {
                const trackArtists = await Promise.all(track.artists.map(async (artist) => {
                    const artistData = await fetchArtistSpotifyData(artist.id, token);
                    return {
                        track_artist_name: artist.name,
                        track_artist_id: artist.id,
                        track_artist_role: track.artists.indexOf(artist) === 0 ? 'Primary' : 'Featuring',
                        track_artist_picture_url: artistData.images && artistData.images.length > 0 ? artistData.images[0].url : null
                    };
                }));

                return {
                    track_id: track.id,
                    track_name: track.name,
                    track_duration: new Date(track.duration_ms).toISOString().substr(14, 5),
                    track_number: track.track_number,
                    disc_number: track.disc_number,
                    explicit: track.explicit ? 'Yes' : 'No',
                    isrc: getISRCForTrack(track.id),
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
            const result = await response.json();
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
        }
    };

    return (
        <div className="import-component">
            <div className="import-box">
                <div className="import-form">
                    <h3>Katalog 1.0-beta Album Importer</h3>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Enter Spotify Album Link or URI"
                            className="inputField"
                            value={spotifyAlbumId}
                            onChange={(e) => setSpotifyAlbumId(e.target.value)}
                        />
                        <button type="submit" className="submitButton">Submit</button>
                        <div className="import-data-button-container">
                            <button className="import-data-button" onClick={uploadData}>
                                Import Data to Database
                            </button>
                        </div>
                    </form>
                    {message && <p className="message">{message}</p>}
                </div>

                <div className="album-information">
                    <h3>Album Information</h3>
                    <div className="album-data">
                        {albumData && (
                            <div className="album-info">
                                {(() => {
                                    // Calculate total duration in milliseconds
                                    const totalDurationMs = albumData.tracks.items
                                        .map(track => track.duration_ms)
                                        .reduce((acc, duration) => acc + duration, 0);

                                    // Check if the album type should be adjusted to "ep"
                                    let displayAlbumType = albumData.album_type;
                                    if (albumData.album_type === 'single' && totalDurationMs >= 600000 && totalDurationMs <= 1800000) {
                                        displayAlbumType = 'ep';
                                    }

                                    // Return the JSX to render
                                    return (
                                        <>
                                            <h4>{albumData.name} - {displayAlbumType}</h4>
                                            <p>Artist(s): {albumData.artists.map(artist => artist.name).join(', ')}</p>
                                            <p>Released on: {new Date(albumData.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            <p>Tracks: {albumData.tracks.items.length}</p>
                                            <p>Discs: {Math.max(...albumData.tracks.items.map(track => track.disc_number))}</p>
                                            <p>Duration: {new Date(totalDurationMs).toISOString().substr(11, 8)}</p>
                                            <p>Label: {albumData.label}</p>
                                            {albumData.images.length > 0 && (
                                                <div>
                                                    <img src={albumData.images[0].url} alt="Album cover" className="album-image" />
                                                </div>
                                            )}
                                            <p>Artist ID(s): {albumData.artists.map(artist => artist.id).join(', ')}</p>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>


                <div className="tracks-information">
                    <h3>Album Tracks</h3>
                    <div className="tracks-data">
                        {albumData && albumData.tracks && albumData.tracks.items.length > 0 ? (
                            <table className="tracks-table">
                                <thead>
                                    <tr>
                                        <th>Track #</th>
                                        <th>Track Name</th>
                                        <th>Track Artist(s)</th>
                                        <th>Duration</th>
                                        <th>Explicit</th>
                                        <th>ISRC</th>
                                    </tr>
                                </thead>
                                {Array.from(new Set(albumData.tracks.items.map(track => track.disc_number))).map(discNumber => (
                                    <tbody key={discNumber}>
                                        <tr>
                                            <td colSpan="6"><strong>Disc {discNumber}</strong></td>
                                        </tr>
                                        {albumData.tracks.items
                                            .filter(track => track.disc_number === discNumber)
                                            .map((track, index) => (
                                                <tr key={track.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{track.name}</td>
                                                    <td>{track.artists.map(artist => artist.name).join(', ')}</td>
                                                    <td>{new Date(track.duration_ms).toISOString().substr(14, 5)}</td>
                                                    <td>{track.explicit ? 'Yes' : 'No'}</td>
                                                    <td>{getISRCForTrack(track.id)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                ))}
                            </table>
                        ) : (
                            <p>No tracks available for this album.</p>
                        )}
                    </div>
                </div>

                <div className="artist-information">
                    <h3>Artist Information</h3>
                    <div className="artist-data">
                        {allArtistData.map((artistData, index) => (
                            <div key={index} className="artist-info">
                                <h4>{artistData.name}</h4>
                                <p>Genres: {artistData.genres.join(', ')}</p>
                                <p>Popularity: {artistData.popularity}</p>
                                <p>Followers: {artistData.followers.total}</p>
                                {artistData.images.length > 0 && (
                                    <div>
                                        <img src={artistData.images[0].url} alt="Artist image" className="artist-image" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Importer;
