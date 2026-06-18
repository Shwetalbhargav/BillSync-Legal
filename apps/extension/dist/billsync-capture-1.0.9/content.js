// --- Global State ---
const IDLE_MS = 5000;
const SEND_CONFIRM_TIMEOUT_MS = 10000;
let timerDiv = null;
let timerInterval = null;
let activeComposeRoot = null;
const composeSessions = new WeakMap();
const composeSendState = new WeakMap();
const COMPOSE_STATE_KEY = 'lbActiveComposeSessions';
const COMPOSE_STATE_LIMIT = 20;
let queueStatusDiv = null;
let unavailableDiv = null;
let composeObserverStop = null;
let featureFlags = {
  researchCapture: true,
  autoConvert: true,
  aiDrafting: true,
};

// --- Backend messaging ---

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function formatBackendErrorPayload(data, fallback = 'Request failed') {
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

function buildBackendError(response) {
  const status = Number(response?.status || 0);
  const rawMessage = formatBackendErrorPayload(
    response?.data,
    formatBackendErrorPayload(response?.error, `HTTP ${status || 0}`)
  );

  if (status === 401) {
    return 'Not signed in to BillSync backend. Open extension settings, sign in, then click Check Session.';
  }
  if (status === 403) {
    if (/origin not allowed by cors/i.test(rawMessage)) {
      return 'Backend CORS blocked the extension. Deploy the backend CORS fix, then re-check the extension session in settings.';
    }
    return `Backend rejected the extension session: ${rawMessage}`;
  }
  if (status === 0 && /timeout/i.test(rawMessage)) {
    return 'Backend request timed out. Retry once; if it keeps happening, check the backend URL/session in extension settings.';
  }
  return rawMessage;
}

async function backendRequest(path, { method = 'GET', body, queueOnFailure = false, idempotencyKey, timeoutMs } = {}) {
  const response = await sendRuntimeMessage({
    type: 'LB_BACKEND_REQUEST',
    request: { path, method, body, queueOnFailure, idempotencyKey, timeoutMs },
  });
  if (!response?.ok) {
    const error = new Error(buildBackendError(response));
    error.status = response?.status || 0;
    error.data = response?.data || null;
    throw error;
  }
  return response.data;
}

function logExtensionEvent(event, detail = {}) {
  sendRuntimeMessage({ type: 'LB_LOG_EVENT', event, detail }).catch(() => {});
}

async function refreshFeatureFlags() {
  try {
    const response = await sendRuntimeMessage({ type: 'LB_FEATURE_FLAGS' });
    if (response?.ok && response.data) featureFlags = { ...featureFlags, ...response.data };
  } catch {
    // Defaults keep MVP behavior enabled.
  }
}

function getGmailAdapter() {
  return window.LegalBillablesGmailAdapter || null;
}

function getCaptureCore() {
  return window.LegalBillablesCaptureCore || null;
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function idOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

function labelOf(row, fallback) {
  if (!row) return fallback;
  if (typeof row === 'string') return row;
  return row.displayName || row.name || row.title || row.email || idOf(row) || fallback;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function optionHtml(row, fallback) {
  const id = idOf(row);
  if (!id) return '';
  return `<option value="${escapeHtml(id)}">${escapeHtml(labelOf(row, fallback))}</option>`;
}

function getDomain(url = window.location.href) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function hashString(value) {
  const coreHash = getCaptureCore()?.hashString;
  if (coreHash) return coreHash(value);
  let hash = 2166136261;
  const input = String(value || '');
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function createCaptureId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function extractThreadIdFromUrl(url = window.location.href) {
  const match = String(url).match(/(?:\/|#)(?:inbox|sent|drafts|all|search\/[^/]+)\/([^/?#]+)/i);
  return match?.[1] || '';
}

function extractMessageId(composeRoot) {
  const fromAdapter = getGmailAdapter()?.getMessageId?.(composeRoot);
  if (fromAdapter) return fromAdapter;
  const selectors = [
    '[data-message-id]',
    '[data-legacy-message-id]',
    '[data-msg-id]',
    '[name="messageId"]',
  ];
  for (const selector of selectors) {
    const el = composeRoot.querySelector?.(selector);
    const value = el?.getAttribute?.('data-message-id') ||
      el?.getAttribute?.('data-legacy-message-id') ||
      el?.getAttribute?.('data-msg-id') ||
      el?.value;
    if (value) return String(value);
  }
  return '';
}

function buildGmailCaptureMetadata(composeRoot, data, userEmail) {
  const session = getComposeSession(composeRoot);
  if (session && !session.captureId) session.captureId = createCaptureId();
  const url = window.location.href;
  const domain = getDomain(url);
  const messageId = extractMessageId(composeRoot);
  const threadId = extractThreadIdFromUrl(url);
  const fallbackKey = hashString([
    userEmail,
    data.recipient,
    data.subject,
    threadId,
    session?.captureId,
  ].join('|'));
  const sourceRef = getCaptureCore()?.createEmailSourceRef?.({
    messageId,
    threadId,
    captureId: session?.captureId || fallbackKey,
    userEmail,
    recipient: data.recipient,
    subject: data.subject,
  }) || (messageId
    ? `gmail:message:${messageId}`
    : threadId
      ? `gmail:thread:${threadId}:compose:${fallbackKey}`
      : `gmail:compose:${session?.captureId || fallbackKey}`);

  return {
    source: 'gmail',
    sourceRef,
    messageId,
    threadId,
    url,
    domain,
    meta: {
      captureId: session?.captureId || fallbackKey,
      capturedFrom: 'chrome_extension',
      extensionVersion: chrome.runtime?.getManifest?.().version || '',
      schemaVersion: 1,
    },
  };
}
// content.js (top-level)
function getLbPromptFromUrl() {
  try {
    const u = new URL(window.location.href);
    const hashQuery = u.hash.includes('?') ? u.hash.slice(u.hash.indexOf('?') + 1) : '';
    const hashParams = new URLSearchParams(hashQuery);
    return u.searchParams.get("lb_prompt") || hashParams.get("lb_prompt") || "";
  } catch {
    return "";
  }
}
let LB_PROMPT_FROM_URL = getLbPromptFromUrl();
let LB_PROMPT_USED = false;
let externalActivitySamplerStarted = false;

function getUrlParamFromSearchOrHash(name) {
  try {
    const u = new URL(window.location.href);
    const hashQuery = u.hash.includes('?') ? u.hash.slice(u.hash.indexOf('?') + 1) : '';
    const hashParams = new URLSearchParams(hashQuery);
    return u.searchParams.get(name) || hashParams.get(name) || '';
  } catch {
    return '';
  }
}

function getBillSyncComposeIntent() {
  try {
    const u = new URL(window.location.href);
    const hashQuery = u.hash.includes('?') ? u.hash.slice(u.hash.indexOf('?') + 1) : '';
    const hashParams = new URLSearchParams(hashQuery);
    const params = hashParams.get('lb_compose') ? hashParams : u.searchParams;
    if (params.get('lb_compose') !== '1') return null;
    return {
      to: params.get('to') || '',
      subject: params.get('su') || '',
      body: params.get('body') || '',
      prompt: params.get('lb_prompt') || '',
      key: params.toString(),
    };
  } catch {
    return null;
  }
}

function getBillSyncWorkSessionId() {
  return getUrlParamFromSearchOrHash('lb_work_session_id');
}

function startExternalActivitySampler() {
  return;
  if (externalActivitySamplerStarted) return;
  const workSessionId = getBillSyncWorkSessionId();
  if (!workSessionId) return;
  externalActivitySamplerStarted = true;

  const bucket = {
    windowStart: new Date(),
    keyboardCount: 0,
    mouseCount: 0,
    activeSeconds: 0,
    lastInteractionAt: Date.now(),
    lastMouseMoveCountAt: 0,
  };

  function markKeyboardActivity() {
    bucket.keyboardCount += 1;
    bucket.lastInteractionAt = Date.now();
  }

  function markMouseActivity() {
    bucket.mouseCount += 1;
    bucket.lastInteractionAt = Date.now();
  }

  function markMouseMoveActivity() {
    const now = Date.now();
    if (now - bucket.lastMouseMoveCountAt < 750) return;
    bucket.lastMouseMoveCountAt = now;
    markMouseActivity();
  }

  function resetBucket(windowStart = new Date()) {
    bucket.windowStart = windowStart;
    bucket.keyboardCount = 0;
    bucket.mouseCount = 0;
    bucket.activeSeconds = 0;
  }

  async function flushActivitySample() {
    const windowEnd = new Date();
    const sampleSeconds = Math.max(1, Math.round((windowEnd.getTime() - new Date(bucket.windowStart).getTime()) / 1000));
    if (sampleSeconds < 2 && !bucket.keyboardCount && !bucket.mouseCount && !bucket.activeSeconds) return;
    const activeSeconds = Math.min(bucket.activeSeconds, sampleSeconds);
    const body = {
      windowStart: new Date(bucket.windowStart).toISOString(),
      windowEnd: windowEnd.toISOString(),
      sampleSeconds,
      activeSeconds,
      inactiveSeconds: Math.max(sampleSeconds - activeSeconds, 0),
      keyboardCount: bucket.keyboardCount,
      mouseCount: bucket.mouseCount,
      sourceDevice: 'chrome_extension',
      sourceApp: 'gmail',
    };
    resetBucket(windowEnd);
    try {
      await backendRequest(`/api/activity-samples/work-sessions/${encodeURIComponent(workSessionId)}/samples`, {
        method: 'POST',
        body,
        queueOnFailure: true,
        idempotencyKey: `activity-sample:gmail:${workSessionId}:${body.windowStart}`,
      });
    } catch (err) {
      logExtensionEvent('external_activity_sample_failed', {
        workSessionId,
        error: err.message || 'Activity sample failed',
      });
    }
  }

  document.addEventListener('keydown', markKeyboardActivity, true);
  document.addEventListener('pointerdown', markMouseActivity, true);
  document.addEventListener('pointermove', markMouseMoveActivity, true);
  document.addEventListener('wheel', markMouseActivity, { passive: true, capture: true });

  setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - bucket.lastInteractionAt <= 60000) {
      bucket.activeSeconds += 1;
    }
  }, 1000);
  setInterval(flushActivitySample, 15000);
  window.addEventListener('beforeunload', () => {
    flushActivitySample();
  });
  logExtensionEvent('external_activity_sampler_started', { workSessionId, sourceApp: 'gmail' });
}

function hasBillSyncGmailMeterIntent() {
  try {
    const u = new URL(window.location.href);
    const hashQuery = u.hash.includes('?') ? u.hash.slice(u.hash.indexOf('?') + 1) : '';
    const hashParams = new URLSearchParams(hashQuery);
    return u.searchParams.get('lb_meter') === '1' ||
      hashParams.get('lb_meter') === '1' ||
      u.searchParams.get('lb_compose') === '1' ||
      hashParams.get('lb_compose') === '1';
  } catch {
    return false;
  }
}

function setNativeValue(el, value) {
  if (!el) return false;
  const prototype = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : el instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : null;
  const setter = prototype && Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function waitForComposeRoot(timeoutMs = 10000) {
  return new Promise((resolve) => {
    const existing = getComposeRoots()[0];
    if (existing) {
      resolve(existing);
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const root = getComposeRoots()[0];
      if (root || Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        resolve(root || null);
      }
    }, 250);
  });
}

function findNativeGmailComposeButton() {
  return document.querySelector('[gh="cm"]') ||
    Array.from(document.querySelectorAll('div[role="button"], button'))
      .find((node) => /compose/i.test(node.getAttribute('aria-label') || node.textContent || ''));
}

function fillComposeRecipient(composeRoot, to) {
  if (!to) return;
  const input = composeRoot.querySelector('textarea[aria-label="To"], input[aria-label="To"], textarea[name="to"], input[name="to"]') ||
    document.querySelector('textarea[aria-label="To"], input[aria-label="To"], textarea[name="to"], input[name="to"]');
  if (!input) return;
  input.focus();
  setNativeValue(input, to);
  input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter' }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter' }));
}

