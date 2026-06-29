import { afterEach, describe, expect, test } from 'vitest';
import { buildZohoAuthUrl, decodeZohoState, validateZohoConfig } from '../modules/integrations/services/zohoAuthService.js';

const ZOHO_ENV_KEYS = [
  'API_BASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
  'ZOHO_ACCOUNTS_SERVER',
  'ZOHO_CLIENT_ID',
  'ZOHO_CLIENT_SECRET',
  'ZOHO_REDIRECT_URI',
  'ZOHO_SCOPES',
];

const originalEnv = Object.fromEntries(ZOHO_ENV_KEYS.map((key) => [key, process.env[key]]));

function restoreZohoEnv() {
  for (const key of ZOHO_ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
}

function setValidZohoEnv() {
  process.env.JWT_SECRET = 'test-secret';
  process.env.ZOHO_CLIENT_ID = 'client-id';
  process.env.ZOHO_CLIENT_SECRET = 'client-secret';
  process.env.ZOHO_ACCOUNTS_SERVER = 'https://accounts.zoho.in';
  process.env.ZOHO_REDIRECT_URI = 'https://billsync-legal.onrender.com/api/integrations/zoho/callback';
}

afterEach(() => {
  restoreZohoEnv();
});

describe('Zoho OAuth configuration', () => {
  test('rejects malformed redirect URI before building auth URL', () => {
    setValidZohoEnv();
    process.env.ZOHO_REDIRECT_URI = 'https://legalbillind-backend.onrender.com/callbahttps://accounts.zoho.inck';

    expect(() => validateZohoConfig()).toThrow(/ZOHO_REDIRECT_URI/);
  });

  test('builds auth URL with the configured production callback', () => {
    setValidZohoEnv();

    const url = new URL(buildZohoAuthUrl('64b0000000000000000000aa', '64b0000000000000000000bb'));

    expect(url.origin).toBe('https://accounts.zoho.in');
    expect(url.searchParams.get('redirect_uri')).toBe('https://billsync-legal.onrender.com/api/integrations/zoho/callback');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(decodeZohoState(url.searchParams.get('state'))).toMatchObject({
      userId: '64b0000000000000000000aa',
      workspaceId: '64b0000000000000000000bb',
    });
  });
});
