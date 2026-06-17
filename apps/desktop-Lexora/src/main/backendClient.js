import { DEFAULT_BACKEND_URL } from './config.js';

function normalizeBaseUrl(value) {
  const fallback = DEFAULT_BACKEND_URL;
  try {
    return new URL(String(value || fallback)).origin;
  } catch {
    return fallback;
  }
}

function buildUrl(baseUrl, path) {
  return new URL(path, `${normalizeBaseUrl(baseUrl)}/`).toString();
}

export class BackendClient {
  constructor({ getBaseUrl, getToken }) {
    this.getBaseUrl = getBaseUrl;
    this.getToken = getToken;
  }

  async request(path, { method = 'GET', body, token, timeoutMs = 15000 } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const authToken = token || this.getToken?.();
    try {
      const requestUrl = buildUrl(this.getBaseUrl?.(), path);
      const response = await fetch(requestUrl, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      }
      if (!response.ok) {
        const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      return data;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('Request timed out. If you are using Render, wait for the backend to wake up and try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  desktopLogin(credentials) {
    return this.request('/api/auth/desktop-login', {
      method: 'POST',
      body: credentials,
      token: '',
      timeoutMs: 60000,
    });
  }

  desktopHandoffLogin(handoffToken) {
    return this.request('/api/auth/desktop-handoff-login', {
      method: 'POST',
      body: { handoffToken },
      token: '',
      timeoutMs: 60000,
    });
  }

  me() {
    return this.request('/api/auth/me');
  }

  currentSession() {
    return this.request('/api/work-sessions/current');
  }

  heartbeat(workSessionId, body) {
    return this.request(`/api/work-sessions/${workSessionId}/heartbeat`, { method: 'POST', body });
  }

  activitySample(workSessionId, body) {
    return this.request(`/api/activity-samples/work-sessions/${workSessionId}/samples`, { method: 'POST', body });
  }

  appUsageEvent(workSessionId, body) {
    return this.request(`/api/app-usage-events/work-sessions/${workSessionId}/events`, { method: 'POST', body });
  }

  stopSession(workSessionId, body) {
    return this.request(`/api/work-sessions/${workSessionId}/stop`, { method: 'POST', body });
  }

  detectIdle(workSessionId, body) {
    return this.request(`/api/idle-intervals/work-sessions/${workSessionId}/detect`, { method: 'POST', body });
  }
}
