import { createServer } from 'node:http';
import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { AUTH_COOKIE_NAME, signAuthToken } from '../modules/auth/services/authTokenService.js';

const mocks = vi.hoisted(() => ({
  timeEntryFind: vi.fn(),
  timeEntryFindById: vi.fn(),
  workSessionFind: vi.fn(),
  activitySampleFind: vi.fn(),
}));

vi.mock('../modules/timeEntries/models/TimeEntry.js', () => ({
  TimeEntry: { find: mocks.timeEntryFind, findById: mocks.timeEntryFindById },
}));

vi.mock('../modules/workSessions/models/WorkSession.js', () => ({
  WorkSession: { find: mocks.workSessionFind },
}));

vi.mock('../modules/activitySamples/models/ActivitySample.js', () => ({
  ActivitySample: { find: mocks.activitySampleFind },
}));

const { default: app } = await import('../app.js');

const ENTRY_ID = '64b000000000000000000101';
const USER_ID = '64b000000000000000000102';
const CLIENT_ID = '64b000000000000000000103';
const CASE_ID = '64b000000000000000000104';
const TASK_ID = '64b000000000000000000105';
const ACTIVITY_ID = '64b000000000000000000106';
const SESSION_ID = '64b000000000000000000107';

let server;
let baseUrl;

const cookie = (role = 'admin', id = '64b000000000000000000199') =>
  `${AUTH_COOKIE_NAME}=${signAuthToken({ _id: id, role, email: 'admin@example.com' })}`;

const queryResult = (result) => {
  const query = {
    populate: vi.fn(() => query),
    sort: vi.fn(() => Promise.resolve(result)),
    select: vi.fn(() => query),
    lean: vi.fn(() => Promise.resolve(result)),
  };
  return query;
};

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
  mocks.timeEntryFind.mockReturnValue(queryResult([{
    toObject: () => ({
      _id: ENTRY_ID,
      status: 'submitted',
      userId: { _id: USER_ID, name: 'Asha Rao', role: 'lawyer' },
      clientId: { _id: CLIENT_ID, displayName: 'BluePeak Energy Pvt. Ltd.' },
      caseId: { _id: CASE_ID, title: 'Environmental Show Cause Response' },
      taskId: { _id: TASK_ID, title: 'Draft reply' },
      activityId: {
        _id: ACTIVITY_ID,
        activityType: 'drafting',
        workTool: 'microsoft_word',
        idleSummary: { totalSeconds: 120, discardedSeconds: 60 },
      },
      narrative: 'Draft response',
      billableMinutes: 45,
      rateApplied: 5000,
      amount: 3750,
    }),
  }]));
  mocks.workSessionFind.mockReturnValue(queryResult([{
    _id: SESSION_ID,
    activityId: ACTIVITY_ID,
    payableDurationMinutes: 44,
  }]));
  mocks.activitySampleFind.mockReturnValue(queryResult([{
    workSessionId: SESSION_ID,
    sampleSeconds: 600,
    activeSeconds: 480,
    inactiveSeconds: 120,
    keyboardCount: 240,
    mouseCount: 85,
  }]));
  mocks.timeEntryFindById.mockResolvedValue({
    _id: ENTRY_ID,
    status: 'submitted',
    userId: USER_ID,
    billableMinutes: 0,
    nonbillableMinutes: 30,
    save: vi.fn().mockResolvedValue(true),
    toObject() {
      return {
        _id: ENTRY_ID,
        status: this.status,
        userId: this.userId,
        reviewedBy: this.reviewedBy,
      };
    },
  });
});

test('GET /api/time-entries returns review context and aggregate activity counts', async () => {
  const response = await fetch(`${baseUrl}/api/time-entries?status=submitted`, {
    headers: { cookie: cookie() },
  });
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(mocks.timeEntryFind).toHaveBeenCalledWith({ status: 'submitted' });
  expect(body[0]).toMatchObject({
    userId: { name: 'Asha Rao' },
    clientId: { displayName: 'BluePeak Energy Pvt. Ltd.' },
    caseId: { title: 'Environmental Show Cause Response' },
    taskId: { title: 'Draft reply' },
    activitySummary: {
      keyboardCount: 240,
      mouseCount: 85,
      activityPercent: 80,
    },
    idleSummary: { totalSeconds: 120, discardedSeconds: 60 },
    payableDurationMinutes: 44,
  });
});

test('GET /api/time-entries treats admin role casing consistently', async () => {
  const response = await fetch(`${baseUrl}/api/time-entries?status=submitted`, {
    headers: { cookie: cookie('Admin') },
  });

  expect(response.status).toBe(200);
  expect(mocks.timeEntryFind).toHaveBeenCalledWith({ status: 'submitted' });
});

test('POST /api/time-entries/:id/approve allows admin to approve own submitted entry', async () => {
  const response = await fetch(`${baseUrl}/api/time-entries/${ENTRY_ID}/approve`, {
    method: 'POST',
    headers: { cookie: cookie('admin', USER_ID) },
  });
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.status).toBe('approved');
});
