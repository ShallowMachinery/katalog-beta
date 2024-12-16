import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
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

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
    };

    document.title = `Log in | Katalog`;

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
            const response = await axios.post(`/backend/login.php`, {
                username,
                password
            });
    
            if (response.data.success) {
                const { user_id, user_name, user_hierarchy, token } = response.data.user;
                localStorage.setItem('user_id', user_id);
                localStorage.setItem('user_name', user_name);
                localStorage.setItem('user_hierarchy', user_hierarchy);
                localStorage.setItem('access_token', token);
                showToast('Login successful! Welcome back, ' + user_name + '.', 'success');
                setTimeout(() => {
                    login();
                    const redirectPath = location.state?.from || '/home';
                    navigate(redirectPath);
                }, 2000);
            } else {
                showToast('Wrong credentials, please try again.', 'error');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            showToast('An error occurred during login. Please try again later.', 'error');
        }
    };
    
    return (
        <div className="login-page-container">
            <MenuBar />
            <div className="login-wrapper">
            {toast.show && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
                <div className="login-container">
                    <h2>Welcome Back</h2>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <FontAwesomeIcon icon={faUser} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <FontAwesomeIcon icon={faLock} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                        <button type="submit" className="login-button">
                            Sign In
                        </button>
                    </form>
                    <div className="register-link">
                        Don't have an account? <Link to="/register">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
