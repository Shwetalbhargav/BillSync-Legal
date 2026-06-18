(() => {
  const SAMPLE_FLUSH_MS = 15000;
  const APP_USAGE_FLUSH_MS = 60000;
  const HEARTBEAT_MS = 30000;
  const SESSION_REFRESH_MS = 10000;
  const ACTIVE_INTERACTION_MS = 60000;
  const MOUSE_MOVE_THROTTLE_MS = 750;
  const MAX_TITLE_LENGTH = 180;

  if (window.__billSyncBrowserActivityRecorderStarted) return;
  window.__billSyncBrowserActivityRecorderStarted = true;

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

  async function backendRequest(path, { method = 'GET', body, queueOnFailure = false, idempotencyKey, timeoutMs } = {}) {
    const response = await sendRuntimeMessage({
      type: 'LB_BACKEND_REQUEST',
      request: { path, method, body, queueOnFailure, idempotencyKey, timeoutMs },
    });
    if (!response?.ok) {
      const error = new Error(response?.error || response?.data?.message || 'Backend request failed');
      error.status = response?.status || 0;
      throw error;
    }
    return response.data;
  }

  function logExtensionEvent(event, detail = {}) {
    sendRuntimeMessage({ type: 'LB_LOG_EVENT', event, detail }).catch(() => {});
  }

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

  function getDomain(url = window.location.href) {
    try {
      return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return '';
    }
  }

  function getTitle() {
    return String(document.title || '').slice(0, MAX_TITLE_LENGTH);
  }

  function appForUrl(url = window.location.href) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host === 'docs.google.com') {
      if (path.startsWith('/document/')) return { appName: 'Google Docs', provider: 'google_workspace', workTool: 'google_docs' };
      if (path.startsWith('/spreadsheets/')) return { appName: 'Google Sheets', provider: 'google_workspace', workTool: 'google_sheets' };
      if (path.startsWith('/presentation/')) return { appName: 'Google Slides', provider: 'google_workspace', workTool: 'google_slides' };
      if (path.startsWith('/forms/')) return { appName: 'Google Forms', provider: 'google_workspace', workTool: 'google_forms' };
    }
    if (host === 'mail.google.com') return { appName: 'Gmail', provider: 'google_workspace', workTool: 'gmail' };
    if (host === 'drive.google.com') return { appName: 'Google Drive', provider: 'google_workspace', workTool: 'pdf_reader' };
    if (host === 'meet.google.com') return { appName: 'Google Meet', provider: 'google_workspace', workTool: 'google_meet' };
    if (host.endsWith('.google.com') || host === 'google.com') return { appName: 'Google Workspace', provider: 'google_workspace', workTool: 'google_chrome' };

    if (host.includes('writer.zoho.')) return { appName: 'Zoho Writer', provider: 'zoho_workspace', workTool: 'google_docs' };
    if (host.includes('sheet.zoho.')) return { appName: 'Zoho Sheet', provider: 'zoho_workspace', workTool: 'google_sheets' };
    if (host.includes('show.zoho.')) return { appName: 'Zoho Show', provider: 'zoho_workspace', workTool: 'google_slides' };
    if (host.includes('mail.zoho.')) return { appName: 'Zoho Mail', provider: 'zoho_workspace', workTool: 'gmail' };
    if (host.includes('workdrive.zoho.')) return { appName: 'Zoho WorkDrive', provider: 'zoho_workspace', workTool: 'pdf_reader' };
    if (host.includes('meeting.zoho.')) return { appName: 'Zoho Meeting', provider: 'zoho_workspace', workTool: 'google_meet' };
    if (host.includes('crm.zoho.')) return { appName: 'Zoho CRM', provider: 'zoho_workspace', workTool: 'google_chrome' };
    if (host.endsWith('.zoho.com') || host.endsWith('.zoho.in')) return { appName: 'Zoho Workspace', provider: 'zoho_workspace', workTool: 'google_chrome' };

    if (host === 'outlook.office.com' || host === 'outlook.live.com') return { appName: 'Outlook Web', provider: 'microsoft_365', workTool: 'gmail' };
    if (host === 'teams.microsoft.com') return { appName: 'Microsoft Teams', provider: 'microsoft_365', workTool: 'microsoft_teams' };
    if (host === 'onedrive.live.com' || host.endsWith('.sharepoint.com')) return { appName: 'OneDrive / SharePoint', provider: 'microsoft_365', workTool: 'pdf_reader' };
    if (host.includes('word-edit.officeapps.live.com') || host.includes('word.office.com')) return { appName: 'Microsoft Word Online', provider: 'microsoft_365', workTool: 'microsoft_word' };
    if (host.includes('excel.office.com') || host.includes('excel.officeapps.live.com')) return { appName: 'Microsoft Excel Online', provider: 'microsoft_365', workTool: 'excel' };
    if (host.includes('powerpoint.office.com') || host.includes('powerpoint.officeapps.live.com')) return { appName: 'Microsoft PowerPoint Online', provider: 'microsoft_365', workTool: 'powerpoint' };
    if (host.endsWith('.office.com') || host.endsWith('.microsoft365.com')) return { appName: 'Microsoft 365', provider: 'microsoft_365', workTool: 'google_chrome' };

    return null;
  }

  const supportedApp = appForUrl();
  if (!supportedApp) return;

  const state = {
    session: null,
    url: window.location.href,
    title: getTitle(),
    app: supportedApp,
    bucket: {
      windowStart: new Date(),
      keyboardCount: 0,
      mouseCount: 0,
      activeSeconds: 0,
      lastInteractionAt: Date.now(),
      lastMouseMoveCountAt: 0,
    },
    appUsageStartedAt: new Date(),
    lastActivityTickAt: Date.now(),
    running: false,
    controlsRoot: null,
    controlsStatus: null,
  };

  function sessionIdFromSession(session) {
    return session?._id || session?.id || '';
  }

  function isRunningSession(session) {
    return Boolean(sessionIdFromSession(session) && String(session.status || '').toLowerCase() === 'running');
  }

  function resetActivityBucket(windowStart = new Date()) {
    state.bucket.windowStart = windowStart;
    state.bucket.keyboardCount = 0;
    state.bucket.mouseCount = 0;
    state.bucket.activeSeconds = 0;
  }

  function markKeyboardActivity() {
    if (!state.running) return;
    state.bucket.keyboardCount += 1;
    state.bucket.lastInteractionAt = Date.now();
  }

  function markMouseActivity() {
    if (!state.running) return;
    state.bucket.mouseCount += 1;
    state.bucket.lastInteractionAt = Date.now();
  }

  function markMouseMoveActivity() {
    const now = Date.now();
    if (now - state.bucket.lastMouseMoveCountAt < MOUSE_MOVE_THROTTLE_MS) return;
    state.bucket.lastMouseMoveCountAt = now;
    markMouseActivity();
  }

  async function refreshSession({ force = false } = {}) {
    const urlSessionId = getUrlParamFromSearchOrHash('lb_work_session_id');
    if (urlSessionId && (!state.session || sessionIdFromSession(state.session) !== urlSessionId)) {
      state.session = { id: urlSessionId, status: 'running' };
      state.running = true;
      return state.session;
    }

    try {
      const response = await sendRuntimeMessage({ type: 'LB_CURRENT_WORK_SESSION', force });
      if (response?.ok) {
        state.session = response.data || null;
        state.running = isRunningSession(state.session);
        renderControls();
      }
    } catch (err) {
      logExtensionEvent('browser_activity_session_refresh_failed', { error: err.message || 'Session refresh failed' });
    }
    return state.session;
  }

  async function runSessionCommand(action) {
    const sessionId = sessionIdFromSession(state.session);
    if (!sessionId) return;
    const body = action === 'stop'
      ? {
          endedAt: new Date().toISOString(),
          finalNarrative: state.session?.narrative || state.session?.activityType || 'Focused legal work',
          createTimeEntry: true,
          submitTimeEntry: true,
        }
      : action === 'pause'
        ? { reason: 'Paused from Chrome extension' }
        : {};
    if (state.controlsStatus) state.controlsStatus.textContent = action === 'stop' ? 'Saving...' : 'Updating...';
    await flushActivitySample();
    await flushAppUsage();
    try {
      const response = await sendRuntimeMessage({
        type: 'LB_WORK_SESSION_COMMAND',
        workSessionId: sessionId,
        action,
        body,
      });
      if (!response?.ok) throw new Error(response?.error || 'Command failed');
      await refreshSession({ force: true });
      if (state.controlsStatus) state.controlsStatus.textContent = action === 'stop' ? 'Submitted' : 'Ready';
    } catch (err) {
      if (state.controlsStatus) state.controlsStatus.textContent = 'Could not update';
      logExtensionEvent('browser_activity_command_failed', { action, workSessionId: sessionId, error: err.message || 'Command failed' });
    }
  }

  function renderControls() {
    const sessionId = sessionIdFromSession(state.session);
    const status = String(state.session?.status || '').toLowerCase();
    const shouldShow = Boolean(sessionId && ['running', 'paused'].includes(status));
    if (!shouldShow) {
      state.controlsRoot?.remove();
      state.controlsRoot = null;
      state.controlsStatus = null;
      return;
    }
    if (!state.controlsRoot) {
      const root = document.createElement('div');
      root.id = 'billsync-work-meter-controls';
      root.style.cssText = [
        'position:fixed',
        'right:18px',
        'bottom:18px',
        'z-index:2147483647',
        'display:flex',
        'align-items:center',
        'gap:8px',
        'padding:10px 12px',
        'border-radius:10px',
        'background:#0b3f6d',
        'color:#fff',
        'box-shadow:0 14px 40px rgba(0,0,0,.22)',
        'font:600 13px/1.2 Inter,Arial,sans-serif',
      ].join(';');
      document.documentElement.appendChild(root);
      state.controlsRoot = root;
    }

    const action = status === 'paused' ? 'resume' : 'pause';
    state.controlsRoot.innerHTML = `
      <span style="max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(state.app.appName)}</span>
      <span data-lb-status style="opacity:.82;font-size:12px;">${status}</span>
      <button data-lb-action="${action}" type="button" style="${controlButtonStyle()}">${status === 'paused' ? 'Resume' : 'Pause'}</button>
      <button data-lb-action="stop" type="button" style="${controlButtonStyle('#ffffff', '#0b3f6d')}">Save & submit</button>
    `;
    state.controlsStatus = state.controlsRoot.querySelector('[data-lb-status]');
    state.controlsRoot.querySelectorAll('[data-lb-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        runSessionCommand(button.getAttribute('data-lb-action'));
      });
    });
  }

  function controlButtonStyle(background = 'rgba(255,255,255,.14)', color = '#ffffff') {
    return [
      'border:1px solid rgba(255,255,255,.35)',
      `background:${background}`,
      `color:${color}`,
      'border-radius:8px',
      'padding:7px 9px',
      'font:700 12px/1 Inter,Arial,sans-serif',
      'cursor:pointer',
    ].join(';');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function flushActivitySample() {
    const sessionId = sessionIdFromSession(state.session);
    if (!state.running || !sessionId) return;

    const windowEnd = new Date();
    const sampleSeconds = Math.max(1, Math.round((windowEnd.getTime() - new Date(state.bucket.windowStart).getTime()) / 1000));
    if (sampleSeconds < 2 && !state.bucket.keyboardCount && !state.bucket.mouseCount && !state.bucket.activeSeconds) return;
    const activeSeconds = Math.min(state.bucket.activeSeconds, sampleSeconds);
    const body = {
      windowStart: new Date(state.bucket.windowStart).toISOString(),
      windowEnd: windowEnd.toISOString(),
      sampleSeconds,
      activeSeconds,
      inactiveSeconds: Math.max(sampleSeconds - activeSeconds, 0),
      keyboardCount: state.bucket.keyboardCount,
      mouseCount: state.bucket.mouseCount,
      sourceDevice: 'chrome_extension',
      sourceApp: 'chrome_extension',
    };
    resetActivityBucket(windowEnd);
    try {
      await backendRequest(`/api/activity-samples/work-sessions/${encodeURIComponent(sessionId)}/samples`, {
        method: 'POST',
        body,
        queueOnFailure: true,
        idempotencyKey: `activity-sample:chrome-extension:${sessionId}:${body.windowStart}`,
      });
    } catch (err) {
      logExtensionEvent('browser_activity_sample_failed', { workSessionId: sessionId, appName: state.app.appName, error: err.message || 'Sample failed' });
    }
  }

  async function flushAppUsage() {
    const sessionId = sessionIdFromSession(state.session);
    if (!state.running || !sessionId) return;

    const endedAt = new Date();
    const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - new Date(state.appUsageStartedAt).getTime()) / 1000));
    if (durationSeconds < 2) return;
    const body = {
      appName: state.app.appName,
      url: state.url,
      domain: getDomain(state.url),
      title: state.title,
      startedAt: new Date(state.appUsageStartedAt).toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds,
      platform: 'web',
      sourceApp: 'chrome_extension',
    };
    state.appUsageStartedAt = endedAt;
    try {
      await backendRequest(`/api/app-usage-events/work-sessions/${encodeURIComponent(sessionId)}/events`, {
        method: 'POST',
        body,
        queueOnFailure: true,
        idempotencyKey: `app-usage:chrome-extension:${sessionId}:${body.startedAt}:${body.domain}`,
      });
    } catch (err) {
      logExtensionEvent('browser_app_usage_failed', { workSessionId: sessionId, appName: state.app.appName, error: err.message || 'App usage failed' });
    }
  }

  async function sendHeartbeat(signal = 'active') {
    const sessionId = sessionIdFromSession(state.session);
    if (!state.running || !sessionId) return;
    try {
      await backendRequest(`/api/work-sessions/${encodeURIComponent(sessionId)}/heartbeat`, {
        method: 'POST',
        body: {
          at: new Date().toISOString(),
          active: document.visibilityState === 'visible',
          url: state.url,
          title: state.title,
          inactiveSeconds: Math.max(0, Math.round((Date.now() - state.bucket.lastInteractionAt) / 1000)),
          activitySignal: signal,
        },
        queueOnFailure: false,
        timeoutMs: 10000,
      });
    } catch (err) {
      logExtensionEvent('browser_activity_heartbeat_failed', { workSessionId: sessionId, error: err.message || 'Heartbeat failed' });
    }
  }

  function updatePageContext() {
    const nextUrl = window.location.href;
    const nextApp = appForUrl(nextUrl) || state.app;
    if (nextUrl !== state.url || nextApp.appName !== state.app.appName) {
      flushAppUsage();
      state.url = nextUrl;
      state.app = nextApp;
      state.appUsageStartedAt = new Date();
    }
    state.title = getTitle();
  }

  document.addEventListener('keydown', markKeyboardActivity, true);
  document.addEventListener('pointerdown', markMouseActivity, true);
  document.addEventListener('pointermove', markMouseMoveActivity, true);
  document.addEventListener('wheel', markMouseActivity, { passive: true, capture: true });
  window.addEventListener('focus', () => {
    state.bucket.lastInteractionAt = Date.now();
    sendHeartbeat('focus');
  });
  window.addEventListener('blur', () => {
    flushActivitySample();
    flushAppUsage();
    sendHeartbeat('blur');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushActivitySample();
      flushAppUsage();
      sendHeartbeat('hidden');
    } else {
      state.bucket.lastInteractionAt = Date.now();
      sendHeartbeat('visible');
    }
  });
  window.addEventListener('beforeunload', () => {
    flushActivitySample();
    flushAppUsage();
  });

  setInterval(() => {
    const now = Date.now();
    const elapsedSeconds = Math.max(1, Math.round((now - state.lastActivityTickAt) / 1000));
    state.lastActivityTickAt = now;
    if (state.running && document.visibilityState === 'visible' && now - state.bucket.lastInteractionAt <= ACTIVE_INTERACTION_MS) {
      state.bucket.activeSeconds += elapsedSeconds;
    }
    updatePageContext();
  }, 1000);

  setInterval(() => refreshSession().catch(() => {}), SESSION_REFRESH_MS);
  setInterval(flushActivitySample, SAMPLE_FLUSH_MS);
  setInterval(flushAppUsage, APP_USAGE_FLUSH_MS);
  setInterval(() => sendHeartbeat('active'), HEARTBEAT_MS);

  refreshSession({ force: true }).then(() => {
    logExtensionEvent('browser_activity_recorder_started', {
      appName: state.app.appName,
      provider: state.app.provider,
      domain: getDomain(),
      workSessionId: sessionIdFromSession(state.session),
    });
  });
})();
