import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import AdminTools from './components/tools/AdminTools';
import Importer from './components/tools/importer/Importer';
import ResolveDuplicateArtists from './components/tools/merger/ResolveDuplicateArtists';
import ResolveDuplicateTracks from './components/tools/merger/ResolveDuplicateTracks';
import TrackEditor from './components/tools/catalogue-editor/trackEditor';
import AlbumEditor from './components/tools/catalogue-editor/albumEditor';
import ArtistEditor from './components/tools/catalogue-editor/artistEditor';
import ArtistPage from './pages/ArtistPage';
import AlbumPage from './pages/AlbumPage';
import LyricsPage from './pages/LyricsPage';
import HomePage from './main/HomePage';
import LoginPage from './main/LoginPage';
import RegisterPage from './main/RegisterPage';
import UserPage from './pages/UserPage';
import AdminPage from './components/tools/AdminPage';
import NotFoundPage from './main/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import DatabaseReports from './components/tools/reports/DatabaseReports';

import './App.css';

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Admin routes */}
        <Route
          path="/katalog-admin/tools"
          element={<ProtectedRoute element={<AdminTools />} adminOnly={true} />}
        />
        <Route
          path="/katalog-admin/tools/all"
          element={<ProtectedRoute element={<AdminPage />} adminOnly={true} />}
        />
        <Route
          path="/katalog-admin/tools/importer"
          element={<ProtectedRoute element={<Importer />} adminOnly={true} />}
        />
        <Route
          path="/katalog-admin/tools/artist-merger"
          element={<ProtectedRoute element={<ResolveDuplicateArtists />} adminOnly={true} />}
        />
        <Route
          path="/katalog-admin/tools/track-merger"
          element={<ProtectedRoute element={<ResolveDuplicateTracks />} adminOnly={true} />}
        />
        <Route
          path="/katalog-admin/reports"
          element={<ProtectedRoute element={<DatabaseReports />} adminOnly={true} />}
        />
        <Route
          path="/katalog-admin/catalogue-editor/track/:trackId"
          element={<ProtectedRoute element={<TrackEditor />} adminOnly={true} />}
        />
        <Route
          path="/katalog-admin/catalogue-editor/album/:albumId"
          element={<ProtectedRoute element={<AlbumEditor />} adminOnly={true} />}
        />
        <Route
          path="/katalog-admin/catalogue-editor/artist/:artistId"
          element={<ProtectedRoute element={<ArtistEditor />} adminOnly={true} />}
        />

        {/* Public routes */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/home" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isLoggedIn ? <Navigate to="/home" /> : <RegisterPage />}
        />
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/lyrics/:artistVanity/:trackVanity" element={<LyricsPage />} />
        <Route path="/album/:artistVanity/:albumVanity" element={<AlbumPage />} />
        <Route path="/artist/:artistVanity" element={<ArtistPage />} />

        <Route path="/user/:username" element={<AuthenticatedRoute element={<UserPage />} />} />

        {/* 404 Not Found Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
