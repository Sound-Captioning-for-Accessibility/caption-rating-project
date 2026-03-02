import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import VideosPage from './components/VideosPage';
import VideoDetailPage from './components/VideoDetailPage';
import LearnPage from './components/LearnPage';
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
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'home';
  });
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

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
      // If backend auth fails, still keep local profile for UI
      setUser(profile);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const renderContent = () => {
    if (selectedVideoId) {
      return (
        <VideoDetailPage
          videoId={selectedVideoId}
          onBack={() => setSelectedVideoId(null)}
          currentUser={user}
        />
      );
    }
    if (currentPage === 'videos') {
      return <VideosPage onVideoClick={setSelectedVideoId} />;
    }
    if (currentPage === 'learn') {
      return <LearnPage />;
    }
    return <HomePage onNavigate={setCurrentPage} />;
  };

  const handleNavigate = (page) => {
    setSelectedVideoId(null);
    setCurrentPage(page);
  };

  return (
    <div className="app">
      <Header
        onNavigate={handleNavigate}
        currentPage={currentPage}
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
      {renderContent()}
      <Footer />
    </div>
  );
}

export default App;