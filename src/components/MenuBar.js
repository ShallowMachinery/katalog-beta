import React from 'react';
import './MenuBar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import packageJson from '../../package.json';

function MenuBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = location.pathname.includes('/katalog-admin/');
    const isLyricPage = location.pathname.includes('/lyrics');

    const toggleAdminView = () => {
        const currentPath = location.pathname;

        if (isAdmin) {
            navigate(currentPath.replace('/katalog-admin', ''));
            window.location.reload();
        } else {
            navigate(`/katalog-admin${currentPath}`);
        }
    };

    return (
        <div className="menu-bar">
            <h1><a href='/home'>Katalog <small>v{packageJson.version}-beta</small></a></h1>
            {isLyricPage && (<button className="admin-toggle-button" onClick={toggleAdminView}>
                {isAdmin ? 'View as User' : 'View as Admin'}
            </button>)}
        </div>
    );
}

export default MenuBar;
