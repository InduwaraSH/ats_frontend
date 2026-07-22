export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  useExternalAuth?: boolean;
}

export const EXTERNAL_API_KEY = import.meta.env.VITE_EXTERNAL_API_KEY || 'ats_company_site_bearer_secret_2026_xyz';

/**
 * Centralized HTTP Fetch wrapper supporting timeout, authorization headers,
 * default credentials inclusion, and error parsing.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeoutMs = 60000, useExternalAuth = false, headers, ...restOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const mergedHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (useExternalAuth && EXTERNAL_API_KEY) {
    mergedHeaders['Authorization'] = `Bearer ${EXTERNAL_API_KEY}`;
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: mergedHeaders,
      signal: controller.signal,
      credentials: restOptions.credentials ?? 'include',
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check if the backend server is running.');
    }
    throw error;
  }
}

/**
 * Utility helper to parse HTTP responses into typed payloads or throw detailed Errors.
 */
export async function parseResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;

  let detail = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.detail) {
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    }
  } catch {
    // ignore json parse error
  }
  throw new Error(detail);
}
