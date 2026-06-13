import { createServer } from 'node:http';
import { beforeAll, afterAll, beforeEach, expect, test, vi } from 'vitest';
import { AUTH_COOKIE_NAME, signAuthToken } from '../modules/auth/services/authTokenService.js';

const mocks = vi.hoisted(() => ({
  idleFind: vi.fn(),
  idleFindById: vi.fn(),
  idleFindOneAndUpdate: vi.fn(),
  workSessionFindById: vi.fn(),
  activitySampleFind: vi.fn(),
  activityUpdateOne: vi.fn(),
  timeEntryFindOne: vi.fn(),
  rateCardFindOne: vi.fn(),
}));

vi.mock('../modules/idleIntervals/models/IdleInterval.js', () => ({
  IdleInterval: {
    find: mocks.idleFind,
    findById: mocks.idleFindById,
    findOneAndUpdate: mocks.idleFindOneAndUpdate,
  },
}));

vi.mock('../modules/workSessions/models/WorkSession.js', () => ({
  WorkSession: {
    findById: mocks.workSessionFindById,
  },
}));

vi.mock('../modules/activitySamples/models/ActivitySample.js', () => ({
  ActivitySample: {
    find: mocks.activitySampleFind,
  },
}));

vi.mock('../modules/activities/models/Activity.js', () => ({
  Activity: {
    updateOne: mocks.activityUpdateOne,
  },
}));

vi.mock('../modules/timeEntries/models/TimeEntry.js', () => ({
  TimeEntry: {
    findOne: mocks.timeEntryFindOne,
  },
}));

vi.mock('../modules/rates/models/RateCard.js', () => ({
  RateCard: { findOne: mocks.rateCardFindOne },
}));

const { default: app } = await import('../app.js');

const USER_ID = '64b000000000000000000024';
const OTHER_USER_ID = '64b000000000000000000025';
const CLIENT_ID = '64b000000000000000000023';
const CASE_ID = '64b000000000000000000022';
const SESSION_ID = '64b000000000000000000029';
const INTERVAL_ID = '64b000000000000000000089';

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
  startedAt: new Date('2026-06-13T09:00:00.000Z'),
  lastHeartbeatAt: new Date('2026-06-13T09:02:00.000Z'),
  durationMinutes: 20,
  webMeter: {
    idleAfterSeconds: 300,
    lastActiveAt: new Date('2026-06-13T09:02:00.000Z'),
  },
  ...overrides,
});

const intervalDoc = (overrides = {}) => ({
  _id: INTERVAL_ID,
  workSessionId: SESSION_ID,
  userId: USER_ID,
  clientId: CLIENT_ID,
  caseId: CASE_ID,
  intervalStart: new Date('2026-06-13T09:02:00.000Z'),
  intervalEnd: new Date('2026-06-13T09:10:00.000Z'),
  durationSeconds: 480,
  thresholdSeconds: 300,
  detectionSource: 'return_prompt',
  status: 'pending',
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
  mocks.idleFind.mockReturnValue(queryResult([]));
  mocks.activitySampleFind.mockReturnValue(queryResult([]));
  mocks.idleFindOneAndUpdate.mockImplementation(async (_filter, update) => ({ _id: INTERVAL_ID, ...update.$setOnInsert }));
  mocks.idleFindById.mockResolvedValue(intervalDoc());
  mocks.activityUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  mocks.timeEntryFindOne.mockResolvedValue(null);
  mocks.rateCardFindOne.mockReturnValue(queryResult({ ratePerHour: 6000 }));
});

test('POST /api/idle-intervals/work-sessions/:id/detect creates pending idle interval from return gap', async () => {
  mocks.idleFind.mockReturnValue(queryResult([intervalDoc()]));

  const response = await jsonRequest(`/api/idle-intervals/work-sessions/${SESSION_ID}/detect`, {
    method: 'POST',
    body: JSON.stringify({ observedAt: '2026-06-13T09:10:00.000Z' }),
  });
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(mocks.idleFindOneAndUpdate).toHaveBeenCalledWith(
    expect.objectContaining({ workSessionId: SESSION_ID }),
    expect.objectContaining({
      $setOnInsert: expect.objectContaining({
        durationSeconds: 480,
        status: 'pending',
        privacyPolicy: 'idle_timing_only_no_content',
      }),
    }),
    expect.any(Object)
  );
  expect(body.data.summary.count).toBe(1);
});

test('GET /api/idle-intervals/work-sessions/:id lists privacy-safe idle markers', async () => {
  mocks.idleFind.mockReturnValue(queryResult([intervalDoc({ status: 'discarded' })]));

  const response = await jsonRequest(`/api/idle-intervals/work-sessions/${SESSION_ID}`);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.data.intervals[0]).toMatchObject({
    status: 'discarded',
    durationSeconds: 480,
  });
  expect(body.data.intervals[0]).not.toHaveProperty('keyValues');
  expect(body.data.intervals[0]).not.toHaveProperty('pageContent');
});

test('POST /api/idle-intervals/:id/resolve lets owner discard idle time', async () => {
  const interval = intervalDoc();
  mocks.idleFindById.mockResolvedValue(interval);

  const response = await jsonRequest(`/api/idle-intervals/${INTERVAL_ID}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'discarded', reason: 'Away from desk' }),
  });
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(interval.status).toBe('discarded');
  expect(interval.payableImpactSeconds).toBe(480);
  expect(body.data.status).toBe('discarded');
});

test('idle interval resolution blocks unrelated worker', async () => {
  mocks.idleFindById.mockResolvedValue(intervalDoc({ userId: OTHER_USER_ID }));

  const response = await jsonRequest(`/api/idle-intervals/${INTERVAL_ID}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'kept' }),
  });

  expect(response.status).toBe(403);
});
