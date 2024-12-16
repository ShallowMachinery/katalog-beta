import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import './UserPage.css';
import NotificationToast from '../components/NotificationToast';

function UserPage() {
    const { username } = useParams();
    const [userInfo, setUserInfo] = useState(null);
    const [recentContributions, setRecentContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const limit = 10;
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const userToken = localStorage.getItem('access_token');

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
    };

    const fetchContributions = useCallback(async (userToken, username) => {
        try {
            const contributionsResponse = await axios.get(`/backend/user-recent-contributions.php`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
                params: { username },
            });
            setRecentContributions(contributionsResponse.data.contributions || []);
        } catch (error) {
            console.error('Error fetching contributions:', error);
        }
    }, []);

    const fetchUserInfo = useCallback(async () => {
        try {
            const userToken = localStorage.getItem('access_token');
            const response = await axios.get(`/backend/user-info.php`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
                params: {
                    username,
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
    }, [username, fetchContributions]);

    useEffect(() => {
        fetchUserInfo();
    }, [fetchUserInfo]);

    const decodeBase64 = (str) => {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        const decodedStr = atob(str);
        return JSON.parse(decodedStr);
    };

    const checkUserAndShowOverlay = useCallback(() => {
        const accessToken = userToken;
        const storedUserId = userInfo?.user_id;
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
        return false;
    }, [userToken, userInfo]);

    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files[0];

        if (!file) return;
        if (file.type !== 'image/jpeg') {
            alert('Only JPG files are allowed');
            return;
        }
        if (file.size > 1024 * 1024) {
            alert('File size should be less than 1MB');
            return;
        }

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await axios.post(`/backend/upload-profile-picture.php`, formData, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.status === "error") {
                showToast(response.data.message, "error");
            } else {
                showToast("Profile picture updated successfully!", "success");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showToast("Failed to upload profile picture", "error");
        }
    }, [userToken]);

    const handleNextPage = useCallback(() => {
        if ((page + 1) * limit < recentContributions.length) {
            setPage(page + 1);
        }
    }, [page, recentContributions.length]);

    const handlePreviousPage = useCallback(() => {
        if (page > 0) {
            setPage(page - 1);
        }
    }, [page]);

    const paginatedContributions = recentContributions.slice(page * limit, (page + 1) * limit);

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
        verified_lyrics: 'Verified',
        deleted_lyrics: 'Deleted',
        unverified_lyrics: 'Unverified'
    };

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="user-page-container">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div>
                <MenuBar />
                <div className="user-page-container">
                    <p className="user-not-existing">This user doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <MenuBar />
            {toast.show && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
            <div className="user-page-container">
                <div className="dynamic-background" style={{ backgroundImage: `url(${userInfo.user_picture_url})` }}></div>
                <div className="user-info">
                    <div className="user-picture-container">
                        <img
                            src={userInfo.user_picture_url && userInfo.user_picture_url.trim() !== ''
                                ? userInfo.user_picture_url
                                : '/assets_public/default_user.png'}
                            alt={userInfo.user_name}
                            className="user-picture"
                        />
                        {checkUserAndShowOverlay() && <div className="edit-profile-overlay">
                            <label>Update Profile Picture
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
                                                alt={`${contribution.trackName} cover`}
                                                className="album-cover"
                                            />
                                            <div className="text-container">
                                                <a href={`/lyrics/${contribution.artistVanity}/${contribution.trackVanity}`}>
                                                    {contribution.trackName}
                                                </a>
                                                <br />
                                                <a href={`/artist/${contribution.artistVanity}`} className="artist-name">
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
                        <p className="no-contributions">No recent contributions found.</p>
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
