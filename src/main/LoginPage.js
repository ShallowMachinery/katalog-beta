import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './LoginPage.css';
import MenuBar from '../components/MenuBar';
import { useAuth } from '../AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/home');
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (location.state?.message) {
            setErrorMessage(location.state.message);
        }
    }, [location.state]);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://192.168.100.8/katalog/beta/api/login.php', {
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
                login();
                navigate('/home');
            } else {
                alert("Login failed. Check your credentials.");
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };


    return (
        <div className="login-container">
            <MenuBar />
            <h2>Login</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
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
    );
}

export default LoginPage;
