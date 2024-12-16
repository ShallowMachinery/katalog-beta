import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlbumImporter from './album-importer/albumImporter';
import ArtistImporter from './artist-importer/artistImporter';
import './Importer.css';
import { checkSession } from '../../SessionChecker';
import MenuBar from '../../MenuBar';

function Importer() {
  const [activeTab, setActiveTab] = useState('album');
  const navigate = useNavigate();

  const renderContent = () => {
    if (activeTab === 'album') {
      return <div className="album-import-container"><AlbumImporter /></div>;
    } else if (activeTab === 'artist') {
      return <div className="artist-import-container"><ArtistImporter /></div>;
    }
  };

  useEffect(() => {
    const verifySession = async () => {
      const sessionExpired = await checkSession();
      const userToken = localStorage.getItem('access_token');

      if (sessionExpired && userToken) {
        localStorage.clear();
        window.location.reload();
      }
    };

    verifySession();
  }, []);

  return (
    <div className="App">
      <MenuBar />
      <div className="import-box">
        <h2>Album and Artist Data Importer</h2>
        <div className="importer-div">
          <div className="tabs">
            <button onClick={() => setActiveTab('album')} className={activeTab === 'album' ? 'active' : ''}>Album Import</button>
            <button onClick={() => setActiveTab('artist')} className={activeTab === 'artist' ? 'active' : ''}>Artist Import</button>
          </div>
          <div className="tab-content">
            {renderContent()}
          </div>
        </div>
        <button onClick={() => navigate("/katalog-admin/tools")} style={{ marginTop: "1rem" }}>Go back to tools</button>
      </div>
    </div>
  );
}

export default Importer;
