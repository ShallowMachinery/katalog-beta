import React from 'react';
import './MenuBar.css';
import packageJson from '../../package.json';

function MenuBar() {
    return (
        <div className="menu-bar">
            <h1><a href='/home'>Katalog <small>v{packageJson.version}-beta</small></a></h1>
        </div>
    );
}

export default MenuBar;
