export interface Video {
  id: number;
  title: string;
  filename: string;
  url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StudySession {
  id: number;
  participant_id: number;
  total_rounds: number;
  current_round: number;
  current_phase: Phase;
  status: "active" | "completed";
  started_at: string;
  completed_at: string | null;
}

export type Phase =
  | "overall_ratings"
  | "triadic_elicitation"
  | "additional_constructs"
  | "review_ratings"
  | "completed";

export interface RoundAssignment {
  id: number;
  session_id: number;
  round_number: number;
  triad_id: number;
  status: "pending" | "in_progress" | "completed" | "skipped";
  skipped: boolean;
  assigned_at: string;
  completed_at: string | null;
  triad?: Triad;
}

export interface Triad {
  id: number;
  video_key: string;
  videos: Video[];
  created_at: string;
}

export interface ClipReview {
  id: number;
  round_assignment_id: number;
  video_id: number;
  reviewed_at: string;
}

export interface ClipNote {
  id: number;
  round_assignment_id: number;
  video_id: number;
  note_text: string;
  updated_at: string;
}

export interface ComparisonResponse {
  id: number;
  round_assignment_id: number;
  video_a_id: number;
  video_b_id: number;
  updated_at: string;
}

export interface ComparisonAnswer {
  id: number;
  round_assignment_id: number;
  question_key: string;
  answer_text: string;
  updated_at: string;
}

export interface OverallRating {
  id: number;
  session_id: number;
  video_id: number;
  rating: number;
  revised_rating: number | null;
  effective_rating: number;
  rated_at: string;
  revised_at: string | null;
}

export interface ConstructRating {
  id: number;
  round_assignment_id: number;
  video_id: number;
  rating: number;
  rated_at: string;
}

export interface AdditionalConstruct {
  id: number;
  session_id: number;
  pole_one: string;
  pole_two: string;
  created_at: string;
}

export interface ElicitedConstruct {
  round_number: number;
  pole_one: string;
  pole_two: string;
}

export interface RoundDetail {
  round_assignment: RoundAssignment;
  clip_reviews: Record<string, ClipReview | null>;
  clip_notes: Record<string, ClipNote | null>;
  comparison: ComparisonResponse | null;
  answers: ComparisonAnswer[];
  construct_ratings: Record<string, ConstructRating>;
}

export interface SessionStatus extends StudySession {
  rounds: RoundAssignment[];
  overall_ratings: OverallRating[];
}
