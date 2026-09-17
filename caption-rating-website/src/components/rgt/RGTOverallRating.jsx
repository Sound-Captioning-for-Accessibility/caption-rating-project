import React, { useState } from 'react';
import RGTProgressBar from './RGTProgressBar';
import RGTRatingScale from './RGTRatingScale';
import RGTVideoPlayer from './RGTVideoPlayer';

const RGTOverallRating = ({ videos, existingRatings, onSaveRating, onComplete }) => {
  const [subStep, setSubStep] = useState('intro');
  const [ratings, setRatings] = useState(existingRatings || {});
  const [activeClipIndex, setActiveClipIndex] = useState(null);
  const [currentRating, setCurrentRating] = useState(null);

  const handleContinueIntro = () => setSubStep('clips');

  const handleOpenClip = (index) => {
    setActiveClipIndex(index);
    setCurrentRating(ratings[videos[index]?.id] || null);
    setSubStep('rate_clip');
  };

  const handleRateClip = (rating) => {
    setCurrentRating(rating);
  };

  const handleSaveClipRating = () => {
    if (currentRating === null) return;
    const video = videos[activeClipIndex];
    setRatings({ ...ratings, [video.id]: currentRating });
    onSaveRating(video.id, currentRating);
    setSubStep('clips');
    setActiveClipIndex(null);
    setCurrentRating(null);
  };

  const handleBackToClips = () => {
    setSubStep('clips');
    setActiveClipIndex(null);
    setCurrentRating(null);
  };

  const allRated = videos.length > 0 && videos.every(v => ratings[v.id] != null);

  const getClipStatus = (video) => {
    if (ratings[video.id] != null) return 'Rated';
    return 'Previously Viewed';
  };

  if (subStep === 'intro') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="review" />
        <div className="rgt-content">
          <h1 className="rgt-title">Overall NSI Caption Ratings</h1>
          <div className="rgt-text-block">
            <p>
              In this section, you will be asked to review and rate each video clip on its overall non-speech
              information (NSI) caption quality using a scale from 1 to 5.
            </p>
            <p>
              There are no right or wrong answers. We are interested in your own impressions of the NSI captions.
            </p>
            <p>
              Please focus on the relationship between the non-speech information (NSI) captions, and, if you
              have access to audio, the meaningful sounds in the clip, rather than on the clip as a whole. In this
              study, NSI captions refer to captioned information about meaningful sounds or audio details other
              than spoken dialogue, such as music, sound effects, and environmental sounds that contribute to meaning.
            </p>
            <p>
              When rating overall NSI caption quality, please consider how well the captions communicate
              important non-speech sound information in the clip, including whether meaningful sound information
              seems clearly represented, underrepresented, or missing.
            </p>
          </div>
          <button className="rgt-btn rgt-btn-primary" onClick={handleContinueIntro}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (subStep === 'rate_clip' && activeClipIndex !== null) {
    const video = videos[activeClipIndex];
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="review" />
        <div className="rgt-content">
          <button className="rgt-btn rgt-btn-back" onClick={handleBackToClips}>
            ← Back
          </button>
          <h2 className="rgt-clip-title">Clip {activeClipIndex + 1}</h2>
          <RGTVideoPlayer video={video} />
          <p className="rgt-reminder">
            Remember: You are rating this clip based on its non-speech information (NSI) captions.
          </p>
          <p className="rgt-question">
            Overall, the quality of the NSI captions in this video clip are:
          </p>
          <RGTRatingScale
            min={1}
            max={5}
            value={currentRating}
            onChange={handleRateClip}
            leftLabel="Very bad"
            rightLabel="Very good"
          />
          <button
            className="rgt-btn rgt-btn-primary"
            onClick={handleSaveClipRating}
            disabled={currentRating === null}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Clips grid overview
  return (
    <div className="rgt-page">
      <RGTProgressBar currentStep="review" />
      <div className="rgt-content">
        <h2 className="rgt-section-title">Rate Clips</h2>
        <p className="rgt-instructions">
          Instructions: Please review each clip below in its entirety and rate the overall quality of the
          non-speech information (NSI) captions.
        </p>

        <div className="rgt-clips-grid rgt-clips-grid-large">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="rgt-clip-card"
              onClick={() => handleOpenClip(index)}
            >
              <div className="rgt-clip-card-preview">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div className="rgt-clip-card-label">Clip {index + 1}</div>
              <div className={`rgt-clip-card-status ${ratings[video.id] != null ? 'rated' : ''}`}>
                {getClipStatus(video)}
              </div>
            </div>
          ))}
        </div>

        {!allRated && (
          <p className="rgt-validation-msg">Please review all remaining clips before continuing.</p>
        )}

        <button
          className="rgt-btn rgt-btn-primary"
          onClick={onComplete}
          disabled={!allRated}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RGTOverallRating;
