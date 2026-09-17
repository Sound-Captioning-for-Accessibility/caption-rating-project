import React, { useState } from 'react';
import RGTProgressBar from './RGTProgressBar';
import RGTRatingScale from './RGTRatingScale';
import RGTVideoPlayer from './RGTVideoPlayer';

const RGTConstructRating = ({
  videos,
  alikePhrase,
  contrastPhrase,
  clipNotes,
  onSaveRatings,
  onComplete,
  isRemainingClips = false,
}) => {
  const [subStep, setSubStep] = useState('intro');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [ratings, setRatings] = useState({});
  const [currentRating, setCurrentRating] = useState(null);

  const handleContinueIntro = () => {
    setSubStep('rate');
  };

  const handleRate = (value) => {
    setCurrentRating(value);
  };

  const handleNextClip = () => {
    if (currentRating === null) return;

    const video = videos[currentVideoIndex];
    const newRatings = { ...ratings, [video.id]: currentRating };
    setRatings(newRatings);

    onSaveRatings([{ video_id: video.id, rating: currentRating }]);

    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setCurrentRating(null);
    } else {
      onComplete();
    }
  };

  const isLastClip = currentVideoIndex === videos.length - 1;

  if (subStep === 'intro') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="rounds" />
        <div className="rgt-content">
          <div className="rgt-text-block">
            {isRemainingClips ? (
              <>
                <p>
                  You will now rate the remaining clips on the same construct using the same 1 to 7 scale.
                </p>
                <p>
                  You may take notes on the non-speech information (NSI) captions while
                  reviewing the clips if that helps with future rating rounds.
                </p>
              </>
            ) : (
              <>
                <p>Your responses have been saved.</p>
                <p>
                  You will now rate the clips you just reviewed on the construct you identified.
                  Here, a construct refers to the pair of contrasting words or phrases you just
                  used to describe an important difference between the clips.
                </p>
                <p>
                  Please rate each clip on a scale from 1 to 7 based on how closely it matches
                  each end of the construct.
                </p>
              </>
            )}
          </div>
          <div className="rgt-construct-display">
            <span className="rgt-construct-pole">{alikePhrase}</span>
            <span className="rgt-construct-separator">—</span>
            <span className="rgt-construct-pole">{contrastPhrase}</span>
          </div>
          <button className="rgt-btn rgt-btn-primary" onClick={handleContinueIntro}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];
  const videoNotes = clipNotes?.[currentVideo?.id] || '';

  return (
    <div className="rgt-page">
      <RGTProgressBar currentStep="rounds" />
      <div className="rgt-content">
        <h2 className="rgt-clip-title">Clip {currentVideoIndex + 1}</h2>
        <div className="rgt-clip-view-layout">
          <div className="rgt-clip-view-video">
            <RGTVideoPlayer video={currentVideo} />
          </div>
          <div className="rgt-clip-view-notes">
            <div className="rgt-notes-header">
              <span>NSI Caption Notes</span>
            </div>
            <div className="rgt-notes-readonly">
              {videoNotes || <span className="rgt-notes-placeholder">Add any notes or observations here...</span>}
            </div>
          </div>
        </div>

        <p className="rgt-reminder">
          Remember: You are rating this clip based on its non-speech information (NSI) captions.
        </p>
        <p className="rgt-question">
          Please rate the above clip based on which end of the construct it is nearest to.
        </p>

        <RGTRatingScale
          min={1}
          max={7}
          value={currentRating}
          onChange={handleRate}
          leftLabel={alikePhrase}
          rightLabel={contrastPhrase}
        />

        {currentRating === null && (
          <p className="rgt-validation-msg">Please rate the clip before continuing.</p>
        )}

        <button
          className="rgt-btn rgt-btn-primary"
          onClick={handleNextClip}
          disabled={currentRating === null}
        >
          {isLastClip ? 'Continue to Next Round' : 'Next Clip'}
        </button>
      </div>
    </div>
  );
};

export default RGTConstructRating;
