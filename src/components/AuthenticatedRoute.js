import React from 'react';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';

function AuthenticatedRoute({ element }) {
    const accessToken = localStorage.getItem('access_token');
    let isUser = false;

    if (accessToken) {
        try {
            const decodedToken = jwtDecode(accessToken);
            isUser = decodedToken?.data.user_id && decodedToken?.data.user_name;
        } catch (error) {
            console.error('Invalid token:', error);
        }
    }

    return isUser ? (
        element
    ) : (
        <Navigate 
            to="/login" 
            replace 
            state={{
                message: 'You must be logged in first to do that.',
                from: window.location.pathname
            }}
        />
    );
}

export default AuthenticatedRoute;