function fillComposeSubject(composeRoot, subject) {
  if (!subject) return;
  const input = composeRoot.querySelector('input[name="subjectbox"], input[aria-label="Subject"], input[placeholder="Subject"]');
  setNativeValue(input, subject);
}

function fillComposeBody(composeRoot, body) {
  if (!body) return;
  const bodyEl = getGmailAdapter()?.getBody?.(composeRoot) ||
    composeRoot.querySelector('div[aria-label="Message Body"][contenteditable="true"], div[g_editable="true"][contenteditable="true"], div[role="textbox"][contenteditable="true"]');
  if (!bodyEl) return;
  bodyEl.focus();
  bodyEl.innerText = body;
  bodyEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: body }));
}

async function openBillSyncComposeIntent() {
  const intent = getBillSyncComposeIntent();
  if (!intent && !hasBillSyncGmailMeterIntent()) return;
  const storageKey = `lb-compose-intent:${intent?.key || window.location.href}`;
  if (sessionStorage.getItem(storageKey)) return;
  sessionStorage.setItem(storageKey, '1');

  LB_PROMPT_FROM_URL = intent?.prompt || LB_PROMPT_FROM_URL;
  window.lb_ai_prompt = intent?.prompt || window.lb_ai_prompt || '';

  if (!getComposeRoots().length) {
    findNativeGmailComposeButton()?.click();
  }

  const composeRoot = await waitForComposeRoot();
  if (!composeRoot) return;
  fillComposeRecipient(composeRoot, intent?.to);
  fillComposeSubject(composeRoot, intent?.subject);
  fillComposeBody(composeRoot, intent?.body);
  activeComposeRoot = composeRoot;
  refreshTimerUI();
  logExtensionEvent('gmail_meter_connected', { from: 'work_meter' });
}



