import React from 'react';
import './Header.css';

const Header = ({ onNavigate, currentPage }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">cc</div>
          <span className="logo-text">CaptionRater</span>
        </div>
        
        <nav className="navigation">
          <button 
            onClick={() => onNavigate('home')} 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={() => onNavigate('videos')} 
            className={`nav-link ${currentPage === 'videos' ? 'active' : ''}`}
          >
            Videos
          </button>
          <button 
            onClick={() => onNavigate('learn')} 
            className={`nav-link ${currentPage === 'learn' ? 'active' : ''}`}
          >
            Learn
          </button>
        </nav>
        
        <div className="header-actions">
          <button className="install-extension-btn" onClick={() => window.open('https://github.com/yourusername/caption-rating-extension2', '_blank')}>
            Install Extension
          </button>
          <div className="user-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="black"/>
              <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="black"/>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
