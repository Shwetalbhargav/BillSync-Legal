import { safeStorage } from 'electron';

const SESSION_KEY = 'authSession';

export function readAuthSession(store) {
  const saved = store.get(SESSION_KEY);
  if (!saved?.token) return null;
  if (saved.encrypted && safeStorage.isEncryptionAvailable()) {
    try {
      return {
        ...saved,
        token: safeStorage.decryptString(Buffer.from(saved.token, 'base64')),
      };
    } catch {
      store.delete(SESSION_KEY);
      return null;
    }
  }
  return saved;
}

export function writeAuthSession(store, session) {
  if (!session?.token) {
    store.delete(SESSION_KEY);
    return;
  }
  const encrypted = safeStorage.isEncryptionAvailable();
  const token = encrypted
    ? safeStorage.encryptString(session.token).toString('base64')
    : session.token;
  store.set(SESSION_KEY, {
    ...session,
    token,
    encrypted,
    savedAt: new Date().toISOString(),
  });
}

export function clearAuthSession(store) {
  store.delete(SESSION_KEY);
}
