import React, { useEffect, useState } from 'react';
import './NotificationToast.css';

const NotificationToast = ({ message, type, onClose }) => {
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsFading(true), 2500);
        const autoCloseTimer = setTimeout(onClose, 3000);

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
