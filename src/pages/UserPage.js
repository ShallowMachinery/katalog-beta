import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import './UserPage.css';

function UserPage() {
    const { username } = useParams();
    const [userInfo, setUserInfo] = useState(null);
    const [userPoints, setUserPoints] = useState(0);
    const [recentContributions, setRecentContributions] = useState([]);
    const [favoriteTracks, setFavoriteTracks] = useState([]);
    const [favoriteAlbums, setFavoriteAlbums] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserInfo = async () => {
            const userToken = localStorage.getItem('access_token');
            try {
                // Fetch user information based on userId
                const response = await axios.get('http://192.168.100.8/katalog/beta/api/user-info.php', {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    },
                    params: {
                        username, // Send userId as a query parameter if needed
                    },
                });
                const userData = response.data;
                console.log(userData);

                if (userData) {
                    setUserInfo(userData.userInfo);
                    setUserPoints(userData.userInfo.user_points || 0); // Set user points
                    document.title = `${userData.userInfo.user_name}'s profile | Katalog`;
                }

                // const tracksResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/user-favorite-tracks.php`, {
                //     params: { userId },
                // });
                // setFavoriteTracks(tracksResponse.data.tracks);

                // const albumsResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/user-favorite-albums.php`, {
                //     params: { userId },
                // });
                // setFavoriteAlbums(albumsResponse.data.albums);

                // const friendsResponse = await axios.get(`http://192.168.100.8/katalog/beta/api/user-friends.php`, {
                //     params: { userId },
                // });
                // setFriends(friendsResponse.data.friends);

                const contributionsResponse = await axios.get('http://192.168.100.8/katalog/beta/api/user-recent-contributions.php', {
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    },
                    params: {
                        username,
                    },
                });
                setRecentContributions(contributionsResponse.data.contributions || []);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching user info or data:', error);
                setLoading(false);
            }
        };
        fetchUserInfo();
    }, [username]);

    const timeSince = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval;

        if (seconds < 60) {
            return seconds < 10 ? "Just now" : seconds + " seconds ago";
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

    if (loading) {
        return (
            <div>
                <MenuBar />
                <div className="user-page-container">
                    <p>Loading user profile...</p>
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
                    <img
                        src={userInfo.user_picture_url && userInfo.user_picture_url.trim() !== '' ? userInfo.user_picture_url : ''}
                        alt=""
                        className="user-picture"
                    />
                    <div className="user-details">
                        <p className="type">{userInfo.user_type_name}</p>
                        <h1 className="legal-name">{userInfo.first_name} {userInfo.last_name}</h1>
                        <p className="username">{userInfo.user_name}</p>
                        <p className="points">{userInfo.user_points || 0} points</p>
                    </div>
                </div>

                <div className="recent-contributions">
                    <h1>Recent Contributions</h1>
                    {recentContributions.length > 0 ? (
                        <ul>
                            {recentContributions.map((contribution, index) => {
                                const updatedDate = new Date(contribution.updatedAt);
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
                                                <a href={`/lyrics/${contribution.artistId}/${contribution.trackId}`}>
                                                    {contribution.trackName}
                                                </a>
                                                <br />
                                                <a href={`/artist/${contribution.artistVanity}`} className="artist-name">
                                                    <small>{contribution.artistName}</small>
                                                </a>
                                            </div>
                                            <span className="updated-at">
                                                <i>{isYesterdayOrBefore
                                                    ? formatFullDate(contribution.updatedAt)
                                                    : timeSince(contribution.updatedAt)}
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
                </div>

            </div>
        </div>
    );

    // return (
    //     <div>
    //         <MenuBar />
    //         <div className="user-page-container">
    //             <div className="dynamic-background" style={{ backgroundImage: `url(${userInfo.userPictureUrl})` }}></div>
    //             <div className="user-info">
    //                 <img
    //                     src={userInfo.userPictureUrl ? userInfo.userPictureUrl : '/assets_public/default-user.svg'}
    //                     alt="user"
    //                     className="user-picture"
    //                 />
    //                 <div className="user-details">
    //                     <h1 className="user-name">{userInfo.userName}</h1>
    //                     {/* <p className="user-bio">{userInfo.userBio || 'No bio available'}</p> */}
    //                 </div>
    //             </div>

    //             {/* <div className="favorites-section">
    //                 <h3>Favorite Albums</h3>
    //                 <ul className="favorite-album-list">
    //                     {favoriteAlbums.length > 0 ? (
    //                         favoriteAlbums.map((album, index) => (
    //                             <li key={`${album.albumId}-${index}`}>
    //                                 <a href={`/album/${album.artistVanity}/${album.albumVanity}`}>
    //                                     <img src={album.albumCoverUrl} alt={album.albumName} className="album-cover" />
    //                                     <span className="album-name">{album.albumName}</span>
    //                                 </a>
    //                             </li>
    //                         ))
    //                     ) : (
    //                         <p>No favorite albums listed.</p>
    //                     )}
    //                 </ul>
    //             </div> */}

    //             {/* <div className="favorite-tracks-section">
    //                 <h3>Favorite Tracks</h3>
    //                 <ul className="favorite-track-list">
    //                     {favoriteTracks.length > 0 ? (
    //                         favoriteTracks.map((track, index) => (
    //                             <li key={`${track.trackId}-${index}`}>
    //                                 <a href={`/lyrics/${track.trackMainArtistId}/${track.trackId}`}>{track.trackName}</a>
    //                             </li>
    //                         ))
    //                     ) : (
    //                         <p>No favorite tracks listed.</p>
    //                     )}
    //                 </ul>
    //             </div> */}

    //             {/* <div className="friends-section">
    //                 <h3>Friends</h3>
    //                 <ul className="friends-list">
    //                     {friends.length > 0 ? (
    //                         friends.map((friend, index) => (
    //                             <li key={`${friend.userVanity}-${index}`} className="friend-item">
    //                                 <a href={`/user/${friend.userVanity}`}>
    //                                     <img src={friend.userPictureUrl || '/assets_public/default-user.svg'}
    //                                         alt={friend.userName}
    //                                         className="friend-picture" />
    //                                     <span>{friend.userName}</span>
    //                                 </a>
    //                             </li>
    //                         ))
    //                     ) : (
    //                         <p>No friends listed.</p>
    //                     )}
    //                 </ul>
    //             </div> */}
    //         </div>
    //     </div>
    // );
}

export default UserPage;
