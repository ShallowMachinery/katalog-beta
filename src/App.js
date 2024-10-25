import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AdminTools from './components/AdminTools';
import Importer from './components/tools/Importer';
import ResolveDuplicateArtists from './components/tools/ResolveDuplicateArtists';
import ArtistPage from './components/ArtistPage';
import AlbumPage from './components/AlbumPage';
import LyricsPage from './components/LyricsPage';
import HomePage from './components/HomePage';


import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* admin */}
        <Route path="/katalog-admin/tools/" element={<AdminTools />} />
        <Route path="/katalog-admin/lyrics/:artistId/:trackId" element={<LyricsPage />} />
        <Route path="/katalog-admin/tools/importer" element={<Importer />} />
        <Route path="/katalog-admin/tools/artist-merger" element={<ResolveDuplicateArtists />} />

        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/lyrics/:artistId/:trackId" element={<LyricsPage />} />
        <Route path="/album/:artistVanity/:albumVanity" element={<AlbumPage />} />
        <Route path="/artist/:artistVanity" element={<ArtistPage />} />
      </Routes>
    </Router>
  );
}

export default App;
