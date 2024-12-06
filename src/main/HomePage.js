import React, { useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import Modal from '../components/Modal';
import { checkSession } from '../components/SessionChecker';
import { jwtDecode } from 'jwt-decode';
import './HomePage.css';
import packageJson from '../../package.json';

const initialState = {
    featuredArtists: [],
    recentContributions: [],
    recentContributionsLength: null,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_FEATURED_ARTISTS':
            return { ...state, featuredArtists: action.payload };
        case 'SET_RECENT_CONTRIBUTIONS':
            return { ...state, recentContributions: action.payload, recentContributionsLength: action.payload.length };
        default:
            return state;
    }
}

function HomePage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { featuredArtists, recentContributions, recentContributionsLength } = state;
    const [stats, setStats] = useState({ track_count: null, artist_count: null, album_count: null, lyrics_count: null });
    const [page, setPage] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingContributions, setIsLoadingContributions] = useState(true);
    const limit = 10;
    const navigate = useNavigate();
    const userToken = localStorage.getItem('access_token');
    let isAdmin = false;

    if (userToken) {
        try {
            const decodedToken = jwtDecode(userToken);
            isAdmin = decodedToken?.data.user_hierarchy === 1;
        } catch (error) {
            console.error('Invalid token:', error);
        }
    }

    useEffect(() => {
        document.title = `Katalog`;
    }, []);

    useEffect(() => {
        const fetchFeaturedArtists = async () => {
            try {
                const response = await axios.get(`/backend/featured-artists.php`);
                if (response.data.artists) {
                    dispatch({ type: 'SET_FEATURED_ARTISTS', payload: response.data.artists });
                } else {
                    console.error('Artists data is not in expected format:', response.data);
                }
            } catch (error) {
                console.error('Error fetching featured artists:', error);
            }
        };

        const fetchRecentContributions = async () => {
            try {
                const userToken = localStorage.getItem('access_token');
                const sessionExpired = await checkSession();
                if (sessionExpired && userToken) {
                    setIsModalOpen(true);
                    return;
                }
                const response = await axios.get(`/backend/recent-contributions.php`, {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                });

                if (response.data.contributions) {
                    const contributions = response.data.contributions.slice(0, 100);
                    dispatch({ type: 'SET_RECENT_CONTRIBUTIONS', payload: contributions });
                } else {
                    console.error('Contributions data is not in expected format:', response.data);
                }
            } catch (error) {
                console.error('Error fetching recent contributions:', error);
            } finally {
                setIsLoadingContributions(false);
            }
        };

        const fetchStatistics = async () => {
            try {
                const response = await axios.get(`/backend/get-all-count.php`);
                console.log(response.data);

                if (response.data) {
                    setStats({
                        track_count: response.data.track_count,
                        artist_count: response.data.artist_count,
                        album_count: response.data.album_count,
                        lyrics_count: response.data.lyrics_count
                    });
                } else {
                    console.error('No data received');
                }
            } catch (error) {
                console.error('Error fetching statistics:', error);
            }
        };

        fetchFeaturedArtists();
        fetchRecentContributions();
        fetchStatistics();
    }, []);

    const handleModalConfirm = () => {
        localStorage.clear();
        navigate('/login');
        window.location.reload();
    };

    const handlePreviousPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    const handleNextPage = () => {
        setPage((prevPage) => (prevPage + 1) * limit < recentContributions.length ? prevPage + 1 : prevPage);
    };

    const displayedContributions = recentContributions.slice(page * limit, (page + 1) * limit);

    const contributionTypeMap = {
        updated_lyrics: 'Edited',
        added_lyrics: 'Added',
        verified_lyrics: 'Verified',
    };

    return (
        <div className="home-page-container">
            <MenuBar />
            <Modal
                isOpen={isModalOpen}
                title="Session Expired"
                message="Your session has expired. Please log in again to continue."
                onConfirm={handleModalConfirm}
                onClose={() => setIsModalOpen(false)}
                confirmLabel="Log in"
                hideCloseButton={true}
            />
            <div className="intro-section">
                <h1>Welcome to Katalog</h1>
                <p>Your one-stop destination for music lyrics and artist information.</p>
            </div>

            <div className="stats-section">
                <div className="stat-item">
                    <div className="stat-number">{stats.track_count ?? "..."}</div>
                    <div className="stat-label">tracks</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">{stats.artist_count ?? "..."}</div>
                    <div className="stat-label">artists</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">{stats.album_count ?? "..."}</div>
                    <div className="stat-label">albums</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">{stats.lyrics_count ?? "..."}</div>
                    <div className="stat-label">lyrics</div>
                </div>
                {userToken && (
                    <div className="stat-item">
                        <div className="stat-number">{isLoadingContributions ? "..." : recentContributionsLength}</div>
                        <div className="stat-label">contributions so far</div>
                    </div>
                )}
            </div>

            <section className="featured-artists-section">
                <h2>Featured Artists</h2>
                <ul className="artist-list">
                    {featuredArtists.map((artist) => (
                        <li key={artist.artistVanity} className="artist-item">
                            <Link to={`/artist/${artist.artistVanity}`} style={{ textDecoration: 'none' }}>
                                <img src={artist.artistPictureUrl || '/assets_public/music-artist.svg'} alt={artist.artistName} className="artist-picture" /><br />
                                <span className="artist-name">{artist.artistName}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>

            {userToken && (
                <section className="recent-contributions-section">
                    <h1>Recent Contributions</h1>
                    {isLoadingContributions ? (
                        <div className="loading-spinner"></div>
                    ) : (
                        displayedContributions.length > 0 ? (
                            <ul>
                                {displayedContributions.map((contribution, index) => {
                                    const updatedDate = new Date(contribution.createdAt);
                                    const now = new Date();
                                    const yesterday = new Date(now);
                                    yesterday.setDate(now.getDate() - 1);

                                    const formattedDate = updatedDate.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    });
                                    return (
                                        <li key={index}>
                                            <div
                                                className="contribution-item"
                                                onClick={() => navigate(`/lyrics/${contribution.artistVanity}/${contribution.trackVanity}`)}
                                                style={{ cursor: "pointer" }}>
                                                <img
                                                    src={contribution.albumCoverUrl}
                                                    alt={`${contribution.trackName} cover`}
                                                    className="album-cover"
                                                />
                                                <div className="text-container">
                                                    <span>{contribution.trackName}</span>
                                                    <br />
                                                    <a href={`/artist/${contribution.artistVanity}`} className="artist-name">
                                                        <small>{contribution.artistName}</small>
                                                    </a>
                                                </div>
                                                <span className="updated-at">
                                                    <i>
                                                        {contributionTypeMap[contribution.contributionType] || contribution.contributionType} {formattedDate}
                                                    </i>
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p>No recent contributions found.</p>
                        )
                    )}
                    {recentContributions.length > limit && (
                        <div className="pagination-controls">
                            {page > 0 && (
                                <button onClick={handlePreviousPage}>Previous</button>
                            )}
                            {(page + 1) * limit < recentContributions.length && (
                                <button onClick={handleNextPage}>Next</button>
                            )}
                        </div>
                    )}
                </section>)}

            <footer>
                {isAdmin ? (
                    <>
                        <p><a href="/katalog-admin/tools">&copy; 2024 Eleazar Galope, go to Tools</a></p>
                    </>
                ) : (
                    <>
                        <p className="common-footer">&copy; 2024 Eleazar Galope</p>
                    </>
                )}
                <small style={{ color: 'gray' }}>Katalog v{packageJson.version}-beta</small>
            </footer>

        </div>
    );
}

export default HomePage;
