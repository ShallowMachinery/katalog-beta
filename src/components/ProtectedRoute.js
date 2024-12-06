import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ element, allowedHierarchy }) {
    const userHierarchy = parseInt(localStorage.getItem('user_hierarchy'), 10);
    if (userHierarchy === allowedHierarchy) {
        return element;
    } else {
        return <Navigate to="/home" replace />;
    }
}

export default ProtectedRoute;
