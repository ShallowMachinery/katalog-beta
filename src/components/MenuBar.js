import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MenuBar.css';
import packageJson from '../../package.json';
import axios from 'axios';

function MenuBar() {
    const isMobile = window.innerWidth <= 768;
    const navigate = useNavigate();
    
    // Check login status
    const isLoggedIn = !!localStorage.getItem('user_id');
    const username = localStorage.getItem('user_name');
    
    // State to hold user details
    // const [firstName, setFirstName] = useState('');

    // Fetch user details if logged in
    // useEffect(() => {
    //     const fetchUserDetails = async () => {
    //         const userToken = localStorage.getItem('access_token'); // Retrieve the access token
    //         if (isLoggedIn && userToken) {
    //             try {
    //                 const response = await axios.get('http://192.168.100.8/katalog/beta/api/get-user-details.php', {
    //                     headers: {
    //                         'Authorization': `Bearer ${userToken}`
    //                     }
    //                 });

    //                 if (response.data.success) {
    //                     setFirstName(response.data.first_name);
    //                 } else {
    //                     console.error(response.data.message);
    //                 }
    //             } catch (error) {
    //                 console.error('Error fetching user details:', error);
    //             }
    //         }
    //     };
    //     fetchUserDetails();
    // }, [isLoggedIn]);

    // Handle logout
    const handleLogout = () => {
        localStorage.clear();
        navigate('/home');
    };

    return (
        <div className="menu-bar">
            <h1>
                <a href='/home'>Katalog {isMobile ? <small>beta</small> : <small>v{packageJson.version}-beta</small>}</a>
            </h1>
            <div className="menu-links">
                {isLoggedIn ? (
                    <>
                        <Link to={`/user/${username}`}>Profile</Link>
                        <span> | </span>
                        <span onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</span>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </div>
        </div>
    );
}

export default MenuBar;
