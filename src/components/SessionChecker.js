import axios from 'axios';

export const checkSession = async () => {
    const userToken = localStorage.getItem('access_token');
    const baseUrl = `${window.location.protocol}//${window.location.hostname}`;
    try {
        const response = await axios.get(`${baseUrl}/katalog/beta/api/check-session.php`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const isSessionExpired = response.data.success === false;
        return isSessionExpired;
    } catch (error) {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        throw error;
    }
};