// --- Compose sessions + timer widget ---
function getComposeRoots() {
  const adapterRoots = getGmailAdapter()?.getComposeRoots?.();
  if (adapterRoots?.length) return adapterRoots;
  const roots = Array.from(document.querySelectorAll('div[role="dialog"]'))
    .filter((root) => root.querySelector('input[name="subjectbox"]'));
  if (document.querySelector('input[name="subjectbox"]')) roots.push(document);
  return roots;
}

function getComposeRootFromNode(node) {
  const adapterRoot = getGmailAdapter()?.getComposeRootFromNode?.(node);
  if (adapterRoot) return adapterRoot;
  if (!node) return getComposeRoots()[0] || null;
  const dialog = node.closest?.('div[role="dialog"]');
  if (dialog?.querySelector('input[name="subjectbox"]')) return dialog;
  if (document.querySelector('input[name="subjectbox"]')) return document;
  return null;
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

function getComposePersistenceKey(composeRoot) {
  const adapter = getGmailAdapter();
  const subject = adapter?.getSubject?.(composeRoot) ||
    composeRoot?.querySelector?.('input[name="subjectbox"]')?.value ||
    '';
  const recipients = adapter?.getRecipients?.(composeRoot) || [];
  const threadId = extractThreadIdFromUrl();
  const basis = [threadId, subject, recipients.join(','), window.location.href].join('|');
  return `gmail-compose:${hashString(basis)}`;
}

async function loadPersistedComposeSession(composeRoot, session) {
  const key = getComposePersistenceKey(composeRoot);
  const values = await storageLocalGet([COMPOSE_STATE_KEY]);
  const allSessions = values[COMPOSE_STATE_KEY] || {};
  const persisted = allSessions[key];
  if (!persisted || !session || session.restored) return;

  session.seconds = Math.max(session.seconds || 0, Number(persisted.seconds || 0));
  session.lastActive = Number(persisted.lastActive || 0);
  session.captureId = persisted.captureId || session.captureId;
  session.sourceRef = persisted.sourceRef || session.sourceRef;
  session.restored = true;
  updateTimer();
  logExtensionEvent('compose_session_restored', { key });
}

async function persistComposeSession(composeRoot) {
  const session = getComposeSession(composeRoot);
  if (!session) return;
  const key = getComposePersistenceKey(composeRoot);
  const values = await storageLocalGet([COMPOSE_STATE_KEY]);
  const allSessions = values[COMPOSE_STATE_KEY] || {};
  allSessions[key] = {
    key,
    captureId: session.captureId,
    sourceRef: session.sourceRef || '',
    seconds: session.seconds || 0,
    lastActive: session.lastActive || 0,
    updatedAt: Date.now(),
  };

  const pruned = Object.fromEntries(
    Object.entries(allSessions)
      .sort((a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0))
      .slice(0, COMPOSE_STATE_LIMIT)
  );
  await storageLocalSet({ [COMPOSE_STATE_KEY]: pruned });
}

async function removePersistedComposeSession(composeRoot) {
  const key = getComposePersistenceKey(composeRoot);
  const values = await storageLocalGet([COMPOSE_STATE_KEY]);
  const allSessions = values[COMPOSE_STATE_KEY] || {};
  delete allSessions[key];
  await storageLocalSet({ [COMPOSE_STATE_KEY]: allSessions });
}

function getComposeSession(composeRoot) {
  if (!composeRoot) return null;
  let session = composeSessions.get(composeRoot);
  if (!session) {
    session = {
      seconds: 0,
      lastActive: 0,
      lastEntryId: '',
      lastEntry: null,
      captureId: createCaptureId(),
    };
    composeSessions.set(composeRoot, session);
    loadPersistedComposeSession(composeRoot, session);
  }
  return session;
}

function createTimerWidget() {
  if (timerDiv) return;
  timerDiv = document.createElement('div');
  timerDiv.id = 'legal-billables-timer';
  timerDiv.innerHTML = `
    <style>
      #legal-billables-timer {
        position: fixed; bottom: 28px; right: 28px;
        width: 90px; height: 90px; z-index: 99999;
        background: rgba(255,255,255,0.92);
        border-radius: 50%; box-shadow: 0 3px 16px rgba(0,0,0,0.18);
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; border: 2.2px solid #0288d1; user-select: none;
      }
      #legal-billables-timer .time {
        font-family: 'Segoe UI', Arial, sans-serif; font-size: 1.15rem; font-weight: bold;
        color: #333; margin: 8px 0 0; letter-spacing: 1px;
      }
      #legal-billables-timer .label { font-size: 0.85rem; color: #0288d1; margin-top: 0; }
    </style>
    <div class="center">
      <div class="label">BillSync</div>
      <div class="time" id="billables-timer-value">00:00</div>
    </div>`;
  document.body.appendChild(timerDiv);
}

function showCaptureUnavailable(reason) {
  if (!unavailableDiv) {
    unavailableDiv = document.createElement('div');
    unavailableDiv.id = 'lb-capture-unavailable';
    unavailableDiv.setAttribute('role', 'status');
    document.body.appendChild(unavailableDiv);
  }
  unavailableDiv.textContent = `BillSync capture unavailable: ${reason}`;
  Object.assign(unavailableDiv.style, {
    position: 'fixed',
    bottom: '128px',
    right: '20px',
    maxWidth: '360px',
    background: '#8a4600',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    fontSize: '12px',
    zIndex: '2147483647',
  });
  logExtensionEvent('gmail_selector_failure', { reason });
}

function hideCaptureUnavailable() {
  unavailableDiv?.remove();
  unavailableDiv = null;
}

function createQueueStatusWidget() {
  if (queueStatusDiv) return queueStatusDiv;
  queueStatusDiv = document.createElement('button');
  queueStatusDiv.id = 'lb-queue-status';
  queueStatusDiv.type = 'button';
  Object.assign(queueStatusDiv.style, {
    position: 'fixed',
    bottom: '12px',
    right: '20px',
    display: 'none',
    border: '1px solid #d0d5dd',
    background: '#fff',
    color: '#172033',
    padding: '7px 10px',
    borderRadius: '8px',
    boxShadow: '0 3px 10px rgba(0,0,0,0.14)',
    fontSize: '12px',
    zIndex: '2147483647',
    cursor: 'pointer',
  });
  queueStatusDiv.onclick = async () => {
    try {
      const response = await sendRuntimeMessage({ type: 'LB_DIAGNOSTICS' });
      const queue = response?.data?.queue;
      const items = queue?.items || [];
      const detail = items.slice(0, 5)
        .map((item) => `${item.status}: ${item.subject || item.sourceRef || item.key}${item.lastError ? ` (${item.lastError})` : ''}`)
        .join('\n');
      showGmailPopup(detail || 'No pending local captures.');
      await sendRuntimeMessage({ type: 'LB_RETRY_QUEUE' });
      setTimeout(refreshQueueStatus, 1000);
    } catch (err) {
      showGmailPopup(`Queue status unavailable: ${err.message}`);
    }
  };
  document.body.appendChild(queueStatusDiv);
  return queueStatusDiv;
}

async function refreshQueueStatus() {
  try {
    const response = await sendRuntimeMessage({ type: 'LB_QUEUE_STATUS' });
    if (!response?.ok) return;
    const counts = response.data?.counts || {};
    const pending = Number(counts.pending || 0);
    const failed = Number(counts.failed || 0);
    const syncing = Number(counts.syncing || 0);
    const total = pending + failed + syncing;
    const widget = createQueueStatusWidget();
    if (!total) {
      widget.style.display = 'none';
      return;
    }
    widget.style.display = 'block';
    widget.textContent = failed
      ? `BillSync: ${failed} failed, ${pending} queued`
      : `BillSync: ${total} queued`;
    widget.style.borderColor = failed ? '#f04438' : '#f79009';
  } catch {
    // Silent: this is an auxiliary status widget.
  }
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function removeTimerWidget() {
  stopTimer();
  if (timerDiv) {
    timerDiv.remove();
    timerDiv = null;
  }
}

function formatTime(secs) {
  const formatter = getCaptureCore()?.formatMinSec;
  if (formatter) return formatter(secs);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimer() {
  if (!timerDiv) return;
  const session = getComposeSession(activeComposeRoot);
  const seconds = session?.seconds || 0;
  const v = timerDiv.querySelector('#billables-timer-value');
  if (v) v.innerText = formatTime(seconds);
  window.seconds = seconds;
}

function hasEditableCompose(root) {
  if (getGmailAdapter()?.hasBody) return !!getGmailAdapter().hasBody(root);
  return !!root?.querySelector?.('div[aria-label="Message Body"][contenteditable="true"]');
}

function isComposeOpen(composeRoots = getComposeRoots()) {
  return composeRoots.some((root) => hasEditableCompose(root));
}

function syncActiveComposeRoot() {
  if (activeComposeRoot && (activeComposeRoot === document || activeComposeRoot.isConnected)) return;
  const activeEl = document.activeElement;
  activeComposeRoot = getComposeRootFromNode(activeEl);
}

function refreshTimerUI() {
  const health = getGmailAdapter()?.getHealth?.();
  if (health?.composeCount && !health.ok) {
    showCaptureUnavailable(health.missing || 'Gmail compose layout changed');
  } else {
    hideCaptureUnavailable();
  }
  const composeRoots = getComposeRoots();
  syncActiveComposeRoot();
  composeRoots.forEach((composeRoot) => {
    insertAIButton(composeRoot);
  });
  if (!isComposeOpen(composeRoots)) {
    activeComposeRoot = null;
    removeTimerWidget();
    return;
  }
  if (!activeComposeRoot) activeComposeRoot = composeRoots[0] || null;
  if (!activeComposeRoot) return;
  createTimerWidget();
  updateTimer();
  startTimer();
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    syncActiveComposeRoot();
    const session = getComposeSession(activeComposeRoot);
    const isActive = session && (Date.now() - session.lastActive) < IDLE_MS;
    if (!document.hidden && activeComposeRoot && isActive) {
      session.seconds += 1;
      updateTimer();
      if (session.seconds % 5 === 0) persistComposeSession(activeComposeRoot);
    } else if (!activeComposeRoot || (activeComposeRoot !== document && !activeComposeRoot.isConnected) || !hasEditableCompose(activeComposeRoot)) {
      activeComposeRoot = null;
      removeTimerWidget();
    }
  }, 1000);
}

function resetComposeSession(composeRoot) {
  const session = getComposeSession(composeRoot);
  if (!session) return;
  removePersistedComposeSession(composeRoot);
  session.seconds = 0;
  session.lastActive = 0;
  session.lastEntryId = '';
  session.lastEntry = null;
  session.captureId = createCaptureId();
  session.sourceRef = '';
  if (activeComposeRoot === composeRoot) updateTimer();
}

function markActivityForNode(node) {
  const composeRoot = getComposeRootFromNode(node);
  if (!composeRoot) return;
  const rootChanged = activeComposeRoot !== composeRoot;
  activeComposeRoot = composeRoot;
  const session = getComposeSession(composeRoot);
  session.lastActive = Date.now();
  persistComposeSession(composeRoot);
  if (rootChanged || !timerDiv) refreshTimerUI();
}

function onUserActivity(event) {
  const t = event?.target || document.activeElement;
  if (t?.getAttribute?.('aria-label') === 'Message Body' || t?.isContentEditable) {
    markActivityForNode(t);
  }
}

refreshFeatureFlags().then(() => {
  refreshTimerUI();
  openBillSyncComposeIntent();
  startExternalActivitySampler();
});
if (!composeObserverStop && getGmailAdapter()?.observeComposeChanges) {
  composeObserverStop = getGmailAdapter().observeComposeChanges(refreshTimerUI);
}
refreshQueueStatus();
setInterval(refreshQueueStatus, 15000);
setInterval(refreshFeatureFlags, 60000);

['input', 'keydown', 'paste', 'cut', 'click'].forEach((evt) => {
  document.addEventListener(evt, onUserActivity, true);
});

document.addEventListener('focus', onUserActivity, true);
window.addEventListener('hashchange', () => {
  openBillSyncComposeIntent();
  startExternalActivitySampler();
});

function finalizeAndGetBillTime(composeRoot = activeComposeRoot) {
  const session = getComposeSession(composeRoot);
  const totalSeconds = Math.max(0, Number(session?.seconds) || 0);

  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  // "2.59" style string (minutes.seconds where seconds are two digits)
  const minSec = `${m}.${String(s).padStart(2, '0')}`;

  // precise float minutes (e.g., 2.9833...)
  const minutesFloat = totalSeconds / 60;

  // expose to rest of pipeline
  window.billSyncTimeSeconds = totalSeconds;
  window.billSyncTimeMinutes = minutesFloat;     // precise minutes (no 6-min quantization)
  window.billSyncTimeMinSec  = minSec;           // "m.ss" string for display/logs

  return { totalSeconds, minutesFloat, minSec };
}


// --- Helpers ---
async function getIdentity() {
  // 1) storage
  const fromStorage = await new Promise((resolve) => {
    try {
      if (chrome?.storage?.sync?.get) {
        chrome.storage.sync.get(["userId", "userEmail"], (obj) => resolve(obj || {}));
      } else resolve({});
    } catch { resolve({}); }
  });

  let { userId, userEmail } = fromStorage;

  // 2) fallback: extract from Google Account aria-label (e.g., “Google Account: Name (me@gmail.com)”)
  if (!userEmail) {
    const acc = document.querySelector('a[aria-label^="Google Account"]') ||
                document.querySelector('a[aria-label*="@"]');
    const label = acc?.getAttribute("aria-label") || "";
    const m = label.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (m) userEmail = m[0];
  }

  return { userId, userEmail };
}

async function resolveUserEmail() {
  const { userEmail } = await getIdentity();
  const normalizedEmail = String(userEmail || '').trim().toLowerCase();
  if (!normalizedEmail) return '';

  try {
    chrome?.storage?.sync?.set?.({ userEmail: normalizedEmail });
  } catch {
    // Ignore storage errors; the resolved email is still usable for the request.
  }

  return normalizedEmail;
}

function openSettingsPage() {
  try {
    chrome?.runtime?.sendMessage?.({ type: 'OPEN_OPTIONS_PAGE' }, (response) => {
      if (chrome?.runtime?.lastError) {
        console.warn('[LB] Could not open settings page:', chrome.runtime.lastError.message);
        return;
      }
      if (!response?.ok) {
        console.warn('[LB] Could not open settings page:', response?.error || 'Unknown error');
      }
    });
  } catch (err) {
    console.warn('[LB] Could not open settings page:', err);
  }
}

function getComposeState(composeRoot) {
  let state = composeSendState.get(composeRoot);
  if (!state) {
    state = { loggingInFlight: false };
    composeSendState.set(composeRoot, state);
  }
  return state;
}

function isComposeDetached(composeRoot) {
  if (!composeRoot || composeRoot === document) return false;
  return !composeRoot.isConnected || !document.body.contains(composeRoot);
}

function hasSendConfirmationSignal() {
  if (getGmailAdapter()?.hasSendConfirmationSignal?.()) return true;
  const liveRegions = Array.from(
    document.querySelectorAll('[role="alert"], [aria-live], .bAq')
  );
  return liveRegions.some((node) => /message sent/i.test(node.textContent || ''));
}

function waitForSendConfirmation(composeRoot, timeoutMs = SEND_CONFIRM_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (isComposeDetached(composeRoot) || hasSendConfirmationSignal()) {
        clearInterval(interval);
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 300);
  });
}


