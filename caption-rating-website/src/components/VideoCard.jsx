import React from 'react';
import './VideoCard.css';

const VideoCard = ({ title, category }) => {
  return (
    <div className="video-card">
      <div className="video-thumbnail">
        Video Thumbnail
      </div>
      <div className="video-info">
        <h3 className="video-title">{title}</h3>
        <p className="video-category">{category}</p>
      </div>
    </div>
  );
};

export default VideoCard;
