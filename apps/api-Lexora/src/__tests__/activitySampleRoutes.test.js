import { createServer } from 'node:http';
import { beforeAll, afterAll, beforeEach, expect, test, vi } from 'vitest';
import { AUTH_COOKIE_NAME, signAuthToken } from '../modules/auth/services/authTokenService.js';

const mocks = vi.hoisted(() => ({
  activitySampleFind: vi.fn(),
  activitySampleFindOneAndUpdate: vi.fn(),
  workSessionFindById: vi.fn(),
}));

vi.mock('../modules/activitySamples/models/ActivitySample.js', () => ({
  ActivitySample: {
    find: mocks.activitySampleFind,
    findOneAndUpdate: mocks.activitySampleFindOneAndUpdate,
  },
  default: {
    find: mocks.activitySampleFind,
    findOneAndUpdate: mocks.activitySampleFindOneAndUpdate,
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
const SAMPLE_ID = '64b000000000000000000030';

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
  webMeter: {
    privacyNote: 'Tracks timer, pause/resume, keyboard and mouse counts only.',
  },
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
  mocks.activitySampleFind.mockReturnValue(queryResult([]));
  mocks.activitySampleFindOneAndUpdate.mockImplementation(async (_filter, update) => ({ _id: SAMPLE_ID, ...update.$set }));
});

test('POST /api/activity-samples/work-sessions/:id/samples stores counts-only activity sample', async () => {
  const response = await jsonRequest(`/api/activity-samples/work-sessions/${SESSION_ID}/samples`, {
    method: 'POST',
    body: JSON.stringify({
      windowStart: '2026-06-13T09:00:00.000Z',
      windowEnd: '2026-06-13T09:01:00.000Z',
      sampleSeconds: 60,
      activeSeconds: 45,
      inactiveSeconds: 15,
      keyboardCount: 12,
      mouseCount: 8,
      sourceDevice: 'web',
      sourceApp: 'web_meter',
    }),
  });
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(body.data).toMatchObject({
    keyboardCount: 12,
    mouseCount: 8,
    activeSeconds: 45,
    inactiveSeconds: 15,
    activityPercent: 75,
    privacyPolicy: 'counts_only_no_key_values_no_content',
  });
  const storedPayload = mocks.activitySampleFindOneAndUpdate.mock.calls[0][1].$set;
  expect(storedPayload).not.toHaveProperty('keyValues');
  expect(storedPayload).not.toHaveProperty('typedText');
  expect(storedPayload).not.toHaveProperty('pageContent');
});

test('activity sample ingestion rejects keystroke or page content fields', async () => {
  const response = await jsonRequest(`/api/activity-samples/work-sessions/${SESSION_ID}/samples`, {
    method: 'POST',
    body: JSON.stringify({
      windowStart: '2026-06-13T09:00:00.000Z',
      windowEnd: '2026-06-13T09:01:00.000Z',
      activeSeconds: 45,
      keyboardCount: 12,
      keyValues: ['a'],
    }),
  });
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.code).toBe('ACTIVITY_SAMPLE_PRIVACY_FIELD_FORBIDDEN');
  expect(mocks.activitySampleFindOneAndUpdate).not.toHaveBeenCalled();
});

test('activity sample ingestion requires active own session', async () => {
  mocks.workSessionFindById.mockResolvedValue(sessionDoc({ status: 'stopped' }));

  const response = await jsonRequest(`/api/activity-samples/work-sessions/${SESSION_ID}/samples`, {
    method: 'POST',
    body: JSON.stringify({
      windowStart: '2026-06-13T09:00:00.000Z',
      windowEnd: '2026-06-13T09:01:00.000Z',
      activeSeconds: 45,
    }),
  });

  expect(response.status).toBe(409);
});

test('GET /api/activity-samples/summary is manager-only and aggregates by session', async () => {
  mocks.activitySampleFind.mockReturnValue(queryResult([
    {
      _id: SAMPLE_ID,
      workSessionId: SESSION_ID,
      sampleSeconds: 60,
      activeSeconds: 30,
      inactiveSeconds: 30,
      keyboardCount: 5,
      mouseCount: 7,
    },
    {
      _id: '64b000000000000000000031',
      workSessionId: SESSION_ID,
      sampleSeconds: 60,
      activeSeconds: 60,
      inactiveSeconds: 0,
      keyboardCount: 10,
      mouseCount: 3,
    },
  ]));

  const forbidden = await jsonRequest('/api/activity-samples/summary', {}, 'lawyer', OTHER_USER_ID);
  expect(forbidden.status).toBe(403);

  const response = await jsonRequest('/api/activity-samples/summary', {}, 'partner', OTHER_USER_ID);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.data.summary).toMatchObject({
    sampleCount: 2,
    sampleSeconds: 120,
    activeSeconds: 90,
    keyboardCount: 15,
    mouseCount: 10,
    activityPercent: 75,
  });
  expect(body.data.sessions[0].workSessionId).toBe(SESSION_ID);
});
