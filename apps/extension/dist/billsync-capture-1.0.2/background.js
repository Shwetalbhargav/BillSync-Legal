const DEFAULT_BACKEND = 'https://legalbillind-backend.onrender.com';
const DEFAULT_FRONTEND_APP = 'https://bill-bot-legal.vercel.app';
const EXTENSION_STORAGE_KEYS = [
  'backendBaseUrl',
  'frontendAppUrl',
  'authToken',
  'featureResearchCapture',
  'featureAutoConvert',
  'featureAIDrafting',
];
const QUEUE_KEY = 'lbCaptureQueue';
const LOG_KEY = 'lbDiagnosticLog';
const EXTENSION_TOKEN_KEY = 'lbExtensionAuthSession';
const MAX_LOG_ITEMS = 200;
const MAX_QUEUE_ITEMS = 250;
const REQUEST_TIMEOUT_MS = 15000;
const RETRY_ALARM = 'lbRetryQueue';

function nowIso() {
  return new Date().toISOString();
}

function normalizeBackendBaseUrl(value) {
  return String(value || DEFAULT_BACKEND).trim().replace(/\/+$/, '');
}

function normalizeAppUrl(value) {
  return String(value || DEFAULT_FRONTEND_APP).trim().replace(/\/+$/, '');
}

function createId(prefix = 'lb') {
  if (globalThis.crypto?.randomUUID) return `${prefix}:${globalThis.crypto.randomUUID()}`;
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
}

function storageSyncGet(keys) {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(keys, (values) => resolve(values || {}));
    } catch {
      resolve({});
    }
  });
}

function storageLocalGet(keys) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (values) => resolve(values || {}));
    } catch {
      resolve({});
    }
  });
}

function storageLocalSet(values) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(values, () => resolve());
    } catch {
      resolve();
    }
  });
}

async function getBackendSettings() {
  const values = await storageSyncGet(EXTENSION_STORAGE_KEYS);
  const localValues = await storageLocalGet([EXTENSION_TOKEN_KEY]);
  const session = localValues[EXTENSION_TOKEN_KEY] || {};
  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : 0;
  const hasFreshExtensionToken = session.token && expiresAt > Date.now() + 60000;
  return {
    backendBaseUrl: normalizeBackendBaseUrl(values.backendBaseUrl),
    authToken: hasFreshExtensionToken
      ? String(session.token || '').trim()
      : String(values.authToken || '').trim(),
  };
}

async function getAppSettings() {
  const values = await storageSyncGet(EXTENSION_STORAGE_KEYS);
  return {
    frontendAppUrl: normalizeAppUrl(values.frontendAppUrl),
  };
}

async function getFeatureFlags() {
  const values = await storageSyncGet(EXTENSION_STORAGE_KEYS);
  return {
    researchCapture: values.featureResearchCapture !== false,
    autoConvert: values.featureAutoConvert !== false,
    aiDrafting: values.featureAIDrafting !== false,
  };
}

async function logEvent(event, detail = {}) {
  const values = await storageLocalGet([LOG_KEY]);
  const log = Array.isArray(values[LOG_KEY]) ? values[LOG_KEY] : [];
  log.unshift({
    event,
    at: nowIso(),
    extensionVersion: chrome.runtime.getManifest().version,
    ...detail,
  });
  await storageLocalSet({ [LOG_KEY]: log.slice(0, MAX_LOG_ITEMS) });
}

function categorizeFailure({ status, error }) {
  if (status === 0) {
    return typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'network';
  }
  if (status === 401 || status === 403) return 'auth';
  if (status === 408) return 'timeout';
  if (status >= 500) return 'server';
  if (status >= 400) return 'validation';
  if (/timeout/i.test(error || '')) return 'timeout';
  return 'unknown';
}

function formatBackendError(data, fallback = 'Request failed') {
  if (!data) return fallback;
  if (typeof data === 'string') return data;

  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const error = data.error;
  const raw = typeof data.raw === 'string' ? data.raw.trim() : '';

  if (Array.isArray(data.errors) && data.errors.length) {
    const details = data.errors
      .map((item) => {
        if (typeof item === 'string') return item;
        const field = typeof item?.field === 'string' ? item.field : '';
        const itemMessage = typeof item?.message === 'string' ? item.message : '';
        return [field, itemMessage].filter(Boolean).join(': ');
      })
      .filter(Boolean)
      .join('; ');
    return [message || 'Validation failed', details].filter(Boolean).join(': ');
  }

  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error && typeof error === 'object') {
    if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
    if (typeof error.error === 'string' && error.error.trim()) return error.error.trim();
  }

  return message || raw || fallback;
}

