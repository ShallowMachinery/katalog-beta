import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faSignature, faCalendar } from '@fortawesome/free-solid-svg-icons';
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

    const navigate = useNavigate();

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
            const response = await axios.post(`/backend/register.php`, {
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
                navigate('/login');
                setTimeout(() => {
                    showToast("Registration successful! Please log in.", 'success');
                }, 500);
            } else {
                showToast(response.data.message, 'error');
            }
        } catch (error) {
            console.error('Error registering:', error);
            showToast("An error occurred during registration. Please try again later.", 'error');
        }
    };

    return (
        <div className="register-page-container">
            <MenuBar />
            <div className="register-wrapper">
                <div className="register-container">
                    <h2>Create an Account</h2>
                    {toast.show && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <FontAwesomeIcon icon={faUser} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <div className="input-icon-wrapper">
                                    <FontAwesomeIcon icon={faSignature} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        autoComplete="given-name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-icon-wrapper">
                                    <FontAwesomeIcon icon={faSignature} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Middle Name (Optional)"
                                        value={middleName}
                                        onChange={(e) => setMiddleName(e.target.value)}
                                        autoComplete="additional-name"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="input-icon-wrapper">
                                    <FontAwesomeIcon icon={faSignature} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Surname"
                                        value={surname}
                                        onChange={(e) => setSurname(e.target.value)}
                                        autoComplete="family-name"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <FontAwesomeIcon icon={faCalendar} className="input-icon" />
                                <input
                                    type="date"
                                    id="birthday"
                                    placeholder="Birthday"
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    required
                                    max={maxDateStr}
                                    autoComplete="bday"
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
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <FontAwesomeIcon icon={faLock} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="register-button">Create Account</button>
                        <div className="login-link">
                            Already have an account? <Link to="/login">Sign in</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
