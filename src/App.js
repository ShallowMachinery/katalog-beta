import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Importer from './components/Importer';
import ArtistPage from './components/ArtistPage';
import AlbumPage from './components/AlbumPage';
import LyricsPage from './components/LyricsPage';
import HomePage from './components/HomePage';
import ResolveDuplicateArtists from './components/ResolveDuplicateArtists';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* admin */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/katalog-admin/lyrics/:artistVanity/:trackVanity" element={<LyricsPage />} />
        <Route path="/katalog-admin/tools/importer" element={<Importer />} />
        <Route path="/katalog-admin/tools/artist-merger" element={<ResolveDuplicateArtists />} />
        <Route path="/lyrics/:artistVanity/:trackVanity" element={<LyricsPage />} />
        <Route path="/album/:artistVanity/:albumVanity" element={<AlbumPage />} />
        <Route path="/artist/:artistVanity" element={<ArtistPage />} />
      </Routes>
    </Router>
  );
}

export default App;
