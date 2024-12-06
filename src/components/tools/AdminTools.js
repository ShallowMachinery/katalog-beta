import React from 'react';
import { Link } from 'react-router-dom';
import MenuBar from '../MenuBar';
import './AdminTools.css';

function AdminTools() {
    return (
        <div className="admin-tools-container">
            <MenuBar />
            <h2 className="admin-tools-title">Admin Tools</h2>
            <div className="tool-list">
                <Link to={`/katalog-admin/tools/importer`} className="tool-entry">
                    <h4>Importer</h4>
                    <span className="tool-description">Import albums or artists to the database from Spotify API</span>
                </Link>
                <Link to={`/katalog-admin/tools/artist-merger`} className="tool-entry">
                    <h4>Artist Merger</h4>
                    <span className="tool-description">Resolve duplicate artist entries</span>
                </Link>
                <Link to={`/katalog-admin/tools/track-merger`} className="tool-entry">
                    <h4>Track Merger</h4>
                    <span className="tool-description">Resolve duplicate track entries</span>
                </Link>
            </div>
        </div>
    );
}

export default AdminTools;
