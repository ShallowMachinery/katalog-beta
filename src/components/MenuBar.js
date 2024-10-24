import React from 'react';
import './MenuBar.css';
import packageJson from '../../package.json';

function MenuBar() {
    return (
        <div className="menu-bar">
            <h1>Katalog <small>v{packageJson.version}-beta</small></h1>
        </div>
    );
}

export default MenuBar;
