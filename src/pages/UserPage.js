import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import './UserPage.css';

function UserPage() {
    const { username } = useParams();
    const [userInfo, setUserInfo] = useState(null);
    const [recentContributions, setRecentContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0); // Current page
    const [totalContributions, setTotalContributions] = useState(0); // Total contributions count
    const limit = 10; // Contributions per page
    const userToken = localStorage.getItem('access_token');
    const baseUrl = `${window.location.protocol}//${window.location.hostname}`;

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                // Fetch user information based on userId
                const response = await axios.get(`${baseUrl}/katalog/beta/api/user-info.php`, {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    },
                    params: {
                        username, // Send userId as a query parameter if needed
                    },
                });
                const userData = response.data;

                if (userData) {
                    setUserInfo(userData.userInfo);
                    document.title = `${userData.userInfo.user_name}'s profile | Katalog`;
                }

                await fetchContributions(userToken, username);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user info or data:', error);
                setLoading(false);
            }
        };
        fetchUserInfo();
    }, [username, page]);

    const fetchContributions = async (userToken, username) => {
        try {
            const contributionsResponse = await axios.get(`${baseUrl}/katalog/beta/api/user-recent-contributions.php`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
                params: { username },
            });
            setRecentContributions(contributionsResponse.data.contributions || []);
        } catch (error) {
            console.error('Error fetching contributions:', error);
        }
    };

    function decodeBase64(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        const decodedStr = atob(str);
        return JSON.parse(decodedStr);
    }

    function checkUserAndShowOverlay() {
        const accessToken = userToken;
        const storedUserId = userInfo.user_id;
        if (accessToken && storedUserId) {
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3) {
                const payload = decodeBase64(tokenParts[1]);
                const userIdFromToken = payload.data?.user_id;
                if (userIdFromToken && userIdFromToken === storedUserId) {
                    return true;
                }
            }
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;
        if (file.type !== 'image/jpeg') {
            alert('Only JPG files are allowed');
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB size limit
            alert('File size should be less than 1MB');
            return;
        }

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await axios.post(`${baseUrl}/katalog/beta/api/upload-profile-picture.php`, formData, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            alert('Profile picture updated successfully');
            window.location.reload();
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Failed to upload profile picture');
        }
    };

    const handleNextPage = () => {
        if ((page + 1) * limit < recentContributions.length) {
            setPage(page + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            setPage(page - 1);
        }
    };

    const paginatedContributions = recentContributions.slice(page * limit, (page + 1) * limit);

    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval;

        if (seconds < 60) {
            return seconds < 10 ? "just now" : seconds + " seconds ago";
        }

        if (seconds < 3600) { // Less than an hour
            interval = Math.floor(seconds / 60);
            return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
        }

        if (seconds < 86400) { // Less than a day
            interval = Math.floor(seconds / 3600);
            return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
        }

        if (seconds < 31536000) { // Less than a year
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
        verified_lyrics: 'Verified',
        deleted_lyrics: 'Deleted', // Add any other types you want to handle
        unverified_lyrics: 'Unverified' // Example for another type
    };

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="user-page-container">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div>
                <MenuBar />
                <div className="user-page-container">
                    <p>This user doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <MenuBar />
            <div className="user-page-container">
                <div className="dynamic-background" style={{ backgroundImage: `url(${userInfo.user_picture_url})` }}></div>
                <div className="user-info">
                    <div className="user-picture-container">
                        <img
                            src={userInfo.user_picture_url && userInfo.user_picture_url.trim() !== ''
                                ? userInfo.user_picture_url
                                : '/assets_public/default_user.png'}
                            alt="User Profile Picture"
                            className="user-picture"
                        />
                        {checkUserAndShowOverlay() && <div className="edit-profile-overlay">
                            <label>Edit Profile Picture
                                <input
                                    type="file"
                                    accept="image/jpeg"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>} 
                    </div>
                    <div className="user-details">
                        <p className="type">{userInfo.user_type_name}</p>
                        <h1 className="legal-name">{userInfo.first_name} {userInfo.last_name}</h1>
                        <p className="username">{userInfo.user_name}</p>
                        <p className="points">{userInfo.user_points || 0} points</p>
                    </div>
                </div>

                <div className="recent-contributions">
                    <h1>Recent Contributions</h1>
                    {paginatedContributions.length > 0 ? (
                        <ul>
                            {paginatedContributions.map((contribution, index) => {
                                const updatedDate = new Date(contribution.createdAt);
                                const now = new Date();
                                const isYesterdayOrBefore = updatedDate < new Date(now.setDate(now.getDate() - 1));

                                return (
                                    <li key={index}>
                                        <div className="contribution-item">
                                            <img
                                                src={contribution.albumCoverUrl}
                                                alt={`${contribution.trackName} cover`}  // Fixed string interpolation
                                                className="album-cover"
                                            />
                                            <div className="text-container">
                                                <a href={`/lyrics/${contribution.artistVanity}/${contribution.trackVanity}`}> {/* Fixed href */}
                                                    {contribution.trackName}
                                                </a>
                                                <br />
                                                <a href={`/artist/${contribution.artistVanity}`} className="artist-name"> {/* Fixed href */}
                                                    <small>{contribution.artistName}</small>
                                                </a>
                                            </div>
                                            <span className="updated-at">
                                                <i>
                                                    {contributionTypeMap[contribution.contributionType] || contribution.contributionType}
                                                    <span> </span>{isYesterdayOrBefore
                                                        ? formatFullDate(contribution.createdAt)
                                                        : timeSince(contribution.createdAt)}
                                                </i>
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p>No recent contributions found.</p>
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
                </div>
            </div>
        </div>
    );

}

export default UserPage;
