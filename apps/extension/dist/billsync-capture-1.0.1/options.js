const userEmailInput = document.getElementById('user-email');
const backendBaseUrlInput = document.getElementById('backend-base-url');
const frontendAppUrlInput = document.getElementById('frontend-app-url');
const authTokenInput = document.getElementById('auth-token');
const featureResearchCaptureInput = document.getElementById('feature-research-capture');
const featureAutoConvertInput = document.getElementById('feature-auto-convert');
const featureAIDraftingInput = document.getElementById('feature-ai-drafting');
const statusEl = document.getElementById('status');
const authStatusEl = document.getElementById('auth-status');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const loginBtn = document.getElementById('login-btn');
const checkAuthBtn = document.getElementById('check-auth-btn');

const DEFAULT_FRONTEND_APP = 'https://bill-bot-legal.vercel.app';

const EXTENSION_STORAGE_KEYS = [
  'userEmail',
  'backendBaseUrl',
  'frontendAppUrl',
  'authToken',
  'featureResearchCapture',
  'featureAutoConvert',
  'featureAIDrafting',
];

function hasChromeSyncStorage() {
  return typeof chrome !== 'undefined' &&
    !!chrome.storage &&
    !!chrome.storage.sync;
}

function isExtensionPage() {
  return window.location.protocol === 'chrome-extension:';
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b42318' : '#127a47';
}

function normalizeInput(value) {
  return String(value || '').trim();
}

function getLocalSettings() {
  return {
    userEmail: localStorage.getItem('userEmail') || '',
    backendBaseUrl: localStorage.getItem('backendBaseUrl') || '',
    frontendAppUrl: localStorage.getItem('frontendAppUrl') || DEFAULT_FRONTEND_APP,
    authToken: localStorage.getItem('authToken') || '',
    featureResearchCapture: localStorage.getItem('featureResearchCapture') !== 'false',
    featureAutoConvert: localStorage.getItem('featureAutoConvert') !== 'false',
    featureAIDrafting: localStorage.getItem('featureAIDrafting') !== 'false',
  };
}

function setLocalSettings(values) {
  if ('userEmail' in values) {
    if (values.userEmail) localStorage.setItem('userEmail', values.userEmail);
    else localStorage.removeItem('userEmail');
  }
  if ('backendBaseUrl' in values) {
    if (values.backendBaseUrl) localStorage.setItem('backendBaseUrl', values.backendBaseUrl);
    else localStorage.removeItem('backendBaseUrl');
  }
  if ('frontendAppUrl' in values) {
    if (values.frontendAppUrl) localStorage.setItem('frontendAppUrl', values.frontendAppUrl);
    else localStorage.removeItem('frontendAppUrl');
  }
  if ('authToken' in values) {
    if (values.authToken) localStorage.setItem('authToken', values.authToken);
    else localStorage.removeItem('authToken');
  }
  ['featureResearchCapture', 'featureAutoConvert', 'featureAIDrafting'].forEach((key) => {
    if (key in values) localStorage.setItem(key, values[key] ? 'true' : 'false');
  });
}

function removeLocalSettings(keys) {
  keys.forEach((key) => localStorage.removeItem(key));
}

function storageGet(keys, callback) {
  if (hasChromeSyncStorage()) {
    chrome.storage.sync.get(keys, (values) => callback(values || {}));
    return;
  }
  const localValues = getLocalSettings();
  const result = {};
  keys.forEach((key) => { result[key] = localValues[key]; });
  callback(result);
}

function storageSet(values, callback) {
  if (hasChromeSyncStorage()) {
    chrome.storage.sync.set(values, callback);
    return;
  }
  setLocalSettings(values);
  callback?.();
}

function storageRemove(keys, callback) {
  if (hasChromeSyncStorage()) {
    chrome.storage.sync.remove(keys, callback);
    return;
  }
  removeLocalSettings(keys);
  callback?.();
}

function getRuntimeError() {
  if (typeof chrome === 'undefined' || !chrome.runtime) return null;
  return chrome.runtime.lastError || null;
}

function loadSettings() {
  storageGet(EXTENSION_STORAGE_KEYS, (values) => {
    userEmailInput.value = values.userEmail || '';
    backendBaseUrlInput.value = values.backendBaseUrl || '';
    frontendAppUrlInput.value = values.frontendAppUrl || DEFAULT_FRONTEND_APP;
    authTokenInput.value = values.authToken || '';
    featureResearchCaptureInput.checked = values.featureResearchCapture !== false;
    featureAutoConvertInput.checked = values.featureAutoConvert !== false;
    featureAIDraftingInput.checked = values.featureAIDrafting !== false;

    if (!hasChromeSyncStorage()) {
      setStatus(
        isExtensionPage()
          ? 'Chrome sync storage is unavailable in this context.'
          : 'Preview mode: using localStorage because this page is not running as an installed extension.',
        false
      );
    }
  });
}

