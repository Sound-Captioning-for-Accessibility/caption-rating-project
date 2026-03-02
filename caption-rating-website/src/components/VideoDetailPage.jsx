import React, { useState, useEffect } from 'react';
import { videoApi, ratingApi } from '../services/api';
import './VideoDetailPage.css';

const DIMENSIONS = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'timing', label: 'Timing' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'layout', label: 'Layout' },
];

const StarDisplay = ({ value, max = 5 }) => {
  const raw = typeof value === 'number' && !Number.isNaN(value) ? Math.min(max, Math.max(0, value)) : 0;
  const n = Math.round(raw * 2) / 2;
  const full = Math.floor(n);
  const half = n - full >= 0.5 ? 1 : 0;
  const empty = max - full - half;
  return (
    <span className="star-display" aria-label={`${n} out of ${max}`}>
      {Array.from({ length: full }, (_, i) => <span key={`f-${i}`} className="star filled">★</span>)}
      {half ? <span className="star half">★</span> : null}
      {Array.from({ length: empty }, (_, i) => <span key={`e-${i}`} className="star empty">☆</span>)}
      <span className="star-value">{Number(n).toFixed(1)}/{max}</span>
    </span>
  );
};

const DESCRIPTION_PREVIEW_LENGTH = 200;

const VideoDetailPage = ({ videoId, onBack, currentUser }) => {
  const [video, setVideo] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [posting, setPosting] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const videoData = await videoApi.getById(videoId);
        if (!cancelled) {
          setVideo(videoData);
          let list = [];
          if (Array.isArray(videoData.ratings)) {
            list = videoData.ratings;
          } else {
            try {
              const ratingsData = await ratingApi.getByVideoId(videoId);
              list = Array.isArray(ratingsData)
                ? ratingsData
                : (ratingsData?.ratings || ratingsData?.data || []);
            } catch (_) {}
          }
          setRatings(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load video.');
          setVideo(null);
          setRatings([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [videoId]);

  const dimensionAverages = () => {
    const sums = { accuracy: 0, timing: 0, completeness: 0, layout: 0 };
    const counts = { accuracy: 0, timing: 0, completeness: 0, layout: 0 };
    ratings.forEach((r) => {
      DIMENSIONS.forEach(({ key }) => {
        const v = r[key];
        const n = typeof v === 'number' ? v : (v != null ? Number(v) : NaN);
        if (!Number.isNaN(n) && n >= 1 && n <= 5) {
          sums[key] += n;
          counts[key]++;
        }
      });
    });
    const out = {};
    DIMENSIONS.forEach(({ key }) => {
      out[key] = counts[key] ? sums[key] / counts[key] : 0;
    });
    return out;
  };

  const overallAverage = () => {
    const withOverall = ratings.filter((r) => {
      const v = r.overallRating;
      const n = typeof v === 'number' ? v : (v != null ? Number(v) : NaN);
      return !Number.isNaN(n) && n >= 1 && n <= 5;
    });
    if (withOverall.length === 0) return 0;
    const sum = withOverall.reduce((s, r) => s + (Number(r.overallRating) || 0), 0);
    return sum / withOverall.length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatViews = (views) => {
    if (views == null) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return String(views);
  };

  const handlePostFeedback = async () => {
    const text = (feedbackText || '').trim();
    if (!text || posting) return;
    const userId = currentUser?.userID ?? 1;
    setPosting(true);
    try {
      await ratingApi.create({
        userID: userId,
        videoID: videoId,
        overallRating: 1,
        feedback: text,
        thumbsUp: true,
        videoTimestamp: 0,
      });
      setFeedbackText('');
      const list = await ratingApi.getByVideoId(videoId);
      setRatings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Post feedback failed:', err);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="video-detail-page">
        <div className="video-detail-loading">Loading...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="video-detail-page">
        <button type="button" className="video-detail-back" onClick={onBack}>← Back to Videos</button>
        <div className="video-detail-error">{error || 'Video not found.'}</div>
      </div>
    );
  }

  const computedAvgs = dimensionAverages();
  const computedOverall = overallAverage();
  const avgs = {
    accuracy: typeof video.accuracyAverage === 'number' ? video.accuracyAverage : computedAvgs.accuracy,
    timing: typeof video.timingAverage === 'number' ? video.timingAverage : computedAvgs.timing,
    completeness: typeof video.completenessAverage === 'number' ? video.completenessAverage : computedAvgs.completeness,
    layout: typeof video.layoutAverage === 'number' ? video.layoutAverage : computedAvgs.layout,
  };
  const overall = typeof video.averageRating === 'number' && !Number.isNaN(video.averageRating)
    ? video.averageRating
    : computedOverall;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;

  return (
    <div className="video-detail-page">
      <button type="button" className="video-detail-back" onClick={onBack}>← Back to Videos</button>

      <div className="video-detail-layout">
        <div className="video-detail-main">
          <div className="video-detail-player">
            <iframe
              title="Video player"
              src={embedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="video-detail-actions">
            <button type="button" className="video-detail-action-btn">
              <span className="cc-icon">cc</span>
              <span className="thumbs-icon">👍</span>
              <span className="action-count">{String(video.captionLikes ?? 0).padStart(2, '0')}</span>
            </button>
            <button type="button" className="video-detail-action-btn">
              <span className="cc-icon">cc</span>
              <span className="thumbs-icon">👎</span>
              <span className="action-count">00</span>
            </button>
            <button type="button" className="video-detail-action-btn learn-btn">
              <svg className="learn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              Learn
            </button>
          </div>
          <h1 className="video-detail-title">{video.title || 'Video Title'}</h1>
          <p className="video-detail-meta">
            {formatViews(video.views)} views • Published {video.created ? new Date(video.created).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
          </p>
          <div className="video-detail-description">
            {(() => {
              const text = video.description || 'Video description not available.';
              const isLong = text.length > DESCRIPTION_PREVIEW_LENGTH;
              const showTruncated = isLong && !descriptionExpanded;
              const displayText = showTruncated ? text.slice(0, DESCRIPTION_PREVIEW_LENGTH).trim() + (text.length > DESCRIPTION_PREVIEW_LENGTH ? '...' : '') : text;
              return (
                <>
                  <span className="video-detail-description-text">{displayText}</span>
                  {isLong && (
                    <button
                      type="button"
                      className="video-detail-description-toggle"
                      onClick={() => setDescriptionExpanded((e) => !e)}
                    >
                      {descriptionExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </>
              );
            })()}
          </div>

          <section className="caption-feedback-section">
            {(() => {
              const commentsWithFeedback = ratings.filter((r) => r && String(r.feedback ?? '').trim() !== '');
              const count = commentsWithFeedback.length;
              return (
                <>
                  <h2 className="caption-feedback-title">Caption Feedback ({count} {count === 1 ? 'comment' : 'comments'})</h2>
                  <div className="caption-feedback-input">
                    {(() => {
                      const rawAvatar = currentUser?.avatarUrl || currentUser?.picture || '';
                      const avatarUrl = typeof rawAvatar === 'string' && rawAvatar.startsWith('http')
                        ? rawAvatar
                        : '';
                      const initials = (currentUser?.displayName || currentUser?.name || currentUser?.email || '')
                        .trim()
                        .charAt(0)
                        .toUpperCase() || 'U';
                      if (avatarUrl) {
                        return (
                          <img
                            src={avatarUrl}
                            alt=""
                            className="comment-avatar user-avatar-img"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        );
                      }
                      return (
                        <div className="comment-avatar placeholder initials-avatar">
                          {initials}
                        </div>
                      );
                    })()}
                    <input
                      type="text"
                      placeholder="Share your feedback about the captions..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostFeedback()}
                    />
                    <button type="button" className="post-feedback-btn" onClick={handlePostFeedback} disabled={posting}>
                      Post
                    </button>
                  </div>
                  <div className="caption-feedback-list">
                    {commentsWithFeedback.map((r) => {
                      const feedbackStr = String(r.feedback ?? '').trim();
                      const key = r.ratingID || `${r.userID}-${r.videoID}-${r.submittedAt || ''}`;
                      const displayName = r.userName || `User #${r.userID}`;
                      const rawAvatar = r.userAvatarUrl || '';
                      const avatarUrl = typeof rawAvatar === 'string' && rawAvatar.startsWith('http')
                        ? rawAvatar
                        : '';
                      const initials = (displayName || '')
                        .trim()
                        .charAt(0)
                        .toUpperCase() || 'U';
                      return (
                        <div key={key} className="caption-feedback-item">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt=""
                              className="comment-avatar user-avatar-img"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="comment-avatar placeholder initials-avatar">
                              {initials}
                            </div>
                          )}
                          <div className="comment-body">
                            <span className="comment-author">{displayName}</span>
                            <span className="comment-time">{formatDate(r.submittedAt)}</span>
                            <p className="comment-text">{feedbackStr}</p>
                            <div className="comment-actions">
                              <span className="comment-like">👍 {r.thumbsUp ? 1 : 0}</span>
                              <button type="button" className="comment-reply">Reply</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {count === 0 && (
                      <p className="no-feedback">No caption feedback yet. Be the first to share your feedback from the extension.</p>
                    )}
                  </div>
                </>
              );
            })()}
          </section>
        </div>

        <aside className="community-ratings-sidebar">
          <h2 className="community-ratings-title">
            <span className="cc-icon">cc</span> Community Ratings
          </h2>
          {DIMENSIONS.map(({ key, label }) => (
            <div key={key} className="rating-dimension">
              <span className="dimension-label">{label}</span>
              <StarDisplay value={avgs[key]} />
            </div>
          ))}
          <div className="rating-dimension overall">
            <span className="dimension-label">Overall Rating</span>
            <StarDisplay value={overall} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VideoDetailPage;
