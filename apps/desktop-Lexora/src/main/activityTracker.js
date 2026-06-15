import {
  ACTIVE_GRACE_MS,
  APP_USAGE_FLUSH_MS,
  DEFAULT_IDLE_AFTER_SECONDS,
  FLUSH_SAMPLE_MS,
  HEARTBEAT_MS,
} from './config.js';

function now() {
  return new Date();
}

function iso(date) {
  return new Date(date).toISOString();
}

function idOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

function cleanTitle(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

function platformName() {
  if (process.platform === 'win32') return 'desktop_windows';
  if (process.platform === 'darwin') return 'desktop_macos';
  if (process.platform === 'linux') return 'desktop_linux';
  return 'unknown';
}

export class ActivityTracker {
  constructor({ queue, client, emitState }) {
    this.queue = queue;
    this.client = client;
    this.emitState = emitState;
    this.session = null;
    this.keyboardCount = 0;
    this.mouseCount = 0;
    this.activeSeconds = 0;
    this.lastInputAt = Date.now();
    this.lastSecondAt = Date.now();
    this.sampleWindowStart = now();
    this.currentWindow = null;
    this.currentWindowStartedAt = now();
    this.lastIdleDetectAt = 0;
    this.timers = [];
    this.nativeStatus = { input: 'not_started', activeWindow: 'not_started' };
  }

  async start() {
    this.startInputHooks();
    this.timers.push(setInterval(() => this.tickSecond(), 1000));
    this.timers.push(setInterval(() => this.flushSample(), FLUSH_SAMPLE_MS));
    this.timers.push(setInterval(() => this.flushAppUsage(false), APP_USAGE_FLUSH_MS));
    this.timers.push(setInterval(() => this.sendHeartbeat(), HEARTBEAT_MS));
    this.timers.push(setInterval(() => this.queue.process(), 15000));
    this.timers.push(setInterval(() => this.refreshActiveWindow(), 5000));
    await this.refreshActiveWindow();
  }

  stop() {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers = [];
    this.stopInputHooks();
  }

  setSession(session) {
    const nextId = idOf(session);
    const currentId = idOf(this.session);
    if (currentId && currentId !== nextId) {
      this.flushSample();
      this.flushAppUsage(true);
      this.resetBuckets();
    }
    this.session = session || null;
    if (!this.session) this.resetBuckets();
    this.emitState?.();
  }

  resetBuckets() {
    this.keyboardCount = 0;
    this.mouseCount = 0;
    this.activeSeconds = 0;
    this.sampleWindowStart = now();
    this.currentWindowStartedAt = now();
  }

  startInputHooks() {
    import('uiohook-napi')
      .then((mod) => {
        const hook = mod.uIOhook || mod.default?.uIOhook || mod.default || mod;
        this.inputHook = hook;
        hook.on('keydown', () => this.markKeyboard());
        hook.on('mousedown', () => this.markMouse());
        hook.on('mouseup', () => this.markMouse());
        hook.on('wheel', () => this.markMouse());
        hook.on('mousemove', () => this.markMouseMove());
        hook.start();
        this.nativeStatus.input = 'running';
        this.emitState?.();
      })
      .catch((error) => {
        this.nativeStatus.input = `unavailable: ${error.message}`;
        this.emitState?.();
      });
  }

  stopInputHooks() {
    try {
      this.inputHook?.stop?.();
    } catch {
      // Native hook shutdown should not block app close.
    }
  }

  markKeyboard() {
    if (!this.isTracking()) return;
    this.keyboardCount += 1;
    this.lastInputAt = Date.now();
    this.emitState?.();
  }

  markMouse() {
    if (!this.isTracking()) return;
    this.mouseCount += 1;
    this.lastInputAt = Date.now();
    this.emitState?.();
  }

  markMouseMove() {
    const at = Date.now();
    if (at - (this.lastMouseMoveAt || 0) < 750) return;
    this.lastMouseMoveAt = at;
    this.markMouse();
  }

  isTracking() {
    return Boolean(this.session && this.session.status === 'running');
  }

  tickSecond() {
    if (!this.isTracking()) return;
    const current = Date.now();
    const elapsed = Math.max(1, Math.round((current - this.lastSecondAt) / 1000));
    this.lastSecondAt = current;
    if (current - this.lastInputAt <= ACTIVE_GRACE_MS) this.activeSeconds += elapsed;
    this.detectIdleIfNeeded();
    this.emitState?.();
  }

  async refreshActiveWindow() {
    try {
      const mod = await import('active-win');
      const activeWin = mod.default || mod.activeWindow || mod;
      const info = typeof activeWin === 'function' ? await activeWin() : await activeWin.getActiveWindow?.();
      const next = {
        appName: info?.owner?.name || info?.owner?.path || 'Unknown app',
        title: cleanTitle(info?.title),
      };
      this.nativeStatus.activeWindow = 'running';
      if (!this.currentWindow) {
        this.currentWindow = next;
        this.currentWindowStartedAt = now();
      } else if (this.currentWindow.appName !== next.appName || this.currentWindow.title !== next.title) {
        await this.flushAppUsage(true);
        this.currentWindow = next;
        this.currentWindowStartedAt = now();
      }
      this.emitState?.();
    } catch (error) {
      this.nativeStatus.activeWindow = `unavailable: ${error.message}`;
      this.emitState?.();
    }
  }

  async flushSample() {
    if (!this.session) {
      this.resetBuckets();
      return;
    }
    if (this.session.status !== 'running') {
      this.resetBuckets();
      return;
    }
    const windowEnd = now();
    const sampleSeconds = Math.max(1, Math.round((windowEnd.getTime() - this.sampleWindowStart.getTime()) / 1000));
    if (sampleSeconds < 2 && !this.keyboardCount && !this.mouseCount && !this.activeSeconds) return;
    const activeSeconds = Math.min(this.activeSeconds, sampleSeconds);
    const body = {
      windowStart: iso(this.sampleWindowStart),
      windowEnd: iso(windowEnd),
      sampleSeconds,
      activeSeconds,
      inactiveSeconds: Math.max(sampleSeconds - activeSeconds, 0),
      keyboardCount: this.keyboardCount,
      mouseCount: this.mouseCount,
      sourceDevice: 'desktop',
      sourceApp: 'desktop_agent',
    };
    this.sampleWindowStart = windowEnd;
    this.keyboardCount = 0;
    this.mouseCount = 0;
    this.activeSeconds = 0;
    await this.queue.sendOrQueue({
      type: 'activitySample',
      workSessionId: idOf(this.session),
      key: `activitySample:${idOf(this.session)}:${body.windowStart}`,
      body,
    });
    this.emitState?.();
  }

  async flushAppUsage(force) {
    if (!this.session || this.session.status !== 'running' || !this.currentWindow) return;
    const endedAt = now();
    const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - this.currentWindowStartedAt.getTime()) / 1000));
    if (!force && durationSeconds < 2) return;
    const body = {
      appName: String(this.currentWindow.appName || 'Unknown app').slice(0, 120),
      title: cleanTitle(this.currentWindow.title),
      startedAt: iso(this.currentWindowStartedAt),
      endedAt: iso(endedAt),
      durationSeconds,
      platform: platformName(),
      sourceApp: 'desktop_agent',
    };
    this.currentWindowStartedAt = endedAt;
    await this.queue.sendOrQueue({
      type: 'appUsageEvent',
      workSessionId: idOf(this.session),
      key: `appUsageEvent:${idOf(this.session)}:${body.startedAt}:${body.appName}:${body.title}`,
      body,
    });
    this.emitState?.();
  }

  async sendHeartbeat() {
    if (!this.session || !['running', 'paused'].includes(this.session.status)) return;
    await this.queue.sendOrQueue({
      type: 'heartbeat',
      workSessionId: idOf(this.session),
      key: `heartbeat:${idOf(this.session)}:${Date.now()}`,
      body: {
        at: now().toISOString(),
        active: this.session.status === 'running' && Date.now() - this.lastInputAt <= ACTIVE_GRACE_MS,
        inactiveSeconds: Math.max(0, Math.round((Date.now() - this.lastInputAt) / 1000)),
        activitySignal: 'desktop_agent',
      },
    });
    this.emitState?.();
  }

  async detectIdleIfNeeded() {
    if (!this.session || this.session.status !== 'running') return;
    const threshold = Number(this.session.webMeter?.idleAfterSeconds || DEFAULT_IDLE_AFTER_SECONDS);
    const inactiveSeconds = Math.round((Date.now() - this.lastInputAt) / 1000);
    if (inactiveSeconds < threshold) return;
    if (Date.now() - this.lastIdleDetectAt < threshold * 1000) return;
    this.lastIdleDetectAt = Date.now();
    await this.queue.sendOrQueue({
      type: 'detectIdle',
      workSessionId: idOf(this.session),
      key: `detectIdle:${idOf(this.session)}:${this.lastIdleDetectAt}`,
      body: {
        observedAt: now().toISOString(),
        source: 'return_prompt',
      },
    });
  }

  snapshot() {
    const sampleSeconds = Math.max(1, Math.round((Date.now() - this.sampleWindowStart.getTime()) / 1000));
    return {
      session: this.session,
      live: {
        keyboardCount: this.keyboardCount,
        mouseCount: this.mouseCount,
        activeSeconds: this.activeSeconds,
        sampleSeconds,
        activityPercent: Math.round((Math.min(this.activeSeconds, sampleSeconds) / sampleSeconds) * 100),
        inactiveSeconds: Math.max(0, Math.round((Date.now() - this.lastInputAt) / 1000)),
      },
      currentWindow: this.currentWindow,
      nativeStatus: this.nativeStatus,
      queue: this.queue.status(),
    };
  }
}
