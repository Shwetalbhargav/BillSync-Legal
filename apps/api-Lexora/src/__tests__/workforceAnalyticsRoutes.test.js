import { createServer } from 'node:http';
import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { AUTH_COOKIE_NAME, signAuthToken } from '../modules/auth/services/authTokenService.js';

const mocks = vi.hoisted(() => ({
  sessionFind: vi.fn(),
  sampleFind: vi.fn(),
  idleFind: vi.fn(),
  appFind: vi.fn(),
  entryFind: vi.fn(),
  attendanceFind: vi.fn(),
}));

vi.mock('../modules/workSessions/models/WorkSession.js', () => ({
  WorkSession: { find: mocks.sessionFind },
}));
vi.mock('../modules/activitySamples/models/ActivitySample.js', () => ({
  ActivitySample: { find: mocks.sampleFind },
}));
vi.mock('../modules/idleIntervals/models/IdleInterval.js', () => ({
  IdleInterval: { find: mocks.idleFind },
}));
vi.mock('../modules/appUsageEvents/models/AppUsageEvent.js', () => ({
  AppUsageEvent: { find: mocks.appFind },
}));
vi.mock('../modules/timeEntries/models/TimeEntry.js', () => ({
  TimeEntry: { find: mocks.entryFind },
}));
vi.mock('../modules/attendance/models/AttendanceDay.js', () => ({
  AttendanceDay: { find: mocks.attendanceFind },
}));

const { default: app } = await import('../app.js');

const USER_ID = '64b000000000000000000024';
const MANAGER_ID = '64b000000000000000000025';
const CLIENT_ID = '64b000000000000000000030';
const CASE_ID = '64b000000000000000000031';
const TASK_ID = '64b000000000000000000032';
const SESSION_ID = '64b000000000000000000033';
const ENTRY_ID = '64b000000000000000000034';

let server;
let baseUrl;

const cookie = (role = 'partner', id = MANAGER_ID) =>
  `${AUTH_COOKIE_NAME}=${signAuthToken({ _id: id, role, email: `${role}@example.com` })}`;

const request = (path, role = 'partner') => fetch(`${baseUrl}${path}`, {
  headers: { cookie: cookie(role) },
});

const queryResult = (result) => {
  const query = {
    populate: vi.fn(() => query),
    sort: vi.fn(() => query),
    limit: vi.fn(() => query),
    lean: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };
  return query;
};

const user = { _id: USER_ID, name: 'Karan Sethi', role: 'lawyer', email: 'karan@example.com' };
const client = { _id: CLIENT_ID, displayName: 'Nimbus Retail Pvt Ltd' };
const matter = { _id: CASE_ID, title: 'Contract Review' };
const task = { _id: TASK_ID, title: 'Draft MSA' };

beforeAll(async () => {
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.sessionFind.mockReturnValue(queryResult([{
    _id: SESSION_ID,
    userId: user,
    clientId: client,
    caseId: matter,
    taskId: task,
    startedAt: new Date('2026-06-13T09:30:00.000Z'),
    status: 'stopped',
    durationMinutes: 120,
    payableDurationMinutes: 110,
    billable: true,
    activityType: 'drafting',
  }]));
  mocks.sampleFind.mockReturnValue(queryResult([{
    workSessionId: SESSION_ID,
    sampleSeconds: 3600,
    activeSeconds: 2700,
  }]));
  mocks.idleFind.mockReturnValue(queryResult([{
    workSessionId: SESSION_ID,
    durationSeconds: 900,
    status: 'discarded',
  }]));
  mocks.appFind.mockReturnValue(queryResult([{
    workSessionId: SESSION_ID,
    appName: 'BillSync Legal',
    domain: 'localhost',
    durationSeconds: 1800,
  }]));
  mocks.entryFind.mockReturnValue(queryResult([{
    _id: ENTRY_ID,
    userId: user,
    clientId: client,
    caseId: matter,
    taskId: task,
    date: new Date('2026-06-13T10:00:00.000Z'),
    billableMinutes: 90,
    nonbillableMinutes: 20,
    amount: 4500,
    status: 'approved',
    submittedAt: new Date('2026-06-13T11:00:00.000Z'),
    reviewedAt: new Date('2026-06-13T13:00:00.000Z'),
  }]));
  mocks.attendanceFind.mockReturnValue(queryResult([{
    userId: user,
    date: '2026-06-13',
    status: 'present',
    minutesWorked: 110,
  }]));
});

test('GET /api/analytics/workforce returns manager workforce aggregates', async () => {
  const response = await request('/api/analytics/workforce?from=2026-06-13&to=2026-06-13');
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.data.summary).toMatchObject({
    trackedMinutes: 110,
    billableMinutes: 90,
    nonbillableMinutes: 20,
    payrollReadyMinutes: 110,
    approvalSlaHours: 2,
  });
  expect(body.data.rows[0]).toMatchObject({
    userName: 'Karan Sethi',
    clientName: 'Nimbus Retail Pvt Ltd',
    matterName: 'Contract Review',
    taskName: 'Draft MSA',
    activityPercent: 75,
    attendanceStatus: 'present',
    approvalStatus: 'approved',
    payrollReady: true,
  });
  expect(body.data.privacy).toMatchObject({ screenshots: false, keystrokeValues: false, pageContent: false });
});

test('GET /api/analytics/workforce applies entity filters', async () => {
  const response = await request(`/api/analytics/workforce?userId=${USER_ID}&clientId=${CLIENT_ID}&matterId=${CASE_ID}&taskId=${TASK_ID}`);

  expect(response.status).toBe(200);
  expect(mocks.sessionFind).toHaveBeenCalledWith(expect.objectContaining({
    userId: expect.anything(),
    clientId: expect.anything(),
    caseId: expect.anything(),
    taskId: expect.anything(),
  }));
});

test('GET /api/analytics/workforce is manager-only', async () => {
  const response = await request('/api/analytics/workforce', 'lawyer');
  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body.code).toBe('WORKFORCE_ANALYTICS_FORBIDDEN');
});
