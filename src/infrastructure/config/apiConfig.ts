/**
 * Centralized API Configuration
 * 
 * In Development: Uses `import.meta.env.VITE_API_BASE_URL` (defaults to '/api/v1').
 * Requests to '/api/v1' are proxied by Vite (vite.config.ts) to the backend.
 * 
 * In Production: Set `VITE_API_BASE_URL` in .env (e.g., 'https://api.yourdomain.com/api/v1' or '/api/v1' if behind reverse proxy).
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';
