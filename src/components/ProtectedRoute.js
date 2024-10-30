import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ element, allowedHierarchy }) {
    const userHierarchy = parseInt(localStorage.getItem('user_hierarchy'), 10);

    // If user's hierarchy matches the allowed level, grant access, else redirect
    if (userHierarchy === allowedHierarchy) {
        return element;
    } else {
        return <Navigate to="/home" replace />;
    }
}

export default ProtectedRoute;
