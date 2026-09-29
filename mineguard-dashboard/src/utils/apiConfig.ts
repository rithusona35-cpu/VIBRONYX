/**
 * MINEGUARD AI — API URL CONFIGURATION (SIH 26008)
 * Ensures robust decoupling between Frontend and FastAPI YOLO Backend.
 * Supports:
 * 1. Explicit VITE_API_BASE_URL (e.g., https://mineguard-backend.onrender.com)
 * 2. Fallback to VITE_API_URL
 * 3. Relative URLs for reverse proxy or local development
 */

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.trim().replace(/\/$/, '');
  }
  return '';
};

export const getApiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
};
