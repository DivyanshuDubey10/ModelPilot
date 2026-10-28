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
 * Timeout used for long-running requests (optimization).
 * Render free tier has a 100s gateway timeout; we use 95s so the client gives a friendly
 * actionable timeout message before the cloud proxy abruptly drops the TCP connection.
 * Regular GET/health requests use SHORT_TIMEOUT_MS.
 */
const LONG_TIMEOUT_MS = 95_000;   // 95 s — covers Render cold-start + multi-model training
const SHORT_TIMEOUT_MS = 20_000;  // 20 s  — for health checks & simple GETs

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

/**
 * Core fetch wrapper with AbortController-based timeout.
 * @param timeoutMs  How long to wait before aborting (default: SHORT_TIMEOUT_MS).
 *                   Pass LONG_TIMEOUT_MS for the /api/optimize endpoint.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = SHORT_TIMEOUT_MS
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `Request to ${endpoint} timed out after ${Math.round(timeoutMs / 1000)}s. ` +
        `The Render cloud instance may still be waking from sleep or took too long. Try running with 1 or 2 experiments.`
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Network error connecting to API at ${url}. Check your backend connection and CORS settings. (${message})`
    );
  }

  clearTimeout(timer);

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || '';
    } catch {
      // Non-JSON response (such as HTML 502/504 returned by Render reverse proxy)
      if (response.status === 504) {
        errorDetail = 'Gateway Timeout (100s exceeded). The cloud backend took too long. Try with 1 or 2 experiments.';
      } else if (response.status === 502 || response.status === 503) {
        errorDetail = `Backend unavailable (HTTP ${response.status}). The Render service is waking from sleep or restarting. Please try again in 30 seconds.`;
      } else {
        errorDetail = `HTTP ${response.status}: ${response.statusText || 'Server Error'}`;
      }
    }
    throw new Error(errorDetail || `Request to ${endpoint} failed with status ${response.status}`);
  }

  return response.json();
}

// ── HTTP Methods ─────────────────────────────────────────────

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  // Standard POST (short timeout)
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  // Long-running POST (used for /api/optimize — allows full cold-start + training time)
  postLong: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, LONG_TIMEOUT_MS),

  postForm: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const url = buildApiUrl(endpoint);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000); // 60s for file uploads

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Do NOT set Content-Type header — browser automatically adds multipart/form-data boundary
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('File upload timed out after 60s. Check your connection or try a smaller file.');
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Network error uploading dataset to ${url}. Check your backend connection and CORS settings. (${message})`
      );
    }

    clearTimeout(timer);

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