function saveSettings() {
  const userEmail = normalizeInput(userEmailInput.value).toLowerCase();
  const backendBaseUrl = normalizeInput(backendBaseUrlInput.value);
  const frontendAppUrl = normalizeInput(frontendAppUrlInput.value);
  const authToken = normalizeInput(authTokenInput.value);
  const featureResearchCapture = featureResearchCaptureInput.checked;
  const featureAutoConvert = featureAutoConvertInput.checked;
  const featureAIDrafting = featureAIDraftingInput.checked;

  if (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    setStatus('Enter a valid email address.', true);
    return;
  }

  if (backendBaseUrl) {
    try {
      new URL(backendBaseUrl);
    } catch {
      setStatus('Enter a valid backend URL.', true);
      return;
    }
  }

  if (frontendAppUrl) {
    try {
      new URL(frontendAppUrl);
    } catch {
      setStatus('Enter a valid frontend app URL.', true);
      return;
    }
  }

  const payload = {
    userEmail,
    backendBaseUrl,
    frontendAppUrl,
    authToken,
    featureResearchCapture,
    featureAutoConvert,
    featureAIDrafting,
  };

  storageSet(payload, () => {
    const runtimeError = getRuntimeError();
    if (runtimeError) {
      setStatus(runtimeError.message || 'Could not save settings.', true);
      return;
    }
    setStatus(
      hasChromeSyncStorage()
        ? 'Settings saved.'
        : 'Preview mode: settings saved to localStorage only.'
    );
  });
}

function resetBackend() {
  backendBaseUrlInput.value = '';
  storageRemove(['backendBaseUrl'], () => {
    const runtimeError = getRuntimeError();
    if (runtimeError) {
      setStatus(runtimeError.message || 'Could not reset backend.', true);
      return;
    }
    setStatus(
      hasChromeSyncStorage()
        ? 'Backend reset to default.'
        : 'Preview mode: backend reset in localStorage.'
    );
  });
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve({ ok: false, error: 'Chrome runtime is unavailable in preview mode.' });
      return;
    }
    chrome.runtime.sendMessage(message, (response) => {
      const runtimeError = getRuntimeError();
      if (runtimeError) {
        resolve({ ok: false, error: runtimeError.message || 'Extension runtime error.' });
        return;
      }
      resolve(response || { ok: false, error: 'No response from extension runtime.' });
    });
  });
}

async function openBackendLogin() {
  authStatusEl.textContent = 'Opening login...';
  authStatusEl.style.color = '#5d6780';
  const response = await sendRuntimeMessage({ type: 'LB_OPEN_LOGIN' });
  if (!response.ok) {
    authStatusEl.textContent = response.error || 'Could not open backend login.';
    authStatusEl.style.color = '#b42318';
    if (!hasChromeSyncStorage()) {
      window.open(`${normalizeInput(frontendAppUrlInput.value) || DEFAULT_FRONTEND_APP}/login?source=chrome-extension`, '_blank');
    }
    return;
  }
  authStatusEl.textContent = 'Login opened. After signing in, click Check Session.';
  authStatusEl.style.color = '#127a47';
}

async function checkBackendSession() {
  authStatusEl.textContent = 'Checking session...';
  authStatusEl.style.color = '#5d6780';
  const response = await sendRuntimeMessage({ type: 'LB_CHECK_AUTH' });
  if (!response.ok) {
    authStatusEl.textContent = response.status === 401
      ? 'Not linked. Sign in to the backend, then check again.'
      : response.error || 'Session check failed.';
    authStatusEl.style.color = '#b42318';
    return;
  }

  const user = response.data?.user;
  if (user?.email) {
    userEmailInput.value = String(user.email).toLowerCase();
    storageSet({ userEmail: userEmailInput.value }, () => {});
  }
  authStatusEl.textContent = user?.email
    ? `Linked as ${user.email}.`
    : 'Backend session linked.';
  authStatusEl.style.color = '#127a47';
}

saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetBackend);
loginBtn.addEventListener('click', openBackendLogin);
checkAuthBtn.addEventListener('click', checkBackendSession);
loadSettings();