function retryDelayMs(attempts) {
  const base = Math.min(30 * 60 * 1000, 2 ** Math.max(0, attempts - 1) * 15000);
  return base + Math.floor(Math.random() * 2000);
}

function parseDurationMs(value, fallbackMs = 15 * 60 * 1000) {
  const match = String(value || '').trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
}

async function loadQueue() {
  const values = await storageLocalGet([QUEUE_KEY]);
  return Array.isArray(values[QUEUE_KEY]) ? values[QUEUE_KEY] : [];
}

async function saveQueue(queue) {
  await storageLocalSet({ [QUEUE_KEY]: queue.slice(0, MAX_QUEUE_ITEMS) });
}

function queueKeyForRequest(request = {}) {
  return String(
    request.idempotencyKey ||
    request.body?.sourceRef ||
    request.body?.meta?.captureId ||
    createId('queued')
  );
}

async function enqueueRequest(request, { error = '', category = 'unknown' } = {}) {
  const queue = await loadQueue();
  const key = queueKeyForRequest(request);
  const existing = queue.find((item) => item.key === key);
  const timestamp = nowIso();
  const nextRetryAt = new Date(Date.now() + retryDelayMs(existing?.attempts || 1)).toISOString();
  const item = {
    key,
    request: {
      ...request,
      queueOnFailure: false,
    },
    status: 'pending',
    attempts: existing?.attempts || 0,
    lastError: error,
    category,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
    nextRetryAt,
  };

  const nextQueue = existing
    ? queue.map((row) => (row.key === key ? item : row))
    : [item, ...queue];
  await saveQueue(nextQueue);
  await logEvent('capture_queued', { key, category, error });
  scheduleRetry();
  return item;
}

function buildHeaders(requestHeaders, authToken, includeAuth = true) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Legal-Billables-Extension': chrome.runtime.id,
    'X-Legal-Billables-Extension-Version': chrome.runtime.getManifest().version,
    ...(requestHeaders || {}),
  };
  if (includeAuth && authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function storeExtensionAuthSession(data = {}) {
  if (!data.token) return null;
  const expiresAt = new Date(Date.now() + parseDurationMs(data.expiresIn)).toISOString();
  const session = {
    token: data.token,
    tokenType: data.tokenType || 'Bearer',
    expiresIn: data.expiresIn || '15m',
    expiresAt,
    user: data.user || null,
    linkedAt: nowIso(),
  };
  await storageLocalSet({ [EXTENSION_TOKEN_KEY]: session });
  return session;
}

async function refreshExtensionAuthSession() {
  const syncValues = await storageSyncGet(EXTENSION_STORAGE_KEYS);
  const backendBaseUrl = normalizeBackendBaseUrl(syncValues.backendBaseUrl);
  const response = await fetchWithTimeout(`${backendBaseUrl}/api/auth/extension-token`, {
    method: 'POST',
    headers: buildHeaders({}, '', false),
    credentials: 'include',
  }, REQUEST_TIMEOUT_MS);

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!response.ok) {
    const error = data?.error || data?.message || `HTTP ${response.status}`;
    await logEvent('extension_auth_refresh_failed', {
      status: response.status,
      category: categorizeFailure({ status: response.status, error }),
      error,
    });
    return { ok: false, status: response.status, error, data };
  }

  const session = await storeExtensionAuthSession(data);
  if (data.user?.email) {
    await new Promise((resolve) => {
      chrome.storage.sync.set({ userEmail: String(data.user.email).toLowerCase() }, () => resolve());
    });
  }
  await logEvent('extension_auth_linked', { userId: data.user?.id, email: data.user?.email });
  return { ok: true, status: response.status, data, session };
}

