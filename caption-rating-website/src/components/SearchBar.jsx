import React from 'react';
import './SearchBar.css';

const SearchBar = () => {
  return (
    <div className="search-container">
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search videos..." 
          className="search-input"
        />
        <button className="search-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
