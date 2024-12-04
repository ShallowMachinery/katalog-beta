import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './LoginPage.css';
import MenuBar from '../components/MenuBar';
import { useAuth } from '../AuthContext';
import NotificationToast from '../components/NotificationToast';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const baseUrl = `${window.location.protocol}//${window.location.hostname}`;

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
    };

    document.title = `Login | Katalog`;

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/home');
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (location.state?.message) {
            showToast(location.state.message, 'error');
        }
    }, [location.state]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setToast({ show: false, message: '', type: '' });
    
        try {
            const response = await axios.post(`${baseUrl}/katalog/beta/api/login.php`, {
                username,
                password
            });
    
            console.log("Login response:", response.data);
    
            if (response.data.success) {
                const { user_id, user_name, user_hierarchy, token } = response.data.user;
                localStorage.setItem('user_id', user_id);
                localStorage.setItem('user_name', user_name);
                localStorage.setItem('user_hierarchy', user_hierarchy);
                localStorage.setItem('access_token', token);
                showToast('Login successful! Welcome back, ' + user_name + '.', 'success'); // Show success toast
                setTimeout(() => {
                    login();
                    // Check if there is a referrer location to navigate to
                    const redirectPath = location.state?.from || '/home'; // Default to home if no referrer
                    navigate(redirectPath); // Redirect to the referrer or home page
                }, 2000); // 2000 milliseconds (2 seconds)
            } else {
                showToast('Wrong credentials, please try again.', 'error');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            showToast('An error occurred during login. Please try again later.', 'error'); // Show toast for error catch
        }
    };
    
    return (
        <div>
            <MenuBar />
            <div className="login-container">
            <h2>Login</h2>
            {toast.show && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
            </form>
            <p className="register-link">
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
        </div>
    );
}

export default LoginPage;
