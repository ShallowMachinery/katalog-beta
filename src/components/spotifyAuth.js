import axios from 'axios';
import refreshSpotifyToken from '../tokenRefresher'; // Adjust the path based on where this file is located

export const getSpotifyAccessToken = async () => {
    const accessTokenExpired = () => {        
        const expiryTime = localStorage.getItem('spotify_token_expiry');
        if (!expiryTime) return true;
        const now = new Date().getTime();
        return now > expiryTime;
    };

    let accessToken = localStorage.getItem('spotify_access_token');

    if (!accessToken || accessTokenExpired()) {
        accessToken = await refreshSpotifyToken();
    }

    return accessToken;
};