export type InterviewQuestionResponse = {
  question: string;
};

export type EvaluateAnswerInput = {
  role: string;
  level: string;
  question: string;
  answer: string;
};

export type EvaluateAnswerResponse = {
  total_score: number;
  strengths: string[];
  improvements: string[];
};

export type SessionResponse = {
  session_id: string;
  user_id: string;
  role: string;
  level: string;
  question: string;
  answer: string | null;
  total_score: number | null;
  strengths: string[];
  improvements: string[];
  status: 'pending' | 'completed';
};

export type ProgressResponse = {
  user_id: string;
  sessions_completed: number;
  average_score: number;
  latest_scores: number[];
  focus_areas: string[];
};
