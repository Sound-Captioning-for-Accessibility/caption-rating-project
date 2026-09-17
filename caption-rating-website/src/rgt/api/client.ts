const BASE = "/api/rgt";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  startSession: (token: string) =>
    request<{ session: import("../types").StudySession }>("/study/start", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  getSession: (sessionId: number) =>
    request<import("../types").SessionStatus>(
      `/study/sessions/${sessionId}`
    ),

  advancePhase: (sessionId: number) =>
    request<{ session: import("../types").StudySession }>(
      `/study/sessions/${sessionId}/advance-phase`,
      { method: "POST" }
    ),

  skipTriad: (sessionId: number, roundNumber: number) =>
    request<{ round_assignment: import("../types").RoundAssignment }>(
      `/study/sessions/${sessionId}/rounds/${roundNumber}/skip`,
      { method: "POST" }
    ),

  getVideos: () =>
    request<{ videos: import("../types").Video[] }>("/videos"),

  getRound: (sessionId: number, roundNumber: number) =>
    request<import("../types").RoundDetail>(
      `/study/sessions/${sessionId}/rounds/${roundNumber}`
    ),

  completeRound: (sessionId: number, roundNumber: number) =>
    request<{ session: import("../types").StudySession }>(
      `/study/sessions/${sessionId}/rounds/${roundNumber}/complete`,
      { method: "POST" }
    ),

  markClipReviewed: (raId: number, videoId: number) =>
    request<{ clip_review: import("../types").ClipReview }>(
      `/rounds/${raId}/clips/${videoId}/review`,
      { method: "POST" }
    ),

  getClipNote: (raId: number, videoId: number) =>
    request<{ clip_note: import("../types").ClipNote | null }>(
      `/rounds/${raId}/clips/${videoId}/notes`
    ),

  saveClipNote: (raId: number, videoId: number, noteText: string) =>
    request<{ clip_note: import("../types").ClipNote }>(
      `/rounds/${raId}/clips/${videoId}/notes`,
      { method: "PUT", body: JSON.stringify({ note_text: noteText }) }
    ),

  getComparison: (raId: number) =>
    request<{
      comparison: import("../types").ComparisonResponse | null;
      answers: import("../types").ComparisonAnswer[];
    }>(`/rounds/${raId}/comparison`),

  saveComparison: (raId: number, videoAId: number, videoBId: number) =>
    request<{ comparison: import("../types").ComparisonResponse }>(
      `/rounds/${raId}/comparison`,
      {
        method: "PUT",
        body: JSON.stringify({ video_a_id: videoAId, video_b_id: videoBId }),
      }
    ),

  saveComparisonAnswer: (
    raId: number,
    questionKey: string,
    answerText: string
  ) =>
    request<{ answer: import("../types").ComparisonAnswer }>(
      `/rounds/${raId}/answers`,
      {
        method: "PUT",
        body: JSON.stringify({ question_key: questionKey, answer_text: answerText }),
      }
    ),

  getOverallRatings: (sessionId: number) =>
    request<{
      ratings: import("../types").OverallRating[];
      rated_count: number;
      total_clips: number;
      all_rated: boolean;
    }>(`/sessions/${sessionId}/overall-ratings`),

  saveOverallRating: (sessionId: number, videoId: number, rating: number) =>
    request<{ overall_rating: import("../types").OverallRating }>(
      `/sessions/${sessionId}/overall-ratings`,
      {
        method: "PUT",
        body: JSON.stringify({ video_id: videoId, rating }),
      }
    ),

  getConstructRatings: (raId: number) =>
    request<{ ratings: import("../types").ConstructRating[] }>(
      `/rounds/${raId}/construct-ratings`
    ),

  saveConstructRating: (raId: number, videoId: number, rating: number) =>
    request<{ construct_rating: import("../types").ConstructRating }>(
      `/rounds/${raId}/construct-ratings`,
      {
        method: "PUT",
        body: JSON.stringify({ video_id: videoId, rating }),
      }
    ),

  getElicitedConstructs: (sessionId: number) =>
    request<{ constructs: import("../types").ElicitedConstruct[] }>(
      `/sessions/${sessionId}/elicited-constructs`
    ),

  getAdditionalConstructs: (sessionId: number) =>
    request<{ constructs: import("../types").AdditionalConstruct[] }>(
      `/sessions/${sessionId}/additional-constructs`
    ),

  saveAdditionalConstruct: (
    sessionId: number,
    poleOne: string,
    poleTwo: string
  ) =>
    request<{ construct: import("../types").AdditionalConstruct }>(
      `/sessions/${sessionId}/additional-constructs`,
      {
        method: "POST",
        body: JSON.stringify({ pole_one: poleOne, pole_two: poleTwo }),
      }
    ),

  deleteAdditionalConstruct: (sessionId: number, constructId: number) =>
    request<{ deleted: boolean }>(
      `/sessions/${sessionId}/additional-constructs/${constructId}`,
      { method: "DELETE" }
    ),
};
