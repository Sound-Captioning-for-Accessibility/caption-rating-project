import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Header.css';
import { GoogleLogin, googleLogout } from "@react-oauth/google";

const Header = ({ user, onLoginSuccess, onLogout }) => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/home" className="logo" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <div className="logo-icon">cc</div>
          <span className="logo-text">CaptionCommons</span>
        </Link>

        <nav className="navigation">
          <NavLink
            to="/home"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/videos"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Videos
          </NavLink>
          <NavLink
            to="/learn"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Learn
          </NavLink>
        </nav>

        <div className="header-actions">
          <button
            className="install-extension-btn"
            onClick={() => window.open('https://chromewebstore.google.com/detail/caption-rater/ndloeglkmakidkmdkkkpaokcfcfibdnl?utm_source=item-share-cbhttps://github.com/yourusername/caption-rating-extension2', '_blank')}
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
