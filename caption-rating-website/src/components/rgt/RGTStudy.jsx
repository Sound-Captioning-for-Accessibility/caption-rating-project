import React, { useState, useEffect, useCallback } from 'react';
import { rgtApi } from '../../services/rgtApi';
import RGTProgressBar from './RGTProgressBar';
import RGTWarmUp from './RGTWarmUp';
import RGTTriadicElicitation from './RGTTriadicElicitation';
import RGTConstructRating from './RGTConstructRating';
import RGTCatchAll from './RGTCatchAll';
import RGTOverallRating from './RGTOverallRating';
import RGTComplete from './RGTComplete';
import './RGTStudy.css';

const SESSION_KEY = 'rgt-session';
const TOKEN_KEY = 'rgt-participant-token';

function generateToken() {
  return 'rgt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

const RGTStudy = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [videos, setVideos] = useState([]);

  // Triadic round state
  const [currentRound, setCurrentRound] = useState(null);
  const [clipNotes, setClipNotes] = useState({});
  const [clipReviews, setClipReviews] = useState([]);
  const [constructs, setConstructs] = useState([]);

  // Sub-phase within triadic_elicitation
  const [triadicSubPhase, setTriadicSubPhase] = useState('elicitation');
  const [currentConstruct, setCurrentConstruct] = useState({ alikePhrase: '', contrastPhrase: '' });

  // Round transition state
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const [showSectionComplete, setShowSectionComplete] = useState(false);

  useEffect(() => {
    initSession();
  }, []);

  // Ensure round is loaded when entering triadic phase
  useEffect(() => {
    if (session?.current_phase === 'triadic_elicitation' && !currentRound && !loading) {
      loadCurrentRound(session.id);
    }
  }, [session?.current_phase, currentRound, loading]);

  const initSession = async () => {
    try {
      setLoading(true);
      let token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        token = generateToken();
        localStorage.setItem(TOKEN_KEY, token);
      }

      const sessionData = await rgtApi.startSession(token, 7);
      setSession(sessionData);

      // Fetch all active videos from the backend
      try {
        const allVideos = await rgtApi.getVideos();
        const activeVideos = allVideos.filter(v => v.is_active);
        setVideos(activeVideos);
      } catch (err) {
        console.error('Failed to fetch videos:', err);
      }

      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.constructs) setConstructs(parsed.constructs);
      }

      if (sessionData.current_phase === 'triadic_elicitation') {
        await loadCurrentRound(sessionData.id);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadCurrentRound = async (sessionId) => {
    let round = null;
    try {
      round = await rgtApi.getCurrentRound(sessionId);
    } catch {
      // No current round - assign a new one
      try {
        round = await rgtApi.assignRound(sessionId);
      } catch (err) {
        if (!err.message.includes('No available triads')) {
          console.error('Failed to assign round:', err);
        }
      }
    }
    if (round) {
      setCurrentRound(round);
      await loadClipData(round);
    }
  };

  const loadClipData = async (round) => {
    const triadVideos = round?.triad?.videos || [];
    const notesMap = {};

    for (const video of triadVideos) {
      try {
        const noteData = await rgtApi.getClipNotes(round.id, video.id);
        if (noteData.note_text) {
          notesMap[video.id] = noteData.note_text;
        }
      } catch {}
    }

    setClipNotes(notesMap);
    setClipReviews([]);
  };

  const saveState = useCallback((updates = {}) => {
    const state = {
      constructs,
      videos,
      ...updates,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [constructs, videos]);

  // Phase: overall_ratings (Warm Up)
  const handleWarmUpRating = async (videoId, rating) => {
    if (!session) return;
    try {
      await rgtApi.saveOverallRatings(session.id, [{ video_id: videoId, rating }]);
    } catch (err) {
      console.error('Failed to save warm-up rating:', err);
    }
  };

  const handleWarmUpComplete = async () => {
    if (!session) return;
    try {
      const updated = await rgtApi.advancePhase(session.id);
      setSession(updated);
      await loadCurrentRound(updated.id);
      setTriadicSubPhase('elicitation');
    } catch (err) {
      setError(err.message);
    }
  };

  // Phase: triadic_elicitation
  const handleSaveNotes = async (videoId, text) => {
    if (!currentRound) return;
    await rgtApi.saveClipNotes(currentRound.id, videoId, text);
    setClipNotes(prev => ({ ...prev, [videoId]: text }));
  };

  const handleMarkReviewed = async (videoId) => {
    if (!currentRound) return;
    await rgtApi.markClipReviewed(currentRound.id, videoId);
    setClipReviews(prev => [...prev, videoId]);
  };

  const handleSaveComparison = async (videoOneId, videoTwoId) => {
    if (!currentRound) return;
    await rgtApi.saveComparison(currentRound.id, videoOneId, videoTwoId);
  };

  const handleSaveAnswers = async (answers) => {
    if (!currentRound) return;
    await rgtApi.saveAnswers(currentRound.id, answers);
  };

  const handleContinueToRating = (alikePhrase, contrastPhrase) => {
    setCurrentConstruct({ alikePhrase, contrastPhrase });
    setTriadicSubPhase('construct_rating');
  };

  const handleRequestNewTriad = async () => {
    if (!session) return;
    try {
      const newRound = await rgtApi.assignRound(session.id);
      setCurrentRound(newRound);
      setClipNotes({});
      setClipReviews([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConstructRatingSave = async (ratings) => {
    if (!currentRound) return;
    await rgtApi.saveConstructRatings(currentRound.id, ratings);
  };

  const handleConstructRatingComplete = async () => {
    if (!currentRound || !session) return;

    const newConstruct = {
      alikePhrase: currentConstruct.alikePhrase,
      contrastPhrase: currentConstruct.contrastPhrase,
      roundNumber: currentRound.round_number,
    };
    const updatedConstructs = [...constructs, newConstruct];
    setConstructs(updatedConstructs);
    saveState({ constructs: updatedConstructs });

    try {
      await rgtApi.completeRound(currentRound.id);
    } catch (err) {
      console.error('Failed to complete round:', err);
    }

    // Check if we need more rounds
    if (currentRound.round_number < session.total_rounds) {
      setShowRoundComplete(true);
    } else {
      setShowSectionComplete(true);
    }
  };

  const handleNextRound = async () => {
    setShowRoundComplete(false);
    setTriadicSubPhase('elicitation');
    setClipNotes({});
    setClipReviews([]);
    setCurrentConstruct({ alikePhrase: '', contrastPhrase: '' });

    try {
      const newRound = await rgtApi.assignRound(session.id);
      setCurrentRound(newRound);
    } catch (err) {
      setShowSectionComplete(true);
    }
  };

  const handleTriadicComplete = async () => {
    setShowSectionComplete(false);
    try {
      const updated = await rgtApi.advancePhase(session.id);
      setSession(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  // Phase: review_ratings (Overall quality)
  const handleOverallRating = async (videoId, rating) => {
    if (!session) return;
    await rgtApi.saveOverallRatings(session.id, [{ video_id: videoId, revised_rating: rating }]);
  };

  const handleOverallRatingComplete = async () => {
    if (!session) return;
    try {
      const updated = await rgtApi.advancePhase(session.id);
      setSession(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  // Phase: additional_constructs (Catch-All)
  const handleAddConstruct = async (poleOne, poleTwo) => {
    if (!session) return;
    await rgtApi.createAdditionalConstruct(session.id, poleOne, poleTwo);
  };

  const handleCatchAllComplete = async () => {
    if (!session) return;
    try {
      const updated = await rgtApi.advancePhase(session.id);
      setSession(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="rgt-page">
        <div className="rgt-content rgt-content-center">
          <div className="rgt-loading">Loading study...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rgt-page">
        <div className="rgt-content rgt-content-center">
          <div className="rgt-error">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button className="rgt-btn rgt-btn-primary" onClick={initSession}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Round Complete transition
  if (showRoundComplete) {
    return (
      <div className="rgt-page">
        <div className="rgt-progress-bar">
          <div className="rgt-progress-step active"><span className="rgt-progress-label">Rounds</span></div>
        </div>
        <div className="rgt-content rgt-content-center">
          <h1 className="rgt-title">Round Complete</h1>
          <p>Thank you. Your responses have been saved.</p>
          <p>When you are ready, click Continue to begin the next round.</p>
          <button className="rgt-btn rgt-btn-primary" onClick={handleNextRound}>
            Continue to Next Round
          </button>
        </div>
      </div>
    );
  }

  // Section Complete transition
  if (showSectionComplete) {
    return (
      <div className="rgt-page">
        <div className="rgt-progress-bar">
          <div className="rgt-progress-step active"><span className="rgt-progress-label">Rounds</span></div>
        </div>
        <div className="rgt-content rgt-content-center">
          <h1 className="rgt-title">Section Complete</h1>
          <p>Your responses have been saved. You have completed this part of the study.</p>
          <p>When you are ready, click Continue to begin the next part.</p>
          <button className="rgt-btn rgt-btn-primary" onClick={handleTriadicComplete}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  const phase = session?.current_phase;

  if (phase === 'overall_ratings') {
    return (
      <RGTWarmUp
        videos={videos.slice(0, 3)}
        onSaveRating={handleWarmUpRating}
        onComplete={handleWarmUpComplete}
      />
    );
  }

  if (phase === 'triadic_elicitation') {
    if (!currentRound || !currentRound.triad?.videos?.length) {
      return (
        <div className="rgt-page">
          <RGTProgressBar currentStep="rounds" />
          <div className="rgt-content rgt-content-center">
            <div className="rgt-loading">Loading round...</div>
          </div>
        </div>
      );
    }

    if (triadicSubPhase === 'construct_rating') {
      return (
        <RGTConstructRating
          videos={currentRound.triad.videos}
          alikePhrase={currentConstruct.alikePhrase}
          contrastPhrase={currentConstruct.contrastPhrase}
          clipNotes={clipNotes}
          onSaveRatings={handleConstructRatingSave}
          onComplete={handleConstructRatingComplete}
        />
      );
    }

    return (
      <RGTTriadicElicitation
        roundNumber={currentRound.round_number}
        totalRounds={session?.total_rounds || 7}
        triad={currentRound.triad}
        roundAssignmentId={currentRound.id}
        onSaveNotes={handleSaveNotes}
        onMarkReviewed={handleMarkReviewed}
        onSaveComparison={handleSaveComparison}
        onSaveAnswers={handleSaveAnswers}
        onContinueToRating={handleContinueToRating}
        onRequestNewTriad={handleRequestNewTriad}
        clipNotes={clipNotes}
        clipReviews={clipReviews}
      />
    );
  }

  if (phase === 'review_ratings') {
    return (
      <RGTOverallRating
        videos={videos}
        existingRatings={{}}
        onSaveRating={handleOverallRating}
        onComplete={handleOverallRatingComplete}
      />
    );
  }

  if (phase === 'additional_constructs') {
    return (
      <RGTCatchAll
        existingConstructs={constructs}
        onAddConstruct={handleAddConstruct}
        onComplete={handleCatchAllComplete}
      />
    );
  }

  if (phase === 'completed') {
    return <RGTComplete />;
  }

  return (
    <div className="rgt-page">
      <div className="rgt-content rgt-content-center">
        <div className="rgt-loading">Loading...</div>
      </div>
    </div>
  );
};

export default RGTStudy;
