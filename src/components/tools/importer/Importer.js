import React, { useState } from 'react';
import AlbumImporter from './album-importer/albumImporter';
import ArtistImporter from './artist-importer/artistImporter';
import './Importer.css';
import MenuBar from '../../MenuBar';

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
      <MenuBar />
      <div className="import-box">
        <h2>Importer</h2>
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
