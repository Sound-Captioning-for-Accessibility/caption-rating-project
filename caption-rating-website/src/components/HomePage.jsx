import React from 'react';
import './HomePage.css';

const HomePage = ({ onNavigate }) => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-section-content">
          <h1 className="hero-title">Discover Videos with Quality Captions</h1>
          <p className="hero-subtitle">
            Our community rates video captions for quality and accuracy. Find the most accessible content across the web.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="chrome-icon">
                <g clipPath="url(#clip0_115_3952)">
                  <path d="M0 9C0 7.36172 0.438398 5.82187 1.2048 4.46836L5.06602 11.1902C5.83594 12.5684 7.30898 13.5 9 13.5C9.50273 13.5 9.95273 13.4191 10.4344 13.268L7.75195 17.9156C3.37148 17.3074 0 13.5457 0 9ZM12.8355 11.3063C13.268 10.6313 13.5 9.81211 13.5 9C13.5 7.65703 12.9094 6.45117 11.9777 5.625H17.3461C17.768 6.66563 18 7.8082 18 9C18 13.9711 13.9711 17.9684 9 18L12.8355 11.3063ZM16.7977 4.5H9C6.78867 4.5 5.00273 6.05039 4.58789 8.11055L1.90512 3.46184C3.55078 1.35457 6.11719 0 9 0C12.3328 0 15.2402 1.80984 16.7977 4.5ZM5.90625 9C5.90625 7.29141 7.29141 5.90625 9 5.90625C10.7086 5.90625 12.0938 7.29141 12.0938 9C12.0938 10.7086 10.7086 12.0938 9 12.0938C7.29141 12.0938 5.90625 10.7086 5.90625 9Z" fill="white"/>
                </g>
                <defs>
                  <clipPath id="clip0_115_3952">
                    <path d="M0 0H18V18H0V0Z" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              Install Chrome Extension
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('videos')}>
              Browse Videos
            </button>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Simple steps to contribute and discover quality captions</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="step-title">Install Extension</h3>
            <p className="step-description">Download our Chrome extension to start rating video captions.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="step-title">Rate Captions</h3>
            <p className="step-description">Watch videos and rate caption quality, accuracy, and timing.</p>
          </div>
          <div className="step-card">
            <div className="step-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21L16.65 16.65" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="step-title">Discover Best</h3>
            <p className="step-description">Find and watch videos with the highest caption ratings.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;


