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
    const detail = errorBody?.detail;
    if (typeof detail === 'string') {
      throw new Error(detail);
    }
    if (Array.isArray(detail)) {
      const message = detail
        .map((item) => item?.msg || JSON.stringify(item))
        .join(' | ');
      throw new Error(message || fallbackMessage);
    }
    throw new Error(fallbackMessage);
  }

  return response.json();
}

function normalizeAuthResponse(payload: AuthApiResponse): AuthResponse {
  return {
    userId: payload.user_id,
    email: payload.email,
    token: payload.token,
  };
}

export async function register(payload: {
  email: string;
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
  email: string;
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
    summary: string;
    notes: string;
    education?: string;
    experience?: string;
    technologies?: string;
    goals?: string;
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

  return parseResponse<SessionResponse>(response, 'No se pudo continuar la entrevista.');
}

export async function evaluateSession(sessionId: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/evaluate`, {
    method: 'POST',
    headers: buildHeaders(),
  });

  return parseResponse<SessionResponse>(response, 'No se pudo evaluar la entrevista.');
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

export async function getSession(sessionId: string, token?: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    headers: buildHeaders(token),
  });

  return parseResponse<SessionResponse>(response, 'No se pudo cargar la sesión.');
}

export async function deleteSession(sessionId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.detail || 'No se pudo borrar la conversación.');
  }
}
