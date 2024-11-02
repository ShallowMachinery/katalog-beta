import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import MenuBar from '../components/MenuBar';
import NotificationToast from '../components/NotificationToast';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [surname, setSurname] = useState('');
    const [birthday, setBirthday] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const navigate = useNavigate(); // Initialize navigate

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
    };

    document.title = `Register | Katalog`;

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast("Passwords do not match.", 'error');
            return;
        }

        try {
            const response = await axios.post('http://192.168.100.8/katalog/beta/api/register.php', {
                username,
                email,
                password,
                firstName,
                middleName,
                surname,
                birthday,
            });
            console.log('Register response:', response.data);

            if (response.data.success) {
                navigate('/login'); // Redirect to login page on success
                setTimeout(() => {
                    showToast("Registration successful! Please log in.", 'success'); // Show success toast after delay
                }, 500);
            } else {
                showToast(response.data.message, 'error');
            }
        } catch (error) {
            console.error('Error registering:', error);
            showToast("An error occurred during registration. Please try again later.", 'error'); // Show toast for error catch
        }
    };

    return (
        <div className="register-container">
            <MenuBar />
            <h2>Create an Account</h2>
            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Middle Name (Optional)"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                />
                <input
                    type="date"
                    placeholder="Birthday"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    required max={maxDateStr}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default RegisterPage;
