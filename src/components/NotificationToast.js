import React, { useEffect, useState } from 'react';
import './NotificationToast.css';

const NotificationToast = ({ message, type, onClose }) => {
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsFading(true), 2500); // Start fade-out after 2.5 seconds
        const autoCloseTimer = setTimeout(onClose, 3000); // Auto-close after 3 seconds

        return () => {
            clearTimeout(timer);
            clearTimeout(autoCloseTimer);
        };
    }, [onClose]);

    return (
        <div className={`notification-toast ${type} ${isFading ? 'fade-out' : ''}`}>
            <span>{message}</span>
        </div>
    );
};

export default NotificationToast;
