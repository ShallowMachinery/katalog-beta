import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import Modal from '../components/Modal';
import { checkSession } from '../components/SessionChecker';
import './HomePage.css';
import packageJson from '../../package.json';

function HomePage() {
    const [featuredArtists, setFeaturedArtists] = useState([]);
    const [recentContributions, setRecentContributions] = useState([]);
    const [page, setPage] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingContributions, setIsLoadingContributions] = useState(true);
    const limit = 10;
    const navigate = useNavigate();

    const userToken = localStorage.getItem('access_token');
    const isAdmin = localStorage.getItem('user_hierarchy') === '1';

    const baseUrl = `${window.location.protocol}//${window.location.hostname}`;

    useEffect(() => {
        document.title = `Katalog`;
    }, []);

    useEffect(() => {
        const fetchFeaturedArtists = async () => {
            try {
                const response = await axios.get(`${baseUrl}/katalog/beta/api/featured-artists.php`);
                if (response.data.artists) {
                    setFeaturedArtists(response.data.artists);
                }
                else {
                    console.error('Artists data is not in expected format:', response.data);
                }
            } catch (error) {
                console.error('Error fetching featured artists:', error);
            }
        };

        const fetchRecentContributions = async () => {
            try {
                const sessionExpired = await checkSession();
                if (sessionExpired && userToken) {
                    setIsModalOpen(true);
                    return;
                }
                const response = await axios.get(`${baseUrl}/katalog/beta/api/recent-contributions.php`, {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                });

                if (response.data.contributions) {
                    setRecentContributions(response.data.contributions);
                }
                else {
                    console.error('Contributions data is not in expected format:', response.data);
                }
            } catch (error) {
                console.error('Error fetching recent contributions:', error);
            } finally {
                setIsLoadingContributions(false);
            }
        };

        fetchFeaturedArtists();
        fetchRecentContributions();
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

            {/* Featured Artists Section */}
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
                                    const isYesterdayOrBefore = updatedDate < new Date(now.setDate(now.getDate() - 1));
                                    return (
                                        <li key={index}>
                                            <a href={`/lyrics/${contribution.artistVanity}/${contribution.trackVanity}`}>
                                                <div className="contribution-item">
                                                    <img
                                                        src={contribution.albumCoverUrl}
                                                        alt={`${contribution.trackName} cover`}
                                                        className="album-cover"
                                                    />
                                                    <div className="text-container">
                                                        {contribution.trackName}
                                                        <br />
                                                        <a href={`/artist/${contribution.artistVanity}`} className="artist-name">
                                                            <small>{contribution.artistName}</small>
                                                        </a>
                                                    </div>
                                                    <span className="updated-at">
                                                        <i>
                                                            {contributionTypeMap[contribution.contributionType] || contribution.contributionType}
                                                        </i>
                                                    </span>
                                                </div>
                                            </a>
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
                        <br />
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
