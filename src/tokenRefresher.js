import axios from 'axios';

const refreshSpotifyToken = async () => {
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.REACT_APP_SPOTIFY_REFRESH_TOKEN;

    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    };

    const data = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });

    try {
        const response = await axios.post(tokenUrl, data, { headers });
        const newAccessToken = response.data.access_token;

        localStorage.setItem('spotify_access_token', newAccessToken);
        const expiryTime = new Date().getTime() + response.data.expires_in * 1000;
        localStorage.setItem('spotify_token_expiry', expiryTime);

        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing Spotify token', error);
        throw error;
    }
};

export default refreshSpotifyToken;
