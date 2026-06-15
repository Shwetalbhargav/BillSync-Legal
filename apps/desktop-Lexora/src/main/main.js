import { app, BrowserWindow, ipcMain, Menu, nativeImage, shell, Tray } from 'electron';
import Store from 'electron-store';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BackendClient } from './backendClient.js';
import { DEFAULT_BACKEND_URL, DEFAULT_WEB_APP_URL, POLL_SESSION_MS } from './config.js';
import { clearAuthSession, readAuthSession, writeAuthSession } from './secureSession.js';
import { SyncQueue } from './syncQueue.js';
import { ActivityTracker } from './activityTracker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const store = new Store({
  name: 'lexora-desktop-agent',
  defaults: {
    backendBaseUrl: DEFAULT_BACKEND_URL,
    webAppUrl: DEFAULT_WEB_APP_URL,
  },
});

let mainWindow;
let tray;
let authSession = readAuthSession(store);
let currentUser = authSession?.user || null;
let pollTimer;

const client = new BackendClient({
  getBaseUrl: () => store.get('backendBaseUrl') || DEFAULT_BACKEND_URL,
  getToken: () => authSession?.token || '',
});
const queue = new SyncQueue(store, client);
const tracker = new ActivityTracker({ queue, client, emitState: broadcastState });

function idOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

function normalizeSessionPayload(payload) {
  const session = payload?.data?.data || payload?.data || payload || null;
  if (!session) return null;
  if (!idOf(session)) return null;
  return {
    ...session,
    id: idOf(session),
    status: session.status || 'running',
    clientName: session.clientId?.displayName || session.clientId?.name || '',
    matterName: session.caseId?.title || session.caseId?.name || '',
    taskName: session.taskId?.title || '',
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 860,
    minHeight: 600,
    title: 'Lexora Desktop Agent',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAVklEQVR4nGNkYGD4z0AEYBxVSFUBM2fO/M9AkiJILQaIzUiK4f///z8DqYCJgYGB4T8Dw38GugQpA6UBqE5SNTBqgFQbkgZIDYyaIDUCqQZIDQAAVeMKHfDHAGYAAAAASUVORK5CYII=');
  tray = new Tray(icon);
  updateTray();
}

function currentTrackingLabel() {
  if (!authSession) return 'Signed out';
  const session = tracker.snapshot().session;
  if (!session) return 'No active work session';
  if (session.status === 'paused') return 'Paused';
  if (session.status === 'running') return queue.status().pending ? 'Tracking - sync pending' : 'Tracking';
  return 'No active work session';
}

function updateTray() {
  if (!tray) return;
  tray.setToolTip(`Lexora Desktop Agent - ${currentTrackingLabel()}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: currentTrackingLabel(), enabled: false },
    { type: 'separator' },
    { label: 'Open Agent', click: () => showWindow() },
    { label: 'Open Web Work Meter', click: () => shell.openExternal(store.get('webAppUrl') || DEFAULT_WEB_APP_URL) },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]));
}

function showWindow() {
  if (!mainWindow) createWindow();
  mainWindow.show();
  mainWindow.focus();
}

function buildState(extra = {}) {
  return {
    signedIn: Boolean(authSession?.token),
    user: currentUser,
    backendBaseUrl: store.get('backendBaseUrl') || DEFAULT_BACKEND_URL,
    webAppUrl: store.get('webAppUrl') || DEFAULT_WEB_APP_URL,
    ...tracker.snapshot(),
    ...extra,
  };
}

function broadcastState(extra = {}) {
  const state = buildState(extra);
  updateTray();
  mainWindow?.webContents?.send('agent:state', state);
  return state;
}

async function refreshUser() {
  if (!authSession?.token) return null;
  const response = await client.me();
  currentUser = response.user || response.data?.user || null;
  if (currentUser) {
    authSession = { ...authSession, user: currentUser };
    writeAuthSession(store, authSession);
  }
  return currentUser;
}

async function pollCurrentSession() {
  if (!authSession?.token) {
    tracker.setSession(null);
    return;
  }
  try {
    const response = await client.currentSession();
    tracker.setSession(normalizeSessionPayload(response));
    broadcastState({ online: true, lastPollAt: new Date().toISOString(), lastError: '' });
  } catch (error) {
    if (error.status === 401) {
      clearAuthSession(store);
      authSession = null;
      currentUser = null;
      tracker.setSession(null);
    }
    broadcastState({ online: false, lastError: error.message || 'Could not load current session' });
  }
}

function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(pollCurrentSession, POLL_SESSION_MS);
  pollCurrentSession();
}

ipcMain.handle('agent:get-state', () => buildState());

ipcMain.handle('agent:update-settings', async (_event, settings) => {
  if (settings?.backendBaseUrl) store.set('backendBaseUrl', String(settings.backendBaseUrl).replace(/\/+$/, ''));
  if (settings?.webAppUrl) store.set('webAppUrl', String(settings.webAppUrl));
  await pollCurrentSession();
  return broadcastState();
});

ipcMain.handle('agent:login', async (_event, credentials) => {
  const response = await client.desktopLogin(credentials);
  authSession = {
    token: response.token,
    tokenType: response.tokenType || 'Bearer',
    user: response.user,
    loggedInAt: new Date().toISOString(),
  };
  currentUser = response.user;
  writeAuthSession(store, authSession);
  await refreshUser().catch(() => currentUser);
  startPolling();
  return broadcastState({ lastError: '' });
});

ipcMain.handle('agent:logout', async () => {
  clearAuthSession(store);
  queue.clear();
  authSession = null;
  currentUser = null;
  tracker.setSession(null);
  return broadcastState({ lastError: '' });
});

ipcMain.handle('agent:retry-sync', async () => {
  await queue.process({ force: true });
  return broadcastState();
});

ipcMain.handle('agent:open-web-meter', async () => {
  await shell.openExternal(store.get('webAppUrl') || DEFAULT_WEB_APP_URL);
  return true;
});

app.whenReady().then(async () => {
  createWindow();
  try {
    createTray();
  } catch {
    tray = null;
  }
  await tracker.start();
  if (authSession?.token) {
    await refreshUser().catch(() => null);
    startPolling();
  }
  broadcastState();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', async () => {
  clearInterval(pollTimer);
  await tracker.flushSample();
  await tracker.flushAppUsage(true);
  tracker.stop();
});

app.on('window-all-closed', () => {
  mainWindow = null;
});