async function sendBackendRequest(request = {}) {
  const { backendBaseUrl, authToken } = await getBackendSettings();
  const path = String(request.path || request.endpoint || '');
  if (!path.startsWith('/')) {
    throw new Error('Backend request path must start with /.');
  }

  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(`${backendBaseUrl}${path}`, {
      method: request.method || 'GET',
      headers: buildHeaders(request.headers, authToken, !request.skipAuthHeader),
      credentials: 'include',
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
    }, request.timeoutMs || REQUEST_TIMEOUT_MS);

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    const result = {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok
        ? ''
        : formatBackendError(data, `HTTP ${response.status}`),
      durationMs: Date.now() - startedAt,
    };

    if (!result.ok) {
      const category = categorizeFailure(result);
      if ((result.status === 401 || result.status === 403) && request.allowAuthRefresh !== false && !request.skipAuthHeader) {
        const refreshed = await refreshExtensionAuthSession();
        if (refreshed.ok) {
          return sendBackendRequest({ ...request, allowAuthRefresh: false });
        }
      }
      await logEvent('backend_request_failed', { path, status: result.status, category, error: result.error });
      if (request.queueOnFailure && ['offline', 'network', 'timeout', 'server'].includes(category)) {
        const queued = await enqueueRequest(request, { error: result.error, category });
        return {
          ok: true,
          queued: true,
          status: 202,
          data: { queued: true, queueKey: queued.key, status: queued.status },
          error: '',
        };
      }
    } else if (request.logSuccess) {
      await logEvent('backend_request_succeeded', { path, status: result.status, durationMs: result.durationMs });
    }

    return result;
  } catch (err) {
    const error = err?.name === 'AbortError' ? 'Request timeout' : err.message || 'Request failed';
    const result = { ok: false, status: 0, data: null, error };
    const category = categorizeFailure(result);
    await logEvent('backend_request_failed', { path, status: 0, category, error });
    if (request.queueOnFailure && ['offline', 'network', 'timeout', 'server'].includes(category)) {
      const queued = await enqueueRequest(request, { error, category });
      return {
        ok: true,
        queued: true,
        status: 202,
        data: { queued: true, queueKey: queued.key, status: queued.status },
        error: '',
      };
    }
    return result;
  }
}

async function getQueueStatus() {
  const queue = await loadQueue();
  const counts = queue.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  return {
    counts,
    items: queue.map((item) => ({
      key: item.key,
      status: item.status,
      attempts: item.attempts,
      category: item.category,
      lastError: item.lastError,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      nextRetryAt: item.nextRetryAt,
      sourceRef: item.request?.body?.sourceRef,
      subject: item.request?.body?.subject,
    })),
  };
}

async function processQueue({ force = false } = {}) {
  let queue = await loadQueue();
  const now = Date.now();
  let changed = false;

  for (const item of queue) {
    if (item.status === 'synced') continue;
    if (!force && item.nextRetryAt && Date.parse(item.nextRetryAt) > now) continue;

    item.status = 'syncing';
    item.updatedAt = nowIso();
    changed = true;
    await saveQueue(queue);

    const result = await sendBackendRequest({
      ...(item.request || {}),
      queueOnFailure: false,
      logSuccess: true,
    });

    if (result.ok) {
      item.status = 'synced';
      item.syncedAt = nowIso();
      item.updatedAt = item.syncedAt;
      item.lastError = '';
      await logEvent('capture_synced', { key: item.key, status: result.status });
    } else {
      item.status = 'failed';
      item.attempts = Number(item.attempts || 0) + 1;
      item.lastError = result.error;
      item.category = categorizeFailure(result);
      item.nextRetryAt = new Date(Date.now() + retryDelayMs(item.attempts)).toISOString();
      item.updatedAt = nowIso();
      await logEvent('capture_retry_failed', {
        key: item.key,
        status: result.status,
        category: item.category,
        error: result.error,
      });
    }
    changed = true;
  }

  if (changed) {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    queue = queue.filter((item) => item.status !== 'synced' || Date.parse(item.syncedAt || item.updatedAt) > cutoff);
    await saveQueue(queue);
  }
  scheduleRetry();
  return getQueueStatus();
}

async function getDiagnostics() {
  const values = await storageLocalGet([LOG_KEY]);
  return {
    log: Array.isArray(values[LOG_KEY]) ? values[LOG_KEY] : [],
    queue: await getQueueStatus(),
  };
}

