import React from 'react';
import { Link } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import './NotFoundPage.css';

function NotFoundPage() {
    return (
        <div className="not-found-container">
            <MenuBar />
            <h2>Oops! Where are you going?</h2>
            <p>The page you are looking for does not exist.</p>
            <Link to="/" className="home-link">Go back to Home</Link>
        </div>
    );
}

export default NotFoundPage;
