import React, { useState } from 'react';
import RGTProgressBar from './RGTProgressBar';
import RGTRatingScale from './RGTRatingScale';
import RGTVideoPlayer from './RGTVideoPlayer';

const SUB_STEPS = ['intro', 'examples', 'clips', 'rate_clip'];

const RGTWarmUp = ({ videos, onComplete, onSaveRating }) => {
  const [subStep, setSubStep] = useState('intro');
  const [ratings, setRatings] = useState({});
  const [viewedClips, setViewedClips] = useState({});
  const [activeClipIndex, setActiveClipIndex] = useState(null);
  const [currentRating, setCurrentRating] = useState(null);

  const warmUpVideos = videos.slice(0, 3);

  const handleContinueIntro = () => setSubStep('examples');
  const handleContinueExamples = () => setSubStep('clips');

  const handleOpenClip = (index) => {
    setActiveClipIndex(index);
    setCurrentRating(ratings[index] || null);
    setSubStep('rate_clip');
  };

  const handleRateClip = (rating) => {
    setCurrentRating(rating);
  };

  const handleSaveClipRating = () => {
    if (currentRating === null) return;
    const video = warmUpVideos[activeClipIndex];
    setRatings({ ...ratings, [activeClipIndex]: currentRating });
    setViewedClips({ ...viewedClips, [activeClipIndex]: true });
    if (video) {
      onSaveRating(video.id, currentRating);
    }
    setSubStep('clips');
    setActiveClipIndex(null);
    setCurrentRating(null);
  };

  const handleBackToClips = () => {
    setSubStep('clips');
    setActiveClipIndex(null);
    setCurrentRating(null);
  };

  const allRated = warmUpVideos.length > 0 && warmUpVideos.every((_, i) => ratings[i] != null);

  const handleFinish = () => {
    onComplete();
  };

  const getClipStatus = (index) => {
    if (ratings[index] != null) return 'Rated';
    if (viewedClips[index]) return 'Viewed';
    return 'Not yet viewed';
  };

  if (subStep === 'intro') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="rating" />
        <div className="rgt-content">
          <h1 className="rgt-title">Clip Review and Rating</h1>
          <div className="rgt-text-block">
            <p>
              In this first part, you will be asked to review three video clips and rate each one on its
              overall non-speech information (NSI) caption quality using a scale from 1 to 5.
            </p>
            <p>
              There are no right or wrong answers. We are interested in your own impressions of the NSI captions.
            </p>
            <p>
              Please focus on the relationship between the non-speech information (NSI) captions, and, if you
              have access to audio, the meaningful sounds in the clip, rather than on the clip as a whole. In this
              study, NSI captions refer to captioned information about meaningful sounds or audio details other
              than spoken dialogue, such as music, sound effects, and environmental sounds that contribute to
              meaning. You will see examples of these on the next page.
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

  if (subStep === 'examples') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="rating" />
        <div className="rgt-content rgt-content-center">
          <h1 className="rgt-title">Examples of NSI Captions</h1>
          <p className="rgt-subtitle">
            Please review these examples of non-speech information (NSI) captions before continuing.
          </p>
          <div className="rgt-examples-grid">
            {['TITLE', 'TITLE', 'TITLE'].map((title, i) => (
              <div key={i} className="rgt-example-card">
                <div className="rgt-example-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="rgt-example-title">{title}</div>
              </div>
            ))}
          </div>
          <p className="rgt-note">
            <strong>Note:</strong> Non-speech information (NSI) captions refer to music (for example, "<em>[Rock music]</em>"),
            sound effect and environmental sounds (for example, "<em>[Birds chirping]</em>" or "<em>[Heavy thunderstorm]</em>") and
            extra information about dialogue (for example, "<em>whispering,</em>" "<em>from the other room,</em>" or "<em>Sarah:</em>")
          </p>
          <p className="rgt-continue-text">
            Press <strong>Continue</strong> when you are ready to begin.
          </p>
          <button className="rgt-btn rgt-btn-primary" onClick={handleContinueExamples}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (subStep === 'rate_clip' && activeClipIndex !== null) {
    const video = warmUpVideos[activeClipIndex];
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="rating" />
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
          {currentRating === null && (
            <p className="rgt-validation-msg">Please rate the clip before continuing.</p>
          )}
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

  // Clips overview
  return (
    <div className="rgt-page">
      <RGTProgressBar currentStep="rating" />
      <div className="rgt-content">
        <h2 className="rgt-section-title">Rate Clips</h2>
        <p className="rgt-instructions">
          Instructions: Please review each clip below in its entirety and rate the overall quality of the
          non-speech information (NSI) captions on a scale from 1 to 5. There are no right or wrong answers.
        </p>
        <div className="rgt-clips-grid">
          {warmUpVideos.map((video, index) => (
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
              <div className={`rgt-clip-card-status ${ratings[index] != null ? 'rated' : ''}`}>
                {getClipStatus(index)}
              </div>
            </div>
          ))}
        </div>
        {!allRated && (
          <p className="rgt-validation-msg">Please fully review all three clips before continuing.</p>
        )}
        <button
          className="rgt-btn rgt-btn-primary"
          onClick={handleFinish}
          disabled={!allRated}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RGTWarmUp;
