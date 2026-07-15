/**
 * Raw HTTP calls for the /api/v1/auth backend routes.
 * All requests go through the Vite dev-server proxy (see vite.config.ts),
 * so the base path works identically in development and production.
 *
 * Authentication is cookie-based: the backend sets an HttpOnly cookie on
 * login and clears it on logout. Every request therefore needs
 * `credentials: 'include'` so the browser attaches / stores the cookie.
 */

const BASE = `${import.meta.env.VITE_API_BASE_URL}/auth`;

// ─── Request / Response shapes ───────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  message: string;
}

export interface UserResponse {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

// ─── Shared error handler & Timeout helper ────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check if the backend server is running.');
    }
    throw error;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;

  let detail = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.detail) detail = body.detail;
  } catch {
    // ignore json parse failures — keep the status-based message
  }
  throw new Error(detail);
}

// ─── API functions ────────────────────────────────────────────────────────────

/** POST /login — backend sets an HttpOnly cookie on success. */
export async function apiLogin(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetchWithTimeout(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return parseResponse<LoginResponse>(res);
}

/** POST /signup — creates the account. */
export async function apiSignup(payload: SignupPayload): Promise<UserResponse> {
  const res = await fetchWithTimeout(`${BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return parseResponse<UserResponse>(res);
}

/** GET /me — backend reads the cookie; no Authorization header needed. */
export async function apiGetMe(): Promise<UserResponse> {
  const res = await fetchWithTimeout(`${BASE}/me`, {
    credentials: 'include',
  });
  return parseResponse<UserResponse>(res);
}

/** POST /logout — backend clears the HttpOnly cookie server-side. */
export async function apiLogout(): Promise<void> {
  const res = await fetchWithTimeout(`${BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  // A failed logout should not block the frontend from clearing local state,
  // but we still log it for visibility.
  if (!res.ok) {
    console.warn(`Logout request returned ${res.status}`);
  }
}
