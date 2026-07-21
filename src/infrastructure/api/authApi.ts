/**
 * Raw HTTP calls for the /api/v1/auth backend routes.
 * All requests go through the central API_BASE_URL config (or Vite dev proxy),
 * so the base path works identically in development and production.
 *
 * Authentication is cookie-based: the backend sets an HttpOnly cookie on
 * login and clears it on logout.
 */

import { API_BASE_URL } from '../config/apiConfig';
import { fetchWithTimeout, parseResponse } from './httpClient';

const BASE = `${API_BASE_URL}/auth`;

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
  if (!res.ok) {
    console.warn(`Logout request returned ${res.status}`);
  }
}

/** POST /user-add — registers a new user using external api key bearer token. */
export async function apiSignup(payload: SignupPayload): Promise<UserResponse> {
  const res = await fetchWithTimeout(`${BASE}/user-add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    useExternalAuth: true,
    credentials: 'include',
  });
  return parseResponse<UserResponse>(res);
}

export const apiAddUser = apiSignup;

/** DELETE /user-delete — deletes a user using the external bearer key. */
export async function apiDeleteUser(email: string): Promise<{ message: string; email: string }> {
  const res = await fetchWithTimeout(`${BASE}/user-delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    useExternalAuth: true,
    credentials: 'include',
  });
  return parseResponse<{ message: string; email: string }>(res);
}

/** GET /users — fetch list of all system users. */
export async function apiGetAllUsers(): Promise<UserResponse[]> {
  const res = await fetchWithTimeout(`${BASE}/users`, {
    useExternalAuth: true,
    credentials: 'include',
  });
  return parseResponse<UserResponse[]>(res);
}

/** PATCH /user-status — update block/active status of a user. */
export async function apiUpdateUserStatus(email: string, is_active: boolean): Promise<UserResponse> {
  const res = await fetchWithTimeout(`${BASE}/user-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, is_active }),
    useExternalAuth: true,
    credentials: 'include',
  });
  return parseResponse<UserResponse>(res);
}

/** PATCH /user-role — update role (admin vs user/recruiter) of a user. */
export async function apiUpdateUserRole(email: string, role: string): Promise<UserResponse> {
  const res = await fetchWithTimeout(`${BASE}/user-role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
    useExternalAuth: true,
    credentials: 'include',
  });
  return parseResponse<UserResponse>(res);
}
