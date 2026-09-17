import React from 'react';

const RGTVideoPlayer = ({ video, onEnded }) => {
  return (
    <div className="rgt-video-player">
      <div className="rgt-video-placeholder">
        <div className="rgt-video-placeholder-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <p className="rgt-video-title">{video?.title || 'Video'}</p>
        </div>
      </div>
    </div>
  );
};

export default RGTVideoPlayer;
