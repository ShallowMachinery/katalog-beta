import React, { useEffect } from 'react';
import './Modal.css';

const Modal = ({ isOpen, title, message, onClose, onConfirm, confirmLabel = "Yes", hideCloseButton = false }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'show' : ''}`} onClick={handleOverlayClick}>
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">
                <h2 id="modal-title">{title}</h2>
                <p id="modal-description">{message}</p>
                <div className="modal-actions">
                    <button onClick={onConfirm}>{confirmLabel}</button>
                    {!hideCloseButton && (
                        <button onClick={onClose}>No</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
