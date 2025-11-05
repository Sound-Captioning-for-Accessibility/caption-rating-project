import React, { useState, useEffect } from 'react';
import { videoApi } from '../services/api';
import './VideosPage.css';

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [displayedVideoCount, setDisplayedVideoCount] = useState(6);
  const [sortBy, setSortBy] = useState('highest-rated');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ["All", "Gaming", "Music", "Podcasts", "Sports", "News", "Live", "Courses", "Shopping", "Fashion", "Beauty", "Food"];

  useEffect(() => {
    fetchVideos();
    // Refresh every 30 seconds to get new videos from extension
    const interval = setInterval(fetchVideos, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await videoApi.getAll();
      setVideos(data);
      setError('');
    } catch (err) {
      setError('Failed to load videos. Please try again.');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayedVideoCount(prev => prev + 6);
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const sortVideos = (videos, sortType) => {
    const sortedVideos = [...videos];
    
    switch (sortType) {
      case 'highest-rated':
        return sortedVideos.sort((a, b) => (b.captionLikes || 0) - (a.captionLikes || 0));
      case 'most-recent':
        return sortedVideos.sort((a, b) => {
          const dateA = new Date(a.created || 0);
          const dateB = new Date(b.created || 0);
          return dateB - dateA;
        });
      case 'most-views':
        return sortedVideos.sort((a, b) => (b.views || 0) - (a.views || 0));
      default:
        return sortedVideos;
    }
  };

  const filterVideos = () => {
    let filtered = videos;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(video => 
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.channel?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const sortedVideos = sortVideos(filterVideos(), sortBy);
  const displayedVideos = sortedVideos.slice(0, displayedVideoCount);

  if (loading) {
    return (
      <div className="videos-page">
        <div className="loading-container">
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="videos-page">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchVideos} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="videos-page">
      <div className="videos-header">
        <h1 className="videos-title">Video Recommendations</h1>
        <p className="videos-subtitle">Discover videos ranked by community caption ratings from our Chrome extension</p>
      </div>

      <div className="search-sort-container">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search videos..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="sort-options">
          <span className="sort-label">Sort by:</span>
          <button 
            className={`sort-button ${sortBy === 'highest-rated' ? 'active' : ''}`}
            onClick={() => handleSortChange('highest-rated')}
          >
            Highest Rated
          </button>
          <button 
            className={`sort-button ${sortBy === 'most-recent' ? 'active' : ''}`}
            onClick={() => handleSortChange('most-recent')}
          >
            Most Recent
          </button>
          <button 
            className={`sort-button ${sortBy === 'most-views' ? 'active' : ''}`}
            onClick={() => handleSortChange('most-views')}
          >
            Most Views
          </button>
        </div>
      </div>

      {displayedVideos.length === 0 ? (
        <div className="no-videos">
          <h2>No videos found</h2>
          <p>Install our Chrome extension and rate videos on YouTube to see them here!</p>
          <a 
            href="https://github.com/yourusername/caption-rating-extension2" 
            target="_blank" 
            rel="noopener noreferrer"
            className="extension-link"
          >
            Get the Extension
          </a>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {displayedVideos.map((video) => (
              <a 
                key={video.videoID}
                href={`https://www.youtube.com/watch?v=${video.videoID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="video-card-link"
              >
                <div className="video-card">
                  <div className="video-thumbnail">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} />
                    ) : (
                      <div className="thumbnail-placeholder">Video Thumbnail</div>
                    )}
                    <div className="video-duration">{formatDuration(video.duration)}</div>
                  </div>
                  <div className="video-rating">
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const rating = video.averageRating || 0;
                        const diff = rating - star + 1;
                        
                        let starClass = 'empty';
                        let starSymbol = '☆';
                        
                        if (diff >= 1) {
                          starClass = 'filled';
                          starSymbol = '★';
                        } else if (diff >= 0.5) {
                          starClass = 'half';
                          starSymbol = '★';
                        }
                        
                        return (
                          <span key={star} className={starClass}>
                            {starSymbol}
                          </span>
                        );
                      })}
                    </div>
                    <span className="rating-number">{(video.averageRating || 0).toFixed(1)}</span>
                    <span className="rating-count">({video.ratingCount || 0})</span>
                  </div>
                  <div className="video-info">
                    <h3 className="video-title">{video.title}</h3>
                    <p className="video-channel">{video.channel}</p>
                    <div className="video-stats">
                      <span>{formatViews(video.views)} views</span>
                      <span>{formatViews(video.likes)} likes</span>
                      <span>{formatDate(video.created)}</span>
                    </div>
                    <div className="caption-rating">
                      <span>Caption Likes: {video.captionLikes || 0}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {displayedVideoCount < sortedVideos.length && (
            <div className="load-more-container">
              <button className="load-more-button" onClick={handleLoadMore}>
                Load More Videos
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideosPage;
