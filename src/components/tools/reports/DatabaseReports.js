import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MenuBar from '../../MenuBar';
import './DatabaseReports.css';

function DatabaseReports() {
    const [data, setData] = useState({
        tracks: [],
        albums: [],
        artists: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchQueryTracks, setSearchQueryTracks] = useState('');
    const [currentPageTracks, setCurrentPageTracks] = useState(1);
    const [entriesPerPageTracks, setEntriesPerPageTracks] = useState(20);
    const [filterOptionsTracks, setFilterOptionsTracks] = useState({
        missingISRC: false,
        noWriters: false,
        duplicateEntry: false,
        noIssues: false,
    });

    const [searchQueryAlbums, setSearchQueryAlbums] = useState('');
    const [currentPageAlbums, setCurrentPageAlbums] = useState(1);
    const [entriesPerPageAlbums, setEntriesPerPageAlbums] = useState(20);
    const [releaseTypeFilters, setReleaseTypeFilters] = useState([]);

    const [searchQueryArtists, setSearchQueryArtists] = useState('');
    const [currentPageArtists, setCurrentPageArtists] = useState(1);
    const [entriesPerPageArtists, setEntriesPerPageArtists] = useState(20);

    useEffect(() => {
        const fetchDatabaseReports = async () => {
            try {
                const userToken = localStorage.getItem('access_token');
                const response = await axios.get('/backend/get-database-reports.php', {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });
                setData(response.data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchDatabaseReports();
    }, []);

    const handleFilterChangeTracks = (e) => {
        const { name, checked } = e.target;
        if (name === 'noIssues' && checked) {
            setFilterOptionsTracks({
                missingISRC: false,
                noWriters: false,
                duplicateEntry: false,
                noIssues: checked,
            });
        } else if (['missingISRC', 'noWriters', 'duplicateEntry'].includes(name) && checked) {
            setFilterOptionsTracks((prevOptions) => ({
                ...prevOptions,
                noIssues: false,
                [name]: checked,
            }));
        } else {
            setFilterOptionsTracks((prevOptions) => ({
                ...prevOptions,
                [name]: checked,
            }));
        }
        setCurrentPageTracks(1);
    };

    const handleAlbumTypeFilterChange = (e) => {
        const { name, checked } = e.target;
        setReleaseTypeFilters((prevFilters) => {
            if (checked) {
                return [...prevFilters, name];
            } else {
                return prevFilters.filter(filter => filter !== name);
            }
        });
        setCurrentPageAlbums(1);
    };

    const filteredTracks = data.tracks
        .filter((track) => {
            const { missingISRC, noWriters, duplicateEntry, noIssues } = filterOptionsTracks;

            if (missingISRC && track.isrcs !== "N/A") return false;
            if (noWriters && track.writerCount > 0) return false;
            if (duplicateEntry && !track.isDuplicate) return false;
            if (noIssues && (track.isrcs === "N/A" || !track.writerCount || track.isDuplicate)) return false;

            return (
                track.trackName.toLowerCase().includes(searchQueryTracks.toLowerCase()) ||
                track.artistName.toLowerCase().includes(searchQueryTracks.toLowerCase())
            );
        })
        .sort((a, b) => a.trackName.localeCompare(b.trackName));

    const handleTrackSearch = (e) => {
        const searchTracksValue = e.target.value;
        setSearchQueryTracks(searchTracksValue);
        setCurrentPageTracks(1);
    }

    const handleAlbumSearch = (e) => {
        const searchAlbumsValue = e.target.value;
        setSearchQueryAlbums(searchAlbumsValue);
        setCurrentPageAlbums(1);
    }

    const indexOfLastEntryTracks = currentPageTracks * entriesPerPageTracks;
    const indexOfFirstEntryTracks = indexOfLastEntryTracks - entriesPerPageTracks;
    const currentTracks = filteredTracks.slice(indexOfFirstEntryTracks, indexOfLastEntryTracks);

    const totalPagesTracks = Math.ceil(filteredTracks.length / entriesPerPageTracks);

    const filteredAlbums = data.albums
        .filter(album => {
            const releaseTypeMatch = releaseTypeFilters.length === 0 || releaseTypeFilters.includes(album.releaseType);

            const albumName = album.albumName ? album.albumName.toLowerCase() : '';
            const artistName = album.artistName ? album.artistName.toLowerCase() : '';

            return (albumName.includes(searchQueryAlbums.toLowerCase()) || artistName.includes(searchQueryAlbums.toLowerCase())) && releaseTypeMatch;
        })
        .sort((a, b) => {
            const albumNameA = a.albumName || '';
            const albumNameB = b.albumName || '';
            return albumNameA.localeCompare(albumNameB);
        });

    const totalPagesAlbums = Math.ceil(filteredAlbums.length / entriesPerPageAlbums);

    const filteredArtists = data.artists
        .filter(artist => artist.artistName.toLowerCase().includes(searchQueryArtists.toLowerCase()))
        .sort((a, b) => {
            if (a.artistType === 'solo' && b.artistType !== 'solo') return -1;
            if (a.artistType !== 'solo' && b.artistType === 'solo') return 1;
            return a.artistName.localeCompare(b.artistName);
        });

    const indexOfLastEntryArtists = currentPageArtists * entriesPerPageArtists;
    const indexOfFirstEntryArtists = indexOfLastEntryArtists - entriesPerPageArtists;
    const currentArtists = filteredArtists.slice(indexOfFirstEntryArtists, indexOfLastEntryArtists);

    const totalPagesArtists = Math.ceil(filteredArtists.length / entriesPerPageArtists);

    const getReports = (track) => {
        const reports = [];
        if (track.isrcs === "N/A") {
            reports.push(<span style={{ color: 'red' }}>Missing ISRC<br /></span>);
        }
        if (!track.writerCount || track.writerCount === 0) {
            reports.push(<span style={{ color: 'orange' }}>No writers<br /></span>);
        }
        if (track.isDuplicate) {
            reports.push(<span style={{ color: 'blue' }}>
                <a
                    href={`/katalog-admin/tools/track-merger?trackName=${encodeURIComponent(track.trackName)}&artistName=${encodeURIComponent(track.artistName)}`} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'blue' }}
                >
                    Duplicate entry<br />
                </a>
            </span>);
        }
        return reports.length > 0 ? reports : <span style={{ color: 'gray' }}>No issues</span>;
    };

    const handleEditClick = (type, item) => {
        const editPath = type === 'artist'
            ? `/katalog-admin/catalogue-editor/artist/${item.artistId}`
            : type === 'album'
                ? `/katalog-admin/catalogue-editor/album/${item.albumId}`
                : '';
        const newTab = window.open(editPath, '_blank');
        newTab.focus();
    };

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

    return (
        <div className="database-reports-page">
            <MenuBar />
            <h2>Database Reports</h2>
            {error && <p className="error-message">{error}</p>}

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <span>Loading...</span>
                </div>
            ) : (
                <div className="database-reports">
                    <h3>Tracks</h3>

                    <div className="tracks-controls">
                        <input
                            type="text"
                            placeholder="Search tracks or artists"
                            value={searchQueryTracks}
                            onChange={handleTrackSearch}
                            className="search-input-page"
                        />
                        <label>
                            Show
                            <select
                                value={entriesPerPageTracks}
                                onChange={(e) => setEntriesPerPageTracks(Number(e.target.value))}
                                className="entries-per-page"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                            </select>
                            entries
                        </label>
                        <fieldset className="filter-options">
                            <legend>Filter by:</legend>
                            <label>
                                <input
                                    type="checkbox"
                                    name="missingISRC"
                                    checked={filterOptionsTracks.missingISRC}
                                    onChange={handleFilterChangeTracks}
                                />
                                Missing ISRC
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="noWriters"
                                    checked={filterOptionsTracks.noWriters}
                                    onChange={handleFilterChangeTracks}
                                />
                                No writers
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="duplicateEntry"
                                    checked={filterOptionsTracks.duplicateEntry}
                                    onChange={handleFilterChangeTracks}
                                />
                                Duplicate entry
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    name="noIssues"
                                    checked={filterOptionsTracks.noIssues}
                                    onChange={handleFilterChangeTracks}
                                />
                                No issues
                            </label>
                        </fieldset>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Track Name</th>
                                <th>Artist</th>
                                <th>Album</th>
                                <th>Duration</th>
                                <th>Reports</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTracks.length > 0 ? (
                                currentTracks.map((track) => (
                                    <tr key={track.trackId}>
                                        <td>
                                            <a href={`/lyrics/${track.artistVanity}/${track.trackVanity}`} target="_blank" rel="noopener noreferrer">
                                                {track.trackName}
                                            </a>
                                        </td>
                                        <td>
                                            <a href={`/artist/${track.artistVanity}`} target="_blank" rel="noopener noreferrer">
                                                {track.artistName}
                                            </a>
                                        </td>
                                        <td>
                                            <a href={`/album/${track.albumArtistVanity}/${track.albumVanity}`} target="_blank" rel="noopener noreferrer">
                                                {track.albumName}
                                            </a>
                                        </td>
                                        <td>{track.trackDuration}</td>
                                        <td>{getReports(track)}</td>
                                        <td>
                                            <button
                                                onClick={() =>
                                                    window.open(`/katalog-admin/catalogue-editor/track/${track.trackId}`, "_blank")
                                                }
                                            >
                                                Edit in new tab
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center" }}>No tracks found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {currentTracks.length > 0 &&
                        <div className="pagination">
                            <button
                                onClick={() => setCurrentPageTracks(prev => Math.max(prev - 1, 1))}
                                disabled={currentPageTracks === 1}
                            >
                                Previous
                            </button>
                            <span>
                                Page {currentPageTracks} of {totalPagesTracks}
                            </span>
                            <button
                                onClick={() => setCurrentPageTracks(prev => Math.min(prev + 1, totalPagesTracks))}
                                disabled={currentPageTracks === totalPagesTracks}
                            >
                                Next
                            </button>
                        </div>
                    }

                    <hr style={{ borderTop: '1px solid #999', marginTop: '20px', marginBottom: '20px' }} />

                    <div className="albums">
                        <h3>Albums</h3>
                        <div className="albums-controls">
                            <input
                                type="text"
                                placeholder="Search albums or artists"
                                value={searchQueryAlbums}
                                onChange={handleAlbumSearch}
                                className="search-input-page"
                            />
                            <label>
                                Show
                                <select
                                    value={entriesPerPageAlbums}
                                    onChange={(e) => setEntriesPerPageAlbums(Number(e.target.value))}
                                    className="entries-per-page"
                                >
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={200}>200</option>
                                </select>
                                entries
                            </label>
                            <fieldset className="filter-by-type">
                                <legend>Filter by Type</legend>
                                {['single', 'ep', 'album', 'compilation'].map(type => (
                                    <label key={type}>
                                        <input
                                            type="checkbox"
                                            name={type}
                                            checked={releaseTypeFilters.includes(type)}
                                            onChange={handleAlbumTypeFilterChange}
                                        />
                                        {formatAlbumType(type)}
                                    </label>
                                ))}
                            </fieldset>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Album Name</th>
                                    <th>Artist Name</th>
                                    <th>Release Type</th>
                                    <th>Tracks Count</th>
                                    <th>Discs Count</th>
                                    <th>Release Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlbums.length > 0 ? (
                                    filteredAlbums.slice((currentPageAlbums - 1) * entriesPerPageAlbums, currentPageAlbums * entriesPerPageAlbums).map((album) => (
                                        <tr key={album.albumId}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                    <img src={album.albumCoverUrl} alt={album.albumName} />
                                                    <a href={`/album/${album.artistVanity}/${album.albumVanity}`} target="_blank" rel="noopener noreferrer">
                                                        {album.albumName}
                                                    </a>
                                                </div>
                                            </td>
                                            <td>
                                                <a href={`/artist/${album.artistVanity}`} target="_blank" rel="noopener noreferrer">
                                                    {album.artistName}
                                                </a>
                                            </td>
                                            <td>{formatAlbumType(album.releaseType)}</td>
                                            <td>{album.tracksCount}</td>
                                            <td>{album.discsCount}</td>
                                            <td>{album.releaseDate}</td>
                                            <td>
                                                <button onClick={() => handleEditClick('album', album)} className="edit-button">Edit in new tab</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: "center" }}>No albums found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {filteredAlbums.length > 0 && (
                            <div className="pagination">
                                {currentPageAlbums > 1 && (
                                    <button onClick={() => setCurrentPageAlbums(currentPageAlbums - 1)}>Previous</button>
                                )}
                                <span>Page {currentPageAlbums} of {totalPagesAlbums}</span>
                                {currentPageAlbums < totalPagesAlbums && (
                                    <button onClick={() => setCurrentPageAlbums(currentPageAlbums + 1)}>Next</button>
                                )}
                            </div>
                        )}
                    </div>

                    <hr style={{ borderTop: '1px solid #999', marginTop: '20px', marginBottom: '20px' }} />

                    <h3>Artists</h3>
                    <div className="artists-controls">
                        <input
                            type="text"
                            placeholder="Search artists"
                            value={searchQueryArtists}
                            onChange={(e) => {
                                setSearchQueryArtists(e.target.value);
                                setCurrentPageArtists(1);
                            }}
                            className="search-input-page"
                        />
                        <label>
                            Show
                            <select
                                value={entriesPerPageArtists}
                                onChange={(e) => setEntriesPerPageArtists(Number(e.target.value))}
                                className="entries-per-page"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                            </select>
                            entries
                        </label>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Artist Name</th>
                                <th>Reports</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArtists.length > 0 ? (
                                currentArtists.map((artist) => (
                                    <tr key={artist.artistId}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                <img
                                                    src={artist.artistType === 'solo' && artist.artistCoverUrl ? artist.artistCoverUrl : '/assets_public/person.svg'}
                                                    alt={artist.artistName || 'Artist'}
                                                />
                                                <a href={`/artist/${artist.artistVanity}`} target="_blank" rel="noopener noreferrer">
                                                    {artist.artistName}
                                                </a>
                                            </div>
                                        </td>
                                        <td>
                                            {artist.artistCoverUrl === null ? (
                                                <span style={{ color: artist.artistType === "Multiple" ? 'orange' : 'red' }}>
                                                    Discography might be missing
                                                </span>
                                            ) : (
                                                <span style={{ color: 'gray' }}>
                                                    No issues
                                                </span>
                                            )}
                                            <br />
                                            {artist.isDuplicate === 1 && <span style={{ color: 'blue' }}>Duplicate artist</span>}
                                        </td>
                                        <td>
                                            <button onClick={() => handleEditClick('artist', artist)} className="edit-button">Edit in new tab</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">No artists found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {currentArtists.length > 0 && (
                        <div className="pagination">
                            {currentPageArtists > 1 && (
                                <button onClick={() => setCurrentPageArtists(currentPageArtists - 1)}>Previous</button>
                            )}
                            <span>Page {currentPageArtists} of {totalPagesArtists}</span>
                            {currentPageArtists < totalPagesArtists && (
                                <button onClick={() => setCurrentPageArtists(currentPageArtists + 1)}>Next</button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DatabaseReports;
