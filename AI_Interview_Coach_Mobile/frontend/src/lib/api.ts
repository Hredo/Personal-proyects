import { AuthApiResponse, AuthResponse, ProgressResponse, SessionHistoryItem, SessionResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function buildHeaders(token?: string) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.detail || fallbackMessage);
  }

  return response.json();
}

function normalizeAuthResponse(payload: AuthApiResponse): AuthResponse {
  return {
    userId: payload.user_id,
    username: payload.username,
    token: payload.token,
  };
}

export async function register(payload: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseResponse<AuthApiResponse>(response, 'No se pudo registrar la cuenta.');
  return normalizeAuthResponse(data);
}

export async function login(payload: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseResponse<AuthApiResponse>(response, 'No se pudo iniciar sesión.');
  return normalizeAuthResponse(data);
}

export async function startSession(payload: {
  user_id: string;
  role: string;
  level: string;
  context: {
    target_role: string;
    company: string;
    education: string;
    experience: string;
    technologies: string;
    goals: string;
    notes: string;
  };
}, token?: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/start`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  return parseResponse<SessionResponse>(response, 'No se pudo iniciar la sesión.');
}

export async function submitSessionAnswer(sessionId: string, answer: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/answer`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ answer }),
  });

  return parseResponse<SessionResponse>(response, 'No se pudo enviar la respuesta.');
}

export async function getProgress(userId: string, token?: string): Promise<ProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/api/progress/${userId}`, {
    headers: buildHeaders(token),
  });

  return parseResponse<ProgressResponse>(response, 'No se pudo cargar el progreso.');
}

export async function getHistory(userId: string, token?: string): Promise<SessionHistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/history/${userId}`, {
    headers: buildHeaders(token),
  });

  return parseResponse<SessionHistoryItem[]>(response, 'No se pudo cargar el historial.');
}
