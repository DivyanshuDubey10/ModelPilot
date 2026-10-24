// ============================================================
// ModelPilot API Client
// Fetch wrapper — targets the backend defined by environment variables.
//
// Supported environment variables (checked in priority order):
//   1. VITE_API_BASE_URL (standard for Vercel/Render deployments)
//   2. VITE_API_URL
//   3. VITE_BACKEND_URL
//
// Also supports runtime overrides (useful for debugging in browser console):
//   - window.__MODELPILOT_API_URL__
//   - localStorage.getItem('MODELPILOT_API_URL')
// ============================================================

/**
 * Normalizes an API base URL:
 * - Strips trailing slashes
 * - Strips any accidental trailing '/api' suffix, because all endpoint
 *   paths in ModelPilot already include '/api' (e.g. '/api/optimize').
 */
export function sanitizeApiBase(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (url.endsWith('/api')) {
    url = url.slice(0, -4);
  }
  return url;
}

/**
 * Resolves the backend base URL.
 * Checks runtime overrides, build-time Vite env vars, and dev defaults.
 */
export function getApiBaseUrl(): string {
  // 1. Runtime override (helpful for instant testing in browser console or devtools)
  if (typeof window !== 'undefined') {
    const winOverride = (window as unknown as { __MODELPILOT_API_URL__?: string }).__MODELPILOT_API_URL__;
    if (typeof winOverride === 'string' && winOverride.trim()) {
      return sanitizeApiBase(winOverride);
    }
    try {
      const storageOverride = window.localStorage?.getItem('MODELPILOT_API_URL');
      if (typeof storageOverride === 'string' && storageOverride.trim()) {
        return sanitizeApiBase(storageOverride);
      }
    } catch {
      // Ignore localStorage security/sandbox errors
    }
  }

  // 2. Build-time Vite env variables
  // Vite replaces import.meta.env.* statically at build time.
  const envUrl =
    (typeof import.meta.env.VITE_API_BASE_URL === 'string' && import.meta.env.VITE_API_BASE_URL.trim()) ||
    (typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.trim()) ||
    (typeof import.meta.env.VITE_BACKEND_URL === 'string' && import.meta.env.VITE_BACKEND_URL.trim()) ||
    '';

  if (envUrl) {
    return sanitizeApiBase(envUrl);
  }

  // 3. Local development fallback
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }

  // 4. Production without env var configured
  return '';
}

// Log startup status for clarity in browser console
const initialBase = getApiBaseUrl();
if (!initialBase && !import.meta.env.DEV) {
  console.warn(
    '[ModelPilot] VITE_API_BASE_URL is not set. API requests will target the frontend ' +
    'origin and fail with 404 on Vercel. Set VITE_API_BASE_URL in your Vercel Project ' +
    'Settings → Environment Variables to your Render backend URL.'
  );
} else {
  console.info(`[ModelPilot] Active API base URL: ${initialBase || '(relative proxy)'}`);
}

/**
 * Constructs a clean destination URL without double slashes or missing slashes.
 */
export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

// ── Fetch Wrapper ────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Network error connecting to API at ${url}. Check your backend connection and CORS settings. (${message})`
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.detail || `Request to ${endpoint} failed with status ${response.status}`);
  }

  return response.json();
}

// ── HTTP Methods ─────────────────────────────────────────────

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  postForm: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const url = buildApiUrl(endpoint);
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type header — browser automatically adds multipart/form-data boundary
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Network error uploading dataset to ${url}. Check your backend connection and CORS settings. (${message})`
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail || `Upload failed with status ${response.status}`);
    }

    return response.json();
  },

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

// ── SSE Helper ───────────────────────────────────────────────

export function createSSEConnection(
  endpoint: string,
  onMessage: (event: MessageEvent) => void,
  onError?: (event: Event) => void
): EventSource {
  const url = buildApiUrl(endpoint);
  const eventSource = new EventSource(url);

  eventSource.onmessage = onMessage;

  eventSource.onerror = (event) => {
    if (onError) {
      onError(event);
    }
  };

  return eventSource;
}
