import React, { useState } from 'react';
import AlbumImporter from './components/album-importer/albumImporter';
import ArtistImporter from './components/artist-importer/artistImporter';
import './Importer.css';

function Importer() {
  const [activeTab, setActiveTab] = useState('album');

  const renderContent = () => {
    if (activeTab === 'album') {
      return <div className="album-import-container"><AlbumImporter /></div>;
    } else if (activeTab === 'artist') {
      return <div className="artist-import-container"><ArtistImporter /></div>;
    }
  };

  return (
    <div className="App">
      <div className="import-box">
        <h2>Katalog v0.1.1-beta Importer</h2>
        <div className="importer-div">
          <div className="tabs">
            <button onClick={() => setActiveTab('album')} className={activeTab === 'album' ? 'active' : ''}>Album Import</button>
            <button onClick={() => setActiveTab('artist')} className={activeTab === 'artist' ? 'active' : ''}>Artist Import</button>
          </div>
          <div className="tab-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Importer;
