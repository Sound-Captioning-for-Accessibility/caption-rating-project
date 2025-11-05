import React from 'react';
import VideoCard from './VideoCard';
import './VideoSection.css';

const VideoSection = ({ title, videos }) => {
  return (
    <section className="video-section">
      <h2 className="section-title">{title}</h2>
      <div className="video-grid">
        {videos.map((video, index) => (
          <VideoCard 
            key={index}
            title={video.title}
            category={video.category}
          />
        ))}
      </div>
    </section>
  );
};

export default VideoSection;
