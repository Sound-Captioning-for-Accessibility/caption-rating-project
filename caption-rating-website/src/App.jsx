import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import VideoSection from './components/VideoSection';
import VideosPage from './components/VideosPage';
import LearnPage from './components/LearnPage';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Get saved page from localStorage, default to 'home'
    return localStorage.getItem('currentPage') || 'home';
  });

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Sample video data
  const recommendedVideos = [
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" }
  ];

  const recentlyViewedVideos = [
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" }
  ];

  const recentlyRatedVideos = [
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" },
    { title: "Video Title", category: "Category" }
  ];

  const renderContent = () => {
    if (currentPage === 'videos') {
      return <VideosPage />;
    }
    
    if (currentPage === 'learn') {
      return <LearnPage />;
    }
    
    return (
      <>
        <SearchBar />
        <main className="main-content">
          <VideoSection 
            title="Recommended Videos" 
            videos={recommendedVideos} 
          />
          <VideoSection 
            title="Recently Viewed" 
            videos={recentlyViewedVideos} 
          />
          <VideoSection 
            title="Recently Rated" 
            videos={recentlyRatedVideos} 
          />
        </main>
      </>
    );
  };

  return (
    <div className="app">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      {renderContent()}
      <Footer />
    </div>
  );
}

export default App;