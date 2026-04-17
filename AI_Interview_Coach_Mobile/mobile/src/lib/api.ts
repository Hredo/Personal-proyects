import {
  EvaluateAnswerInput,
  EvaluateAnswerResponse,
  InterviewQuestionResponse,
  ProgressResponse,
  SessionResponse,
} from '../types/interview';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function startInterview(role: string, level: string): Promise<InterviewQuestionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role, level }),
  });

  if (!response.ok) {
    throw new Error('No se pudo generar la pregunta de entrevista.');
  }

  return response.json();
}

export async function evaluateAnswer(payload: EvaluateAnswerInput): Promise<EvaluateAnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('No se pudo evaluar la respuesta.');
  }

  return response.json();
}

export async function startSession(payload: {
  user_id: string;
  role: string;
  level: string;
}): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('No se pudo iniciar la sesion.');
  }

  return response.json();
}

export async function submitSessionAnswer(sessionId: string, answer: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answer }),
  });

  if (!response.ok) {
    throw new Error('No se pudo enviar la respuesta.');
  }

  return response.json();
}

export async function getProgress(userId: string): Promise<ProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/api/progress/${userId}`);

  if (!response.ok) {
    throw new Error('No se pudo cargar el progreso.');
  }

  return response.json();
}