async function generateEmailFromPrompt(prompt) {
  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) return { ok: false, status: 400, error: 'Prompt is required.' };

  const primary = await sendBackendRequest({
    path: '/api/ai/generate-email',
    method: 'POST',
    body: { prompt: cleanPrompt },
    timeoutMs: 45000,
    logSuccess: true,
  });
  if (primary.ok || primary.status !== 404) return primary;

  return sendBackendRequest({
    path: '/generate-email',
    method: 'POST',
    body: { prompt: cleanPrompt },
    timeoutMs: 45000,
    logSuccess: true,
  });
}

async function openBackendLogin() {
  const { frontendAppUrl } = await getAppSettings();
  const loginUrl = `${frontendAppUrl}/login?source=chrome-extension`;
  await new Promise((resolve, reject) => {
    chrome.tabs.create({ url: loginUrl }, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(err);
      else resolve();
    });
  });
  await logEvent('extension_login_opened', { loginUrl });
  return { loginUrl };
}

function scheduleRetry() {
  chrome.alarms.create(RETRY_ALARM, { delayInMinutes: 1, periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RETRY_ALARM) {
    processQueue().catch((err) => logEvent('queue_processor_failed', { error: err.message }));
  }
});

chrome.runtime.onStartup.addListener(() => {
  scheduleRetry();
  processQueue().catch((err) => logEvent('queue_startup_failed', { error: err.message }));
});

chrome.runtime.onInstalled.addListener(() => {
  scheduleRetry();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'LB_BACKEND_REQUEST') {
    sendBackendRequest(message.request)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, status: 0, error: err.message || 'Request failed' }));
    return true;
  }

  if (message?.type === 'LB_QUEUE_STATUS') {
    getQueueStatus()
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((err) => sendResponse({ ok: false, error: err.message || 'Could not load queue status' }));
    return true;
  }

  if (message?.type === 'LB_RETRY_QUEUE') {
    processQueue({ force: true })
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((err) => sendResponse({ ok: false, error: err.message || 'Retry failed' }));
    return true;
  }

  if (message?.type === 'LB_LOG_EVENT') {
    logEvent(message.event || 'extension_event', message.detail || {})
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message || 'Log failed' }));
    return true;
  }

  if (message?.type === 'LB_DIAGNOSTICS') {
    getDiagnostics()
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((err) => sendResponse({ ok: false, error: err.message || 'Diagnostics unavailable' }));
    return true;
  }

  if (message?.type === 'LB_GENERATE_EMAIL') {
    generateEmailFromPrompt(message.prompt)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, status: 0, error: err.message || 'Email generation failed' }));
    return true;
  }

  if (message?.type === 'LB_FEATURE_FLAGS') {
    getFeatureFlags()
      .then((flags) => sendResponse({ ok: true, data: flags }))
      .catch((err) => sendResponse({ ok: false, error: err.message || 'Feature flags unavailable' }));
    return true;
  }

  if (message?.type === 'LB_CHECK_AUTH') {
    refreshExtensionAuthSession()
      .then((result) => sendResponse(result.ok
        ? { ok: true, data: result.data, session: result.session }
        : { ok: false, status: result.status, error: result.error, data: result.data }))
      .catch((err) => sendResponse({ ok: false, status: 0, error: err.message || 'Auth check failed' }));
    return true;
  }

  if (message?.type === 'LB_OPEN_LOGIN') {
    openBackendLogin()
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((err) => sendResponse({ ok: false, error: err.message || 'Could not open login' }));
    return true;
  }

  if (message?.type !== 'OPEN_OPTIONS_PAGE') return false;

  chrome.runtime.openOptionsPage(() => {
    const err = chrome.runtime.lastError;
    if (err) {
      sendResponse({ ok: false, error: err.message || 'Could not open settings page.' });
      return;
    }
    sendResponse({ ok: true });
  });

  return true;
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id || !tab.url || tab.url.startsWith('chrome://')) {
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    const flags = await getFeatureFlags();
    if (!flags.researchCapture) {
      chrome.runtime.openOptionsPage();
      return;
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['research.js'],
    });
    await chrome.tabs.sendMessage(tab.id, { type: 'LB_SHOW_RESEARCH_CAPTURE' });
  } catch (err) {
    await logEvent('research_capture_injection_failed', { error: err.message || 'Injection failed' });
    chrome.runtime.openOptionsPage();
  }
});
