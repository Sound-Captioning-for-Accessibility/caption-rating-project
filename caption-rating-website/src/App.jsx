import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import VideosPage from './components/VideosPage';
import LearnPage from './components/LearnPage';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'home';
  });

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  const renderContent = () => {
    if (currentPage === 'videos') {
      return <VideosPage />;
    }
    
    if (currentPage === 'learn') {
      return <LearnPage />;
    }
    
    return <HomePage onNavigate={setCurrentPage} />;
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