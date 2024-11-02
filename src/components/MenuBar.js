import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MenuBar.css';
import Modal from './Modal';
import packageJson from '../../package.json';

function MenuBar() {
    const isMobile = window.innerWidth <= 768;
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showMenuLinks, setShowMenuLinks] = useState(false);
    const menuLinksRef = useRef(null);

    const isLoggedIn = !!localStorage.getItem('user_id');
    const username = localStorage.getItem('user_name');

    const handleMenuLinksClick = () => {
        setShowMenuLinks(prev => !prev);
    };

    const handleClickOutside = (event) => {
        if (menuLinksRef.current && !menuLinksRef.current.contains(event.target)) {
            setShowMenuLinks(false);
        }
    };

    useEffect(() => {
        // Attach the event listener when options are shown
        if (showMenuLinks) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            // Clean up event listener
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenuLinks]);

    const handleLogout = () => {
        setIsModalOpen(true);
    };

    const confirmLogout = () => {
        localStorage.clear();
        navigate('/home');
        window.location.reload();
    };

    return (
        <div className="menu-bar">
            <h1>
                <a href='/home'>Katalog {isMobile ? <small>beta</small> : <small>v{packageJson.version}-beta</small>}</a>
            </h1>
            <div className="menu-links">
                {isLoggedIn ? (
                    <>
                        <span className="profile-menu" onClick={handleMenuLinksClick}>{username}</span>
                        {showMenuLinks && (
                            <div ref={menuLinksRef} className="overlay-container">
                                <ul>
                                    <a href={`/user/${username}`} className="profile-link"><li>Profile</li></a>
                                    <li onClick={handleLogout}>Logout</li>
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    <span className="links"><Link to="/login">Login</Link></span>
                )}
            </div>
            <Modal
                isOpen={isModalOpen}
                title="Confirm Logout"
                message="Are you sure you want to log out?"
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </div>
    );
}

export default MenuBar;