function getComposeData(composeRoot) {
  const adapter = getGmailAdapter();
  const subjectValue = adapter?.getSubject?.(composeRoot);
  const subjectEl = composeRoot.querySelector('input[name="subjectbox"]');

  // Recipients from chips or raw input
  const adapterRecipients = adapter?.getRecipients?.(composeRoot) || [];
  const chipEmails = Array.from(
    composeRoot.querySelectorAll('div[aria-label="To"] [email], div[aria-label="To"] [data-hovercard-id]')
  ).map(el => el.getAttribute('email') || el.getAttribute('data-hovercard-id')).filter(Boolean);

  const toField = composeRoot.querySelector('textarea[aria-label="To"], input[aria-label="To"]');
  const rawTo = (toField?.value || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);

  const toList = Array.from(new Set([...adapterRecipients, ...chipEmails, ...rawTo]));
  const recipient = toList[0] || '';
  // Timing (read from window set in finalize)
  const minutesFloat = Number(window.billSyncTimeMinutes);
  const secondsTotal = Number(window.billSyncTimeSeconds);
  const minSecStr    = String(window.billSyncTimeMinSec || '');

  // Fallbacks if something went wrong
  const safeMinutes  = Number.isFinite(minutesFloat) ? minutesFloat : 0;
  const safeSeconds  = Number.isFinite(secondsTotal) ? secondsTotal : Math.round(safeMinutes * 60);
  const safeMinSec   = minSecStr || (() => {
    const m = Math.floor(safeSeconds / 60), s = safeSeconds % 60;
    return `${m}.${String(s).padStart(2, '0')}`;
  })();
  const normalizedMinutes = safeMinutes > 0 ? safeMinutes : 0.1;
  const normalizedSeconds = safeSeconds > 0 ? safeSeconds : Math.round(normalizedMinutes * 60);
  const normalizedMinSec = safeSeconds > 0
    ? safeMinSec
    : `${Math.floor(normalizedSeconds / 60)}.${String(normalizedSeconds % 60).padStart(2, '0')}`;

  return {
    recipient,
    subject: subjectValue || subjectEl?.value || '',
    typingTimeMinutes: normalizedMinutes,
    typingTimeSeconds: normalizedSeconds,
    typingTimeMinSec: normalizedMinSec
  };
}

