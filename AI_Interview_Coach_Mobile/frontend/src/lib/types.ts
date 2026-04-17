export type Competency = {
  name: string;
  score: number;
  max_score: number;
  percentage: number;
  weight: number;
};

export type AuthState = {
  userId: string;
  username: string;
  token: string;
};

export type AuthApiResponse = {
  user_id: string;
  username: string;
  token: string;
};

export type AuthResponse = AuthState;

export type InterviewContext = {
  target_role: string;
  company: string;
  education: string;
  experience: string;
  technologies: string;
  goals: string;
  notes: string;
};

export type SessionResponse = {
  session_id: string;
  user_id: string;
  role: string;
  level: string;
  context: InterviewContext;
  question: string;
  answer: string | null;
  total_score: number | null;
  strengths: string[];
  improvements: string[];
  competencies: Competency[];
  status: 'pending' | 'completed';
};

export type ProgressResponse = {
  user_id: string;
  sessions_completed: number;
  average_score: number;
  latest_scores: number[];
  focus_areas: string[];
};

export type SessionHistoryItem = {
  session_id: string;
  user_id: string;
  role: string;
  level: string;
  context: InterviewContext;
  question: string;
  answer: string | null;
  total_score: number | null;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
};
