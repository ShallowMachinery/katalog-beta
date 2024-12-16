import React from 'react';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ element, adminOnly }) {
    const accessToken = localStorage.getItem('access_token');
    let isAdmin = false;

    if (accessToken) {
        try {
            const decodedToken = jwtDecode(accessToken);
            isAdmin = decodedToken?.data.user_id && decodedToken?.data.user_name && (decodedToken?.data.user_hierarchy === 1);
        } catch (error) {
            console.error('Invalid token:', error);
        }
    }

    if (isAdmin === adminOnly) {
        return element;
    } else {
        return <Navigate to="/home" replace />;
    }
}

export default ProtectedRoute;
