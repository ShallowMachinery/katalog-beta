import React, { useEffect, useState } from 'react';
import AlbumImporter from './album-importer/albumImporter';
import ArtistImporter from './artist-importer/artistImporter';
import './Importer.css';
import { checkSession } from '../../SessionChecker';
import MenuBar from '../../MenuBar';

function Importer() {
  const [activeTab, setActiveTab] = useState('album');
  const userToken = localStorage.getItem('access_token');

  const renderContent = () => {
    if (activeTab === 'album') {
      return <div className="album-import-container"><AlbumImporter /></div>;
    } else if (activeTab === 'artist') {
      return <div className="artist-import-container"><ArtistImporter /></div>;
    }
  };


  useEffect(() => {
    const verifySession = async () => {
      const sessionExpired = await checkSession(); // Assuming checkSession is async
      const userToken = localStorage.getItem('access_token'); // Retrieve user token again in case of any changes

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
      </div>
    </div>
  );
}

export default Importer;