async function requestGeneratedEmail(prompt) {
  const response = await sendRuntimeMessage({ type: 'LB_GENERATE_EMAIL', prompt });
  if (!response?.ok) {
    throw new Error(buildBackendError(response));
  }
  const data = response.data;
  const text = String(data?.email?.text ?? '').trim();
  if (!text) throw new Error('No email returned');
  return text;
}

function insertGeneratedEmail(composeRoot, text) {
  const editable = getGmailAdapter()?.getBody?.(composeRoot) ||
    composeRoot.querySelector('div[aria-label="Message Body"][contenteditable="true"]');
  if (!editable) throw new Error('Gmail message body not found');

  editable.innerHTML = '';
  text.split('\n').forEach((line) => {
    const div = document.createElement('div');
    div.textContent = line || '\u00A0';
    editable.appendChild(div);
  });
  editable.focus();
}

function clickGmailSendButton(sendBtn) {
  if (!sendBtn) return false;
  ['mousedown', 'mouseup', 'click'].forEach((type) => {
    sendBtn.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
  });
  return true;
}

// --- Popup Notification ---
function showGmailPopup(summaryText) {
  let popup = document.querySelector('#legal-billables-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'legal-billables-popup';
    popup.setAttribute('role', 'status');
    popup.setAttribute('aria-live', 'polite');
    document.body.appendChild(popup);
  }
  popup.textContent = summaryText;
  Object.assign(popup.style, {
    position: 'fixed', bottom: '20px', right: '20px',
    backgroundColor: '#2e7d32', color: '#fff',
    padding: '14px 20px', borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    fontSize: '14px', lineHeight: '1.4', maxWidth: '360px',
    whiteSpace: 'pre-line', zIndex: '2147483647', opacity: '1',
    transition: 'opacity 0.25s ease',
  });
  clearTimeout(popup._hideTimer);
  popup._hideTimer = setTimeout(() => { popup.style.opacity = '0'; setTimeout(() => popup.remove(), 400); }, 8000);
}

