import React from 'react';
import { Navigate } from 'react-router-dom';

function AuthenticatedRoute({ element }) {
    const isLoggedIn = !!localStorage.getItem('user_id'); // Check if user_id exists

    return isLoggedIn ? (
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
