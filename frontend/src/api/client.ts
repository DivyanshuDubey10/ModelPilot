// ============================================================
// ModelPilot API Client
// Fetch wrapper with SSE support for real-time updates
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:8000' : '');

// ── Fetch Wrapper ────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.detail || 'An unexpected error occurred');
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
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type — let browser set boundary for multipart
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail || 'Upload failed');
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
  const url = `${API_BASE}${endpoint}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = onMessage;

  eventSource.onerror = (event) => {
    if (onError) {
      onError(event);
    }
  };

  return eventSource;
}
