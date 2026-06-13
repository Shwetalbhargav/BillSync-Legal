import { createServer } from 'node:http';
import { beforeAll, afterAll, beforeEach, expect, test, vi } from 'vitest';
import { AUTH_COOKIE_NAME, signAuthToken } from '../modules/auth/services/authTokenService.js';

const mocks = vi.hoisted(() => ({
  appUsageCreate: vi.fn(),
  appUsageFind: vi.fn(),
  workSessionFindById: vi.fn(),
}));

vi.mock('../modules/appUsageEvents/models/AppUsageEvent.js', () => ({
  AppUsageEvent: {
    create: mocks.appUsageCreate,
    find: mocks.appUsageFind,
  },
  default: {
    create: mocks.appUsageCreate,
    find: mocks.appUsageFind,
  },
}));

vi.mock('../modules/workSessions/models/WorkSession.js', () => ({
  WorkSession: {
    findById: mocks.workSessionFindById,
  },
  default: {
    findById: mocks.workSessionFindById,
  },
}));

const { default: app } = await import('../app.js');

const USER_ID = '64b000000000000000000024';
const OTHER_USER_ID = '64b000000000000000000025';
const CLIENT_ID = '64b000000000000000000023';
const CASE_ID = '64b000000000000000000022';
const SESSION_ID = '64b000000000000000000029';
const EVENT_ID = '64b000000000000000000032';

let server;
let baseUrl;

const authCookie = (role = 'lawyer', userId = USER_ID) =>
  `${AUTH_COOKIE_NAME}=${signAuthToken({ _id: userId, role, email: `${role}@example.com` })}`;

const jsonRequest = (path, options = {}, role = 'lawyer', userId = USER_ID) =>
  fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      cookie: authCookie(role, userId),
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });

const queryResult = (result) => {
  const query = {
    sort: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };
  return query;
};

const sessionDoc = (overrides = {}) => ({
  _id: SESSION_ID,
  userId: USER_ID,
  clientId: CLIENT_ID,
  caseId: CASE_ID,
  status: 'running',
  webMeter: {},
  save: vi.fn(async function save() {
    return this;
  }),
  ...overrides,
});

beforeAll(async () => {
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.workSessionFindById.mockResolvedValue(sessionDoc());
  mocks.appUsageFind.mockReturnValue(queryResult([]));
  mocks.appUsageCreate.mockImplementation(async (payload) => ({ _id: EVENT_ID, ...payload }));
});

test('POST /api/app-usage-events/work-sessions/:id/events stores app and domain duration only', async () => {
  const response = await jsonRequest(`/api/app-usage-events/work-sessions/${SESSION_ID}/events`, {
    method: 'POST',
    body: JSON.stringify({
      appName: 'Google Chrome',
      url: 'https://example.com/matter?secret=hidden#note',
      title: 'Matter research',
      startedAt: '2026-06-13T09:00:00.000Z',
      endedAt: '2026-06-13T09:05:00.000Z',
      platform: 'desktop_windows',
      sourceApp: 'desktop_agent',
    }),
  });
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(body.data).toMatchObject({
    appName: 'Google Chrome',
    domain: 'example.com',
    durationSeconds: 300,
    platform: 'desktop_windows',
    sourceApp: 'desktop_agent',
    privacyPolicy: 'app_url_duration_only_no_content',
  });
  expect(body.data.url).toBe('https://example.com/matter');
  const storedPayload = mocks.appUsageCreate.mock.calls[0][0];
  expect(storedPayload).not.toHaveProperty('pageContent');
  expect(storedPayload).not.toHaveProperty('screenshot');
  expect(storedPayload).not.toHaveProperty('keyValues');
});

test('app usage ingestion rejects page content and private capture fields', async () => {
  const response = await jsonRequest(`/api/app-usage-events/work-sessions/${SESSION_ID}/events`, {
    method: 'POST',
    body: JSON.stringify({
      appName: 'Google Chrome',
      domain: 'example.com',
      startedAt: '2026-06-13T09:00:00.000Z',
      endedAt: '2026-06-13T09:05:00.000Z',
      pageContent: 'private document text',
    }),
  });
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.code).toBe('APP_USAGE_PRIVACY_FIELD_FORBIDDEN');
  expect(mocks.appUsageCreate).not.toHaveBeenCalled();
});

test('app usage ingestion requires an active own session', async () => {
  mocks.workSessionFindById.mockResolvedValue(sessionDoc({ status: 'stopped' }));

  const response = await jsonRequest(`/api/app-usage-events/work-sessions/${SESSION_ID}/events`, {
    method: 'POST',
    body: JSON.stringify({
      appName: 'Word',
      startedAt: '2026-06-13T09:00:00.000Z',
      endedAt: '2026-06-13T09:05:00.000Z',
    }),
  });

  expect(response.status).toBe(409);
});

test('GET /api/app-usage-events/summary is manager-only and totals apps by session', async () => {
  mocks.appUsageFind.mockReturnValue(queryResult([
    {
      _id: EVENT_ID,
      workSessionId: SESSION_ID,
      appName: 'Word',
      domain: '',
      durationSeconds: 120,
    },
    {
      _id: '64b000000000000000000033',
      workSessionId: SESSION_ID,
      appName: 'Google Chrome',
      domain: 'example.com',
      durationSeconds: 180,
    },
  ]));

  const forbidden = await jsonRequest('/api/app-usage-events/summary', {}, 'lawyer', OTHER_USER_ID);
  expect(forbidden.status).toBe(403);

  const response = await jsonRequest('/api/app-usage-events/summary', {}, 'partner', OTHER_USER_ID);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.data.summary).toMatchObject({ eventCount: 2, durationSeconds: 300 });
  expect(body.data.summary.apps).toEqual([
    { name: 'Google Chrome', durationSeconds: 180 },
    { name: 'Word', durationSeconds: 120 },
  ]);
  expect(body.data.sessions[0].workSessionId).toBe(SESSION_ID);
});
