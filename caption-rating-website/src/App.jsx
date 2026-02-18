import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import VideosPage from './components/VideosPage';
import VideoDetailPage from './components/VideoDetailPage';
import LearnPage from './components/LearnPage';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'home';
  });
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  const renderContent = () => {
    if (selectedVideoId) {
      return (
        <VideoDetailPage
          videoId={selectedVideoId}
          onBack={() => setSelectedVideoId(null)}
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
      <Header onNavigate={handleNavigate} currentPage={currentPage} />
      {renderContent()}
      <Footer />
    </div>
  );
}

export default App;