function showMappingPopup(entry, { summaryText = '' } = {}) {
  const entryId = String(entry?._id || entry?.id || '');
  if (!entryId) return;

  document.querySelector('#lb-map-popup')?.remove();
  const popup = document.createElement('div');
  popup.id = 'lb-map-popup';
  Object.assign(popup.style, {
    position: 'fixed',
    top: '110px',
    right: '40px',
    background: '#fff',
    border: '1px solid #d7d7d7',
    borderRadius: '10px',
    width: '360px',
    padding: '14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    zIndex: '2147483647',
  });

  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <strong>Map Email Entry</strong>
      <button id="lb-map-close" style="background:transparent;border:0;font-size:18px;cursor:pointer;">x</button>
    </div>
    <div style="font-size:12px;color:#555;margin-bottom:10px;">Select the client and matter. Saving converts the capture into billing records.</div>
    <label style="display:block;font-size:12px;margin-bottom:4px;">Client</label>
    <select id="lb-map-client" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:10px;">
      <option value="">Loading clients...</option>
    </select>
    <label style="display:block;font-size:12px;margin-bottom:4px;">Matter</label>
    <select id="lb-map-case" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-bottom:10px;">
      <option value="">Loading matters...</option>
    </select>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <button id="lb-map-save" style="background:#1677ff;color:#fff;border:0;padding:8px 12px;border-radius:6px;cursor:pointer;">Save Mapping</button>
      <button id="lb-map-settings" style="background:#f2f4f7;color:#111;border:1px solid #ddd;padding:8px 12px;border-radius:6px;cursor:pointer;">Settings</button>
      <span id="lb-map-status" style="font-size:12px;color:#666;"></span>
    </div>
  `;

  document.body.appendChild(popup);
  popup.querySelector('#lb-map-close').onclick = () => popup.remove();
  popup.querySelector('#lb-map-settings').onclick = () => openSettingsPage();

  const clientSelect = popup.querySelector('#lb-map-client');
  const caseSelect = popup.querySelector('#lb-map-case');
  const status = popup.querySelector('#lb-map-status');
  let cases = [];

  function renderCaseOptions(clientId) {
    caseSelect.innerHTML = `<option value="">Select matter</option>${
      cases
        .filter((row) => !clientId || idOf(row.clientId || row.client) === clientId)
        .map((row) => optionHtml(row, 'Matter'))
        .join('')
    }`;
  }

  backendRequest('/api/clients')
    .then(async (clientPayload) => {
      const casePayload = await backendRequest('/api/cases');
      const clients = unwrapList(clientPayload);
      cases = unwrapList(casePayload);
      clientSelect.innerHTML = `<option value="">Select client</option>${clients.map((row) => optionHtml(row, 'Client')).join('')}`;
      const currentClientId = idOf(entry.clientId || entry.client);
      const currentCaseId = idOf(entry.caseId || entry.case);
      if (currentClientId) clientSelect.value = currentClientId;
      renderCaseOptions(clientSelect.value);
      if (currentCaseId) caseSelect.value = currentCaseId;
      status.textContent = '';
    })
    .catch((err) => {
      clientSelect.innerHTML = '<option value="">Could not load clients</option>';
      caseSelect.innerHTML = '<option value="">Could not load matters</option>';
      status.textContent = err.message || 'Mapping options unavailable.';
    });

  clientSelect.onchange = () => {
    renderCaseOptions(clientSelect.value);
  };
  caseSelect.onchange = () => {
    const selectedCase = cases.find((row) => idOf(row) === caseSelect.value);
    const clientId = idOf(selectedCase?.clientId || selectedCase?.client);
    if (clientId) clientSelect.value = clientId;
  };

  popup.querySelector('#lb-map-save').onclick = async () => {
    const clientId = clientSelect.value;
    const caseId = caseSelect.value;
    if (!clientId || !caseId) {
      status.textContent = 'Select a client and matter.';
      return;
    }

    status.textContent = 'Saving...';
    try {
      await backendRequest(`/api/email-entries/${entryId}/map`, {
        method: 'POST',
        body: { clientId, caseId, convert: featureFlags.autoConvert }
      });
      status.textContent = featureFlags.autoConvert ? 'Mapped and converted.' : 'Mapping saved.';
      if (summaryText) showGmailPopup(summaryText);
      setTimeout(() => popup.remove(), 800);
    } catch (err) {
      status.textContent = `Error: ${err.message}`;
    }
  };
}

// --- SEND flow (click + keyboard) ---
async function handleTrackedSend(triggerEl) {
  const composeRoot = triggerEl.closest('div[role="dialog"]') || document;
  const sendState = getComposeState(composeRoot);
  if (sendState.loggingInFlight) return;
  sendState.loggingInFlight = true;

  const session = getComposeSession(composeRoot);
  const { minutesFloat, minSec } = finalizeAndGetBillTime(composeRoot);
  window.billSyncTimeMinutes = minutesFloat;
  const data = getComposeData(composeRoot);

  try {
    const userEmail = await resolveUserEmail();
    if (!userEmail) {
      showGmailPopup('Identity not found. Set user email in extension storage or sign in to Gmail.');
      return;
    }

    data.userEmail = userEmail;
    delete data.userId;
    Object.assign(data, buildGmailCaptureMetadata(composeRoot, data, userEmail));
    session.sourceRef = data.sourceRef;
    persistComposeSession(composeRoot);

    if (!data.recipient) {
      showGmailPopup('Recipient missing. Email time was not logged.');
      logExtensionEvent('capture_validation_failed', { reason: 'recipient_missing' });
      return;
    }

    showGmailPopup('Waiting for send confirmation before logging time...');
    session.lastActive = 0;

    const confirmed = await waitForSendConfirmation(composeRoot);
    if (!confirmed) {
      showGmailPopup('Send was not confirmed. Email time was not logged.');
      return;
    }
    document.querySelector('#lb-ai-popup')?.remove();

    const json = await backendRequest('/api/email-entries', {
      method: 'POST',
      body: data,
      queueOnFailure: true,
      idempotencyKey: data.sourceRef,
    });

    if (json?.queued) {
      showGmailPopup('Email sent. BillSync queued the capture locally and will retry automatically.');
      await refreshQueueStatus();
      resetComposeSession(composeRoot);
      return;
    }

    const entry = json.entry || json.data || {};
    sendState.lastEntryId = String(entry._id || entry.id || '');
    session.lastEntryId = sendState.lastEntryId;
    session.lastEntry = entry;
    resetComposeSession(composeRoot);
    refreshTimerUI();
    const minSecUsed = entry.typingTimeMinSec || data.typingTimeMinSec || minSec;
    const summary = `Time logged: ${minSecUsed} min\n\nSummary:\n${entry.billableSummary || ''}`;
    showGmailPopup('Email sent. Select client and matter to finish billing.');
    showMappingPopup(entry, { summaryText: summary });
    logExtensionEvent('capture_logged', { source: data.source, status: entry.status || 'captured' });
  } catch (err) {
    console.error('[Legal Billables] Error posting to backend:', err);
    logExtensionEvent('capture_failed', { error: err.message || 'Logging failed' });
    showGmailPopup('Logging failed: ' + err.message);
  } finally {
    sendState.loggingInFlight = false;
  }
}
// Test bridges from the page context -> content script
window.addEventListener('LB_TEST_POPUP', (e) => showGmailPopup(e.detail || 'Popup bridge OK'));
window.addEventListener('LB_TEST_SEND',  () => {
  const btn = getGmailAdapter()?.getSendButton?.(document) ||
    document.querySelector('div[role="dialog"] [data-tooltip*="Send"], div[role="dialog"] [aria-label*="Send"]') ||
    document.body;
  clickGmailSendButton(btn);
});

// Clicks (walk up from inner SVG/path)
document.addEventListener('mousedown', (e) => {
  const btn = e.target.closest('[data-tooltip*="Send"], [aria-label*="Send"]');
  if (btn) handleTrackedSend(btn);
}, true);

// Keyboard Ctrl/⌘+Enter
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    const btn = getGmailAdapter()?.getSendButton?.(document) ||
      document.querySelector('div[role="dialog"] [data-tooltip*="Send"], div[role="dialog"] [aria-label*="Send"]') ||
      document.body;
    handleTrackedSend(btn);
  }
}, true);

// --- AI Assistant ---
// Create the small toolbar under the Subject row
function insertAIButton(composeRoot) {
  if (!featureFlags.aiDrafting) return;
  if (composeRoot.querySelector('#lb-ai-btn')) return;

  const subjectInput = getGmailAdapter()?.SELECTORS?.subject
    ?.map((selector) => composeRoot.querySelector(selector))
    .find(Boolean) || composeRoot.querySelector('input[name="subjectbox"]');
  if (!subjectInput) return;

  const subjectContainer = subjectInput.closest('.aoD') || subjectInput.parentElement;
  if (!subjectContainer) return;

  const bar = document.createElement('div');
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.gap = '8px';
  bar.style.margin = '8px 0';
  bar.style.userSelect = 'none';

  const aiBtn = document.createElement('button');
  aiBtn.id = 'lb-ai-btn';
  aiBtn.textContent = 'Write with AI';
  Object.assign(aiBtn.style, {
    background: '#1677ff', color: '#fff', border: 0, padding: '6px 10px',
    borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
  });

  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'lb-settings-btn';
  settingsBtn.textContent = 'Settings';
  Object.assign(settingsBtn.style, {
    background: '#f2f4f7', color: '#111', border: '1px solid #ddd', padding: '6px 10px',
    borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
  });

  const status = document.createElement('span');
  status.id = 'lb-ai-status';
  status.style.fontSize = '12px';
  status.style.color = '#555';

  aiBtn.addEventListener('click', () => showAIPromptPopup(composeRoot));
  settingsBtn.addEventListener('click', openSettingsPage);

  bar.appendChild(aiBtn);
  bar.appendChild(settingsBtn);
  bar.appendChild(status);
  subjectContainer.parentElement.insertBefore(bar, subjectContainer.nextSibling);
}

function showAIPromptPopup(composeRoot) {
  const existing = document.querySelector('#lb-ai-popup');
  if (existing) return;

  const popup = document.createElement('div');
  popup.id = 'lb-ai-popup';
  const popupWidth = 280;
  const popupHeight = 190;
  const initialLeft = window.scrollX + Math.max(12, window.innerWidth - popupWidth - 24);
  const initialTop = window.scrollY + Math.max(12, window.innerHeight - popupHeight - 24);

  Object.assign(popup.style, {
    position: 'absolute',
    left: `${initialLeft}px`,
    top: `${initialTop}px`,
    background: '#fff',
    border: '1px solid #cfcfcf',
    borderRadius: '8px 8px 0 0',
    width: `${popupWidth}px`,
    height: `${popupHeight}px`,
    minWidth: '220px',
    minHeight: '140px',
    maxWidth: 'min(560px, calc(100vw - 32px))',
    maxHeight: 'min(520px, calc(100vh - 32px))',
    boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
    zIndex: '2147483647',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  });

  popup.innerHTML = `
    <div id="lb-ai-header" style="
      cursor: move; padding: 10px 12px; background: #f7f7f7;
      border-bottom: 1px solid #e6e6e6; font-weight: 600; display:flex; align-items:center; justify-content:space-between;">
      <span>Write with AI</span>
      <button id="lb-ai-close" title="Close" style="background:transparent;border:0;font-size:18px;line-height:1;cursor:pointer;">✖</button>
    </div>

    <div id="lb-ai-body" style="padding: 10px 12px; overflow-y: auto;">
      <label style="display:block;margin-bottom:6px;font-size:12px;color:#555;">Describe the email</label>
      <textarea id="lb-ai-prompt-input"
        placeholder="e.g., Update Client on discovery deadlines and next steps. Keep it concise, formal, include a subject line."
        style="width:100%; min-height: 120px; resize: vertical; padding:8px; font-size:14px; line-height:1.4; border:1px solid #ddd; border-radius:8px;"></textarea>

      <div style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button id="lb-ai-generate-insert" style="background:#1677ff;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Generate & Insert</button>
        <span id="lb-ai-status" style="font-size:12px;color:#666;"></span>
      </div>
    </div>
    <div id="lb-ai-resize" title="Resize" style="
      position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;
      background:linear-gradient(135deg, transparent 50%, #9aa0a6 50%, #9aa0a6 58%, transparent 58%, transparent 66%, #9aa0a6 66%, #9aa0a6 74%, transparent 74%);
    "></div>
  `;

  document.body.appendChild(popup);

  Object.assign(popup.querySelector('#lb-ai-header').style, {
    padding: '8px 10px',
    background: '#f2f6fc',
    color: '#202124',
    borderBottom: '1px solid #dadce0',
    font: '500 14px Arial, sans-serif',
    flex: '0 0 auto',
  });
  Object.assign(popup.querySelector('#lb-ai-close').style, {
    padding: '0 4px',
    color: '#202124',
  });
  popup.querySelector('#lb-ai-close').textContent = 'x';
  Object.assign(popup.querySelector('#lb-ai-body').style, {
    overflow: 'auto',
    overflowX: 'hidden',
    flex: '1 1 auto',
    boxSizing: 'border-box',
  });
  Object.assign(popup.querySelector('#lb-ai-prompt-input').style, {
    height: 'calc(100% - 66px)',
    minHeight: '58px',
    resize: 'none',
    boxSizing: 'border-box',
    font: '14px/1.4 Arial, sans-serif',
    border: '1px solid #dadce0',
    borderRadius: '6px',
    outline: 'none',
  });
  popup.querySelector('#lb-ai-body label').style.font = '12px Arial, sans-serif';
  popup.querySelector('#lb-ai-body label').style.color = '#5f6368';
  Object.assign(popup.querySelector('#lb-ai-generate-insert').style, {
    background: '#1a73e8',
    padding: '7px 12px',
    borderRadius: '4px',
    font: '500 13px Arial, sans-serif',
  });
  Object.assign(popup.querySelector('#lb-ai-status').style, {
    font: '12px Arial, sans-serif',
    color: '#5f6368',
  });

  // Close
  popup.querySelector('#lb-ai-close').onclick = () => popup.remove();

  // Dragging
  (function makeDraggable() {
    const header = popup.querySelector('#lb-ai-header');
    let startX = 0, startY = 0, originTop = 0, originLeft = 0, dragging = false;

    const onDown = (e) => {
      dragging = true;
      const evt = e.touches ? e.touches[0] : e;
      startX = evt.clientX;
      startY = evt.clientY;
      // compute current top/left from getBoundingClientRect
      const rect = popup.getBoundingClientRect();
      originTop = rect.top;
      originLeft = rect.left;
      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp, true);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const evt = e.touches ? e.touches[0] : e;
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;
      const nextTop = window.scrollY + Math.min(window.innerHeight - 40, Math.max(10, originTop + dy));
      const nextLeft = window.scrollX + Math.min(window.innerWidth - 80, Math.max(10, originLeft + dx));
      popup.style.top = nextTop + 'px';
      popup.style.left = nextLeft + 'px';
      e.preventDefault?.();
    };
    const onUp = () => {
      dragging = false;
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      document.removeEventListener('touchmove', onMove, true);
      document.removeEventListener('touchend', onUp, true);
    };

    header.addEventListener('mousedown', onDown, true);
    header.addEventListener('touchstart', onDown, { passive: true });
  })();

  (function makeResizable() {
    const handle = popup.querySelector('#lb-ai-resize');
    let startX = 0, startY = 0, startWidth = 0, startHeight = 0, resizing = false;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const onDown = (e) => {
      resizing = true;
      const evt = e.touches ? e.touches[0] : e;
      const rect = popup.getBoundingClientRect();
      startX = evt.clientX;
      startY = evt.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp, true);
      e.preventDefault?.();
      e.stopPropagation?.();
    };
    const onMove = (e) => {
      if (!resizing) return;
      const evt = e.touches ? e.touches[0] : e;
      const maxWidth = Math.min(560, window.innerWidth - 32);
      const maxHeight = Math.min(520, window.innerHeight - 32);
      popup.style.width = `${clamp(startWidth + evt.clientX - startX, 220, maxWidth)}px`;
      popup.style.height = `${clamp(startHeight + evt.clientY - startY, 140, maxHeight)}px`;
      e.preventDefault?.();
    };
    const onUp = () => {
      resizing = false;
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      document.removeEventListener('touchmove', onMove, true);
      document.removeEventListener('touchend', onUp, true);
    };

    handle.addEventListener('mousedown', onDown, true);
    handle.addEventListener('touchstart', onDown, { passive: false });
  })();

  // Actions
  const promptEl = popup.querySelector('#lb-ai-prompt-input');
  const statusEl = popup.querySelector('#lb-ai-status');
  const btnGenerateInsert = popup.querySelector('#lb-ai-generate-insert');
  promptEl.value = LB_PROMPT_FROM_URL || window.lb_ai_prompt || '';

  async function generateAndInsert() {
    const prompt = (promptEl.value || '').trim();
    if (!prompt) {
      statusEl.textContent = 'Enter a prompt first.';
      return;
    }
    btnGenerateInsert.disabled = true;
    statusEl.textContent = 'Generating...';

    try {
      const text = await requestGeneratedEmail(prompt);
      insertGeneratedEmail(composeRoot, text);
      statusEl.textContent = 'Inserted. Review before sending.';
    } catch (e) {
      console.error('[AI popup] error', e);
      statusEl.textContent = e.message || 'Error';
    } finally {
      btnGenerateInsert.disabled = false;
    }
  }

  btnGenerateInsert.onclick = generateAndInsert;
}

      






