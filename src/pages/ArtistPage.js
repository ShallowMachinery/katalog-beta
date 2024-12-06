import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import './ArtistPage.css';

function ArtistPage() {
    const isMobile = window.innerWidth <= 768;
    const { artistVanity } = useParams();
    const [artistInfo, setArtistInfo] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [trackSearch, setTrackSearch] = useState("");
    const [albums, setAlbums] = useState([]);
    const [relatedArtists, setRelatedArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAlbums, setShowAlbums] = useState(true);
    const [albumFilter, setAlbumFilter] = useState('all');
    const [showTracks, setShowTracks] = useState(true);
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [page, setPage] = useState(0);
    const navigate = useNavigate();
    const limit = 10;
    const [recentActivityData, setRecentActivityData] = useState([]);

    useEffect(() => {
        const fetchArtistInfo = async () => {
            try {
                const response = await axios.get(`/backend/artist-info.php`, {
                    params: { artistVanity },
                });
                const artistData = response.data;
                setArtistInfo(artistData);
                if (artistData) {
                    document.title = `${artistData.artistName} | Katalog`;
                }
                const tracksResponse = await axios.get(`/backend/artist-tracks.php`, {
                    params: { artistVanity },
                });
                setTracks(tracksResponse.data.tracks);
                const albumsResponse = await axios.get(`/backend/artist-albums.php`, {
                    params: { artistVanity },
                });
                setAlbums(albumsResponse.data.albums);
                const relatedArtistsResponse = await axios.get(`/backend/related-artists.php`, {
                    params: { artistVanity },
                });
                setRelatedArtists(relatedArtistsResponse.data.artists);
                const recentActivityResponse = await axios.get(`/backend/recent-artist-activity.php`, {
                    params: { artistVanity },
                });
                setRecentActivityData(recentActivityResponse.data.activities);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching artist info or tracks:', error);
                setLoading(false);
            }
        };
        fetchArtistInfo();
    }, [artistVanity]);

    const handleFilterChange = (filter) => {
        setAlbumFilter(filter);
    };

    const filteredAlbums = useMemo(() => {
        return albums.filter(album => {
            if (albumFilter === 'all') return true;
            if (albumFilter === 'album') return ['album', 'compilation'].includes(album.albumType);
            return album.albumType === albumFilter;
        });
    }, [albums, albumFilter]);

    const uniqueTracks = tracks.reduce((accumulator, track) => {
        if (!accumulator.some(item => item.trackId === track.trackId)) {
            accumulator.push(track);
        }
        return accumulator;
    }, []);

    const filteredTracks = useMemo(() => {
        return uniqueTracks.filter(track => {
            return track.trackName.toLowerCase().includes(trackSearch.toLowerCase());
        });
    }, [uniqueTracks, trackSearch]);

    const paginatedTracks = filteredTracks.slice(page * limit, (page + 1) * limit);

    const handleNextPage = () => {
        setPage(prevPage => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setPage(prevPage => Math.max(prevPage - 1, 0));
    };

    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval;

        if (seconds < 60) {
            return seconds < 10 ? "just now" : seconds + " seconds ago";
        }

        if (seconds < 3600) {
            interval = Math.floor(seconds / 60);
            return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
        }

        if (seconds < 86400) {
            interval = Math.floor(seconds / 3600);
            return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
        }

        if (seconds < 31536000) {
            interval = Math.floor(seconds / 86400);
            return interval + " day" + (interval === 1 ? "" : "s") + " ago";
        }

        interval = Math.floor(seconds / 31536000);
        return interval + " year" + (interval === 1 ? "" : "s") + " ago";
    };

    const formatFullDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    const contributionTypeMap = {
        updated_lyrics: 'Edited',
        added_lyrics: 'Added',
        verified_lyrics: 'Verified'
    };

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="artist-page-container">
                    <div className="loading-spinner"></div>
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
                        src={artistInfo.artistType === "Multiple" ? (relatedArtists[0]?.artistPictureUrl ?? '/assets_public/person.svg') : (artistInfo.artistPictureUrl ? artistInfo.artistPictureUrl : '/assets_public/person.svg')}
                        alt="artist"
                        className="artist-picture"
                        loading="lazy"
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
                <div className="discography-section">
                    <h2>Discography</h2>
                    <div className="tracks-section">
                        <h3 onClick={() => setShowTracks(!showTracks)} className="toggle-header">
                            Songs by {artistInfo.artistName} {showTracks ? '▼' : '►'}
                        </h3>
                        {showTracks && (
                            <>
                                <div className="control-buttons">
                                    <div className="free-div"></div>
                                    <div className="pagination-controls">
                                        {!isMobile && filteredTracks.length > limit && (
                                            <>
                                                {page > 0 && (
                                                    <button onClick={handlePreviousPage}>Previous</button>
                                                )}
                                                {(page + 1) * limit < filteredTracks.length && (
                                                    <button onClick={handleNextPage}>Next</button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className={`search-div ${showSearchInput ? 'show-search' : ''}`}>
                                        <div className="search-input">
                                            <input
                                                type="text"
                                                placeholder="Search tracks..."
                                                value={trackSearch}
                                                onChange={(e) => {
                                                    setPage(0);
                                                    setTrackSearch(e.target.value);
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowSearchInput(!showSearchInput)}
                                            className="toggle-search-btn"
                                        >
                                            {showSearchInput ? 'Hide Search' : 'Show Search'}
                                        </button>
                                    </div>
                                </div>
                                {filteredTracks.length > 0 ? (
                                    <ul className="track-list">
                                        {paginatedTracks.map((track, index) => (
                                            <a
                                                href={`/lyrics/${track.artistVanity}/${track.trackVanity}`}
                                                key={`${track.trackId}-${index}`}
                                            >
                                                <div className="track-list-div">
                                                    <img
                                                        src={track.albumCoverUrl}
                                                        alt={track.albumName}
                                                        className="track-album-cover"
                                                        loading="lazy"
                                                    />
                                                    <div className="track-list-info">
                                                        {track.trackName}
                                                        <small>{track.artistName}</small>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ textAlign: "center" }}>No tracks found for this artist. Try a different search term.</p>
                                )}
                                {isMobile && filteredTracks.length > limit && (
                                    <div className="pagination-controls" style={{ marginLeft: "auto" }}>
                                        {page > 0 && <button onClick={handlePreviousPage}>Previous</button>}
                                        {(page + 1) * limit < filteredTracks.length && (
                                            <button onClick={handleNextPage}>Next</button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="albums-section">
                        <h3 onClick={() => setShowAlbums(!showAlbums)} className="toggle-header">
                            Albums by {artistInfo.artistName} {showAlbums ? '▼' : '►'}
                        </h3>
                        {showAlbums && (
                            <>
                                <div className="album-filters">
                                    <button onClick={() => handleFilterChange('all')} className={albumFilter === 'all' ? 'active' : ''}>Show all</button>
                                    <button onClick={() => handleFilterChange('single')} className={albumFilter === 'single' ? 'active' : ''}>Singles</button>
                                    <button onClick={() => handleFilterChange('ep')} className={albumFilter === 'ep' ? 'active' : ''}>EPs</button>
                                    <button onClick={() => handleFilterChange('album')} className={albumFilter === 'album' ? 'active' : ''}>Albums</button>
                                </div>
                                {filteredAlbums.length > 0 ? (
                                    <ul className="album-list">
                                        {filteredAlbums.map((album, index) => (
                                            <li key={`${album.albumSpotifyId}-${index}`}>
                                                <a href={`/album/${album.artistVanity}/${album.albumVanity}`}>
                                                    <img src={album.albumCoverUrl} alt={album.albumName} className="album-cover" loading="lazy" />
                                                    <span className="album-name">{album.albumName}</span><br />
                                                    <small className="album-details"><span>{formatAlbumType(album.albumType)} | {formatReleaseDate(album.releaseDate)}</span></small>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ textAlign: "center " }}>No albums available for this filter.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div className="related-artists-section">
                    <h3>Related Artists</h3>
                    <ul className="related-artist-list">
                        {relatedArtists.length > 0 ? (
                            relatedArtists.map((artist, index) => (
                                <li key={`${artist.artistVanity}-${index}`} className="related-artist-item">
                                    <a href={`/artist/${artist.artistVanity}`}>
                                        <img src={artist.artistPictureUrl || '/assets_public/person.svg'}
                                            alt={artist.artistName}
                                            className="related-artist-picture"
                                            loading="lazy"
                                            style={{ backgroundColor: "white" }}
                                        />
                                        <br />
                                        <span>{artist.artistName}</span>
                                    </a>
                                </li>
                            ))
                        ) : (
                            <li>No related artists found.</li>
                        )}
                    </ul>
                </div>
                <div className="recent-activities-section">
                    <h3>Recent Activities</h3>
                    <ul className="recent-activities-list">
                        {recentActivityData.length > 0 ? (
                            recentActivityData.map((activity, index) => {
                                const updatedDate = new Date(activity.created_at);
                                const now = new Date();
                                const isYesterdayOrBefore = updatedDate < new Date(now.setDate(now.getDate() - 1));
                                return (
                                    <div
                                        key={`${activity.trackId}-${index}`}
                                        className="recent-activity-div"
                                        onClick={() => navigate(`/lyrics/${activity.artistVanity}/${activity.trackVanity}`)}
                                        style={{ cursor: "pointer" }}>
                                        <img src={activity.albumCoverUrl} alt={activity.albumName} className="recent-activity-album-cover" loading="lazy" />
                                        <div className="recent-activity-info">
                                            <span>{activity.trackName}</span>
                                            <small>{activity.artistName}</small>
                                        </div>
                                        <span className="updated-at">
                                            <i>
                                                {contributionTypeMap[activity.contribution_type] || activity.contribution_type}
                                                <span> </span>{isYesterdayOrBefore
                                                    ? formatFullDate(activity.created_at)
                                                    : timeSince(activity.created_at)}<br />
                                                <span>by <a href={`/user/${activity.userName}`}>{activity.userName} {!isMobile ? `[${activity.userTypeName}]` : ''}</a></span>
                                            </i>
                                        </span>
                                    </div>);
                            }
                            )) : (
                            <li style={{ textAlign: "center" }}>No recent activities found.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div >
    );
}

export default ArtistPage;
