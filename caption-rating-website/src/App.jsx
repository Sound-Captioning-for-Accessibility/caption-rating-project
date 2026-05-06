import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/HomePage';
import VideosPage from './components/VideosPage';
import VideoDetailPage from './components/VideoDetailPage';
import LearnPage from './components/LearnPage';
import RGTPage from './components/RGTPage';
import Footer from './components/Footer';
import { authApi } from './services/api';
import './App.css';

const USER_STORAGE_KEY = 'caption-rater-google-user';

function decodeGoogleJwt(credential) {
  try {
    const payload = credential.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return {
      name: decoded.name ?? decoded.email ?? 'User',
      picture: decoded.picture ?? '',
      email: decoded.email ?? '',
      sub: decoded.sub,
    };
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  }, [user]);

  const handleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    const profile = decodeGoogleJwt(credentialResponse.credential);
    if (!profile) return;
    try {
      const backend = await authApi.google(credentialResponse.credential);
      setUser({
        ...profile,
        userID: backend.userID,
        displayName: backend.displayName,
        avatarUrl: backend.avatarUrl,
      });
    } catch {
      setUser(profile);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="app">
      <Header
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/videos/:videoId" element={<VideoDetailPage currentUser={user} />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/rgt" element={<RGTPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
