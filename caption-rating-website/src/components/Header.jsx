import React from 'react';
import './Header.css';
import { GoogleLogin, googleLogout } from "@react-oauth/google";

const Header = ({ onNavigate, currentPage, user, onLoginSuccess, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
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
          <button
            className="install-extension-btn"
            onClick={() => window.open('https://github.com/yourusername/caption-rating-extension2', '_blank')}
          >
            Install Extension
          </button>

          {!user ? (
            <div className="google-login">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  onLoginSuccess?.(credentialResponse);
                }}
                onError={() => {
                  console.log("Google Login Failed");
                }}
              />
            </div>
          ) : (
            <div className="user-menu">
              <div className="user-chip">
                <img className="user-avatar" src={user.picture} alt={user.name} title={user.name} />
              </div>
              <button
                className="signout-btn"
                onClick={() => {
                  googleLogout();
                  onLogout?.();
                }}
                type="button"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;