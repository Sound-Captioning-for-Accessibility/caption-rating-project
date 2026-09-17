import { API_BASE_URL } from '../config';

const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const rgtApi = {
  // Videos
  getVideos: () =>
    apiCall('/api/rgt/videos').then((data) => data.videos ?? data),

  // Study session
  startSession: (token, totalRounds = 7) =>
    apiCall('/api/rgt/study/start', {
      method: 'POST',
      body: JSON.stringify({ token, total_rounds: totalRounds }),
    }),

  getSession: (sessionId) =>
    apiCall(`/api/rgt/study/sessions/${sessionId}`),

  advancePhase: (sessionId) =>
    apiCall(`/api/rgt/study/sessions/${sessionId}/advance-phase`, {
      method: 'POST',
    }),

  // Rounds
  getCurrentRound: (sessionId) =>
    apiCall(`/api/rgt/study/sessions/${sessionId}/rounds/current`),

  assignRound: (sessionId) =>
    apiCall(`/api/rgt/study/sessions/${sessionId}/rounds/assign`, {
      method: 'POST',
    }),

  completeRound: (roundAssignmentId) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/complete`, {
      method: 'POST',
    }),

  getRound: (sessionId, roundNumber) =>
    apiCall(`/api/rgt/study/sessions/${sessionId}/rounds/${roundNumber}`),

  completeRoundByNumber: (sessionId, roundNumber) =>
    apiCall(`/api/rgt/study/sessions/${sessionId}/rounds/${roundNumber}/complete`, {
      method: 'POST',
    }),

  skipTriad: (sessionId, roundNumber) =>
    apiCall(`/api/rgt/study/sessions/${sessionId}/rounds/${roundNumber}/skip`, {
      method: 'POST',
    }),

  // Clips
  markClipReviewed: (roundAssignmentId, videoId) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/clips/${videoId}/review`, {
      method: 'POST',
    }),

  getClipNotes: (roundAssignmentId, videoId) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/clips/${videoId}/notes`),

  saveClipNotes: (roundAssignmentId, videoId, noteText) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/clips/${videoId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ note_text: noteText }),
    }),

  // Comparison
  getComparison: (roundAssignmentId) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/comparison`),

  saveComparison: (roundAssignmentId, selectedVideoOneId, selectedVideoTwoId) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/comparison`, {
      method: 'PUT',
      body: JSON.stringify({
        selected_video_one_id: selectedVideoOneId,
        selected_video_two_id: selectedVideoTwoId,
      }),
    }),

  getAnswers: (roundAssignmentId) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/answers`),

  saveAnswers: (roundAssignmentId, answers) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/answers`, {
      method: 'PUT',
      body: JSON.stringify({ answers }),
    }),

  saveComparisonAnswer: (roundAssignmentId, questionKey, answerText) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/answers`, {
      method: 'PUT',
      body: JSON.stringify({ question_key: questionKey, answer_text: answerText }),
    }),

  // Ratings
  getOverallRatings: (sessionId) =>
    apiCall(`/api/rgt/sessions/${sessionId}/overall-ratings`),

  saveOverallRatings: (sessionId, ratings) =>
    apiCall(`/api/rgt/sessions/${sessionId}/overall-ratings`, {
      method: 'PUT',
      body: JSON.stringify({ ratings }),
    }),

  saveOverallRating: (sessionId, videoId, rating) =>
    apiCall(`/api/rgt/sessions/${sessionId}/overall-ratings`, {
      method: 'PUT',
      body: JSON.stringify({ video_id: videoId, rating }),
    }),

  getConstructRatings: (roundAssignmentId) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/construct-ratings`),

  saveConstructRatings: (roundAssignmentId, ratings) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/construct-ratings`, {
      method: 'PUT',
      body: JSON.stringify({ ratings }),
    }),

  saveConstructRating: (roundAssignmentId, videoId, rating) =>
    apiCall(`/api/rgt/rounds/${roundAssignmentId}/construct-ratings`, {
      method: 'PUT',
      body: JSON.stringify({ video_id: videoId, rating }),
    }),

  getElicitedConstructs: (sessionId) =>
    apiCall(`/api/rgt/sessions/${sessionId}/elicited-constructs`),

  // Additional constructs
  getAdditionalConstructs: (sessionId) =>
    apiCall(`/api/rgt/sessions/${sessionId}/additional-constructs`),

  createAdditionalConstruct: (sessionId, poleOne, poleTwo, notes = null) =>
    apiCall(`/api/rgt/sessions/${sessionId}/additional-constructs`, {
      method: 'POST',
      body: JSON.stringify({ pole_one: poleOne, pole_two: poleTwo, notes }),
    }),

  deleteAdditionalConstruct: (constructId) =>
    apiCall(`/api/rgt/additional-constructs/${constructId}`, {
      method: 'DELETE',
    }),
};
