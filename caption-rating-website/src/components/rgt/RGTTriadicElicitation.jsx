import React, { useState, useEffect, useCallback } from 'react';
import RGTProgressBar from './RGTProgressBar';
import RGTVideoPlayer from './RGTVideoPlayer';

const RGTTriadicElicitation = ({
  roundNumber,
  totalRounds,
  triad,
  roundAssignmentId,
  onSaveNotes,
  onMarkReviewed,
  onSaveComparison,
  onSaveAnswers,
  onContinueToRating,
  onRequestNewTriad,
  clipNotes,
  clipReviews,
}) => {
  const [subStep, setSubStep] = useState('intro');
  const [activeClipIndex, setActiveClipIndex] = useState(null);
  const [notes, setNotes] = useState({});
  const [reviewed, setReviewed] = useState({});
  const [selectedPair, setSelectedPair] = useState(null);
  const [commonality, setCommonality] = useState('');
  const [alikePhrase, setAlikePhrase] = useState('');
  const [contrastPhrase, setContrastPhrase] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [saveStatus, setSaveStatus] = useState({});

  const videos = triad?.videos || [];

  useEffect(() => {
    if (clipNotes) {
      const notesMap = {};
      Object.entries(clipNotes).forEach(([videoId, text]) => {
        const idx = videos.findIndex(v => v.id === parseInt(videoId));
        if (idx !== -1) notesMap[idx] = text;
      });
      setNotes(notesMap);
    }
    if (clipReviews) {
      const reviewMap = {};
      clipReviews.forEach(videoId => {
        const idx = videos.findIndex(v => v.id === videoId);
        if (idx !== -1) reviewMap[idx] = true;
      });
      setReviewed(reviewMap);
    }
  }, [clipNotes, clipReviews, videos.length]);

  const handleContinueIntro = () => setSubStep('example');
  const handleContinueExample = () => setSubStep('clips');

  const handleOpenClip = (index) => {
    setActiveClipIndex(index);
    setSubStep('view_clip');
  };

  const handleNotesChange = useCallback((text) => {
    setNotes(prev => ({ ...prev, [activeClipIndex]: text }));
    setSaveStatus(prev => ({ ...prev, [activeClipIndex]: 'saving' }));

    const video = videos[activeClipIndex];
    if (video) {
      onSaveNotes(video.id, text).then(() => {
        setSaveStatus(prev => ({ ...prev, [activeClipIndex]: 'saved' }));
      });
    }
  }, [activeClipIndex, videos, onSaveNotes]);

  const handleBackFromClip = () => {
    const video = videos[activeClipIndex];
    if (video && !reviewed[activeClipIndex]) {
      onMarkReviewed(video.id);
      setReviewed(prev => ({ ...prev, [activeClipIndex]: true }));
    }
    setSubStep('clips');
    setActiveClipIndex(null);
  };

  const allReviewed = videos.length > 0 && videos.every((_, i) => reviewed[i]);

  const handleContinueToQuestions = () => {
    setSubStep('comparison');
  };

  const handlePairSelect = (pair) => {
    setSelectedPair(pair);
    const video1Id = videos[pair[0]]?.id;
    const video2Id = videos[pair[1]]?.id;
    if (video1Id && video2Id) {
      onSaveComparison(video1Id, video2Id);
    }
  };

  const handleContinueToRating = () => {
    const answers = [
      { question_key: 'commonality', answer_text: commonality },
      { question_key: 'alike_phrase', answer_text: alikePhrase },
      { question_key: 'contrast_phrase', answer_text: contrastPhrase },
    ];
    onSaveAnswers(answers);
    onContinueToRating(alikePhrase, contrastPhrase);
  };

  const comparisonComplete = selectedPair && commonality.trim() && alikePhrase.trim() && contrastPhrase.trim();

  const getClipStatus = (index) => {
    if (reviewed[index]) return 'Viewed this round';
    return 'Not yet viewed';
  };

  if (subStep === 'intro') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="rounds" />
        <div className="rgt-content">
          <h1 className="rgt-title">Triadic Elicitation</h1>
          <div className="rgt-text-block">
            <p>In this part of the study, you will be shown three clips at a time.</p>
            <p>
              For each set of three clips, please review each clip carefully and use the notes panel to
              record anything you notice about the non-speech information (NSI) captions. You will then
              answer comparison questions and rate the clips on the construct you identified.
            </p>
            <p>
              Please focus on the relationship between the non-speech information (NSI) captions, and,
              if you have access to audio, the meaningful sounds in the clip, rather than on the clip as a whole.
            </p>
            <p>
              There are no right or wrong answers. We are interested in how you understand the clips and
              their NSI captions.
            </p>
          </div>
          <button className="rgt-btn rgt-btn-primary" onClick={handleContinueIntro}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (subStep === 'example') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="rounds" />
        <div className="rgt-content">
          <h1 className="rgt-title">Triadic Elicitation Example</h1>
          <p className="rgt-subtitle">Please review the following video before continuing.</p>
          <div className="rgt-video-player">
            <div className="rgt-video-placeholder">
              <div className="rgt-video-placeholder-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <p className="rgt-video-title">Example Video</p>
              </div>
            </div>
          </div>
          <button className="rgt-btn rgt-btn-primary" onClick={handleContinueExample}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (subStep === 'view_clip' && activeClipIndex !== null) {
    const video = videos[activeClipIndex];
    const previouslyViewed = clipReviews?.includes(video?.id);
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="rounds" />
        <div className="rgt-content">
          <button className="rgt-btn rgt-btn-back" onClick={handleBackFromClip}>
            ← Back
          </button>
          <h2 className="rgt-clip-title">Clip {activeClipIndex + 1}</h2>
          <div className="rgt-clip-view-layout">
            <div className="rgt-clip-view-video">
              <p className="rgt-clip-instructions">
                Watch the clip below and use the notes panel to record anything you notice about the
                non-speech information (NSI) captions. Taking notes while you watch may make the next step easier.
              </p>
              <RGTVideoPlayer video={video} />
              {previouslyViewed && (
                <p className="rgt-info-msg">
                  You reviewed this clip earlier. You may watch it again or continue using your earlier notes.
                </p>
              )}
            </div>
            <div className="rgt-clip-view-notes">
              <div className="rgt-notes-header">
                <span>NSI Caption Notes</span>
                <span className="rgt-notes-save-status">
                  {saveStatus[activeClipIndex] === 'saved' ? 'All changes saved' : 'Changes will be saved automatically'}
                </span>
              </div>
              <textarea
                className="rgt-notes-textarea"
                placeholder="Add any notes or observations here..."
                value={notes[activeClipIndex] || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
              />
              <p className="rgt-note">
                <strong>Note:</strong> Non-speech information captions describe meaningful sounds or audio cues other
                than spoken words. Examples might include sounds like [laughter], [door creaks], or [dramatic music].
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subStep === 'comparison') {
    return (
      <div className="rgt-page">
        <RGTProgressBar currentStep="rounds" />
        <div className="rgt-content">
          <button className="rgt-btn rgt-btn-back" onClick={() => setSubStep('clips')}>
            ← Back
          </button>
          <h2 className="rgt-section-title">Comparison Questions</h2>
          <p className="rgt-instructions">
            Please answer the questions below about the NSI captions in the clips you reviewed this round.
            You may rewatch any clip or view your notes while answering.
          </p>

          <div className="rgt-comparison-clips-row">
            {videos.map((video, index) => (
              <div key={video.id} className="rgt-comparison-clip-ref">
                <span>Clip {index + 1}</span>
                <button
                  className="rgt-btn rgt-btn-small"
                  onClick={() => handleOpenClip(index)}
                >
                  Rewatch
                </button>
                <button
                  className="rgt-btn rgt-btn-small"
                  onClick={() => { setActiveClipIndex(index); setSubStep('view_clip'); }}
                >
                  {notes[index] ? 'View Notes' : 'No Notes'}
                </button>
              </div>
            ))}
          </div>

          <div className="rgt-comparison-questions">
            <div className="rgt-question-group">
              <label className="rgt-question-label">
                Which two of these clips are the same in some way, and different from the third?
              </label>
              <div className="rgt-pair-options">
                <button
                  className={`rgt-pair-btn ${selectedPair && selectedPair[0] === 0 && selectedPair[1] === 1 ? 'selected' : ''}`}
                  onClick={() => handlePairSelect([0, 1])}
                >
                  Clip A + Clip B
                </button>
                <button
                  className={`rgt-pair-btn ${selectedPair && selectedPair[0] === 0 && selectedPair[1] === 2 ? 'selected' : ''}`}
                  onClick={() => handlePairSelect([0, 2])}
                >
                  Clip A + Clip C
                </button>
                <button
                  className={`rgt-pair-btn ${selectedPair && selectedPair[0] === 1 && selectedPair[1] === 2 ? 'selected' : ''}`}
                  onClick={() => handlePairSelect([1, 2])}
                >
                  Clip B + Clip C
                </button>
              </div>
            </div>

            <div className="rgt-question-group">
              <label className="rgt-question-label">
                Thinking about the NSI captions — what do these two clips have in common, as opposed to the third?
              </label>
              <textarea
                className="rgt-input-textarea"
                placeholder="Describe what stands out to you about the NSI captions in these clips..."
                value={commonality}
                onChange={(e) => setCommonality(e.target.value)}
              />
            </div>

            <div className="rgt-question-group">
              <label className="rgt-question-label">
                What word or short phrase describes the way these two clips are alike?
              </label>
              <input
                type="text"
                className="rgt-input-text"
                placeholder="Enter a word or short phrase..."
                value={alikePhrase}
                onChange={(e) => setAlikePhrase(e.target.value)}
              />
            </div>

            <div className="rgt-question-group">
              <label className="rgt-question-label">
                What word or short phrase describes the contrasting end of this construct?*
              </label>
              <input
                type="text"
                className="rgt-input-text"
                placeholder="Enter a word or short phrase..."
                value={contrastPhrase}
                onChange={(e) => setContrastPhrase(e.target.value)}
              />
              <p className="rgt-note">
                * Note: The third clip does not need to be a perfect match for this end of the construct.
                You are identifying the contrast, and you will rate the clips on that scale in the next step.
                Please focus your responses on the non-speech information (NSI) captions.
              </p>
            </div>

            <div className="rgt-comparison-actions">
              <button
                className="rgt-btn rgt-btn-link"
                onClick={() => setShowHelp(!showHelp)}
              >
                Feeling stuck?
              </button>
              <button
                className="rgt-btn rgt-btn-primary"
                onClick={handleContinueToRating}
                disabled={!comparisonComplete}
              >
                Continue to Rating
              </button>
            </div>

            {showHelp && (
              <div className="rgt-help-popup">
                <h3>Feeling Stuck?</h3>
                <p>
                  That's okay. There are no right or wrong answers in this task. We are interested
                  in how you understand the non-speech information (NSI) captions.
                </p>
                <p>Here are a few things that may help:</p>
                <ul>
                  <li>Focus only on the NSI captions, not the clip as a whole.</li>
                  <li>Think about anything non-speech related, such as background sounds, sound effects, music, or other meaningful audio details.</li>
                  <li>Ask yourself what two clips have in common and how they differ from the third.</li>
                  <li>A word or short phrase is enough. Your answer does not need to be perfect.</li>
                  <li>You may rewatch the clips or review your notes before answering.</li>
                  <li>If you need a pause, you may take a short break and return when ready.</li>
                </ul>
                <p>If this comparison still does not feel workable, you can move on to a different set of clips.</p>
                <button
                  className="rgt-btn rgt-btn-secondary"
                  onClick={onRequestNewTriad}
                >
                  Show me a different triad
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Clips overview (main step)
  return (
    <div className="rgt-page">
      <RGTProgressBar currentStep="rounds" />
      <div className="rgt-content">
        <h2 className="rgt-section-title">Round {roundNumber} of {totalRounds}</h2>
        <p className="rgt-instructions">
          Instructions: Please review each clip below in its entirety. Use the notes panel to record anything
          you notice about the non-speech information (NSI) captions. Taking notes while you watch may make
          the next step easier.
        </p>
        <p className="rgt-instructions-sub">
          In the next step, you will compare the clips and describe how two are alike and different from the third in your own words.
        </p>

        <div className="rgt-clips-grid">
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
              <div className={`rgt-clip-card-status ${reviewed[index] ? 'viewed' : ''}`}>
                {getClipStatus(index)}
              </div>
            </div>
          ))}
        </div>

        <p className="rgt-note">
          Note: The same clips may appear in multiple rounds. If you have already reviewed a clip,
          you may reopen it if you would like a refresher or to edit your notes.
        </p>

        {!allReviewed && (
          <p className="rgt-validation-msg">Please fully review all three clips before continuing.</p>
        )}

        <button
          className="rgt-btn rgt-btn-primary"
          onClick={handleContinueToQuestions}
          disabled={!allReviewed}
        >
          Continue to Questions
        </button>
      </div>
    </div>
  );
};

export default RGTTriadicElicitation;
