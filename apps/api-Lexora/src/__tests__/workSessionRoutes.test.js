import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { AUTH_COOKIE_NAME, signAuthToken } from '../modules/auth/services/authTokenService.js';

const mocks = vi.hoisted(() => ({
  workSessionCreate: vi.fn(),
  workSessionFind: vi.fn(),
  workSessionFindOne: vi.fn(),
  workSessionFindById: vi.fn(),
  activityCreate: vi.fn(),
  activityFindById: vi.fn(),
  activityUpdateOne: vi.fn(),
  caseFindById: vi.fn(),
  assignmentFindOne: vi.fn(),
  taskFindById: vi.fn(),
  rateCardFindOne: vi.fn(),
  timeEntryCreate: vi.fn(),
  timeEntryFindOne: vi.fn(),
  userFindById: vi.fn(),
  firmFindById: vi.fn(),
  associateProfileFindOne: vi.fn(),
  internProfileFindOne: vi.fn(),
  lawyerProfileFindOne: vi.fn(),
  partnerProfileFindOne: vi.fn(),
}));

vi.mock('../modules/workSessions/models/WorkSession.js', () => ({
  WorkSession: {
    create: mocks.workSessionCreate,
    find: mocks.workSessionFind,
    findOne: mocks.workSessionFindOne,
    findById: mocks.workSessionFindById,
  },
}));

vi.mock('../modules/activities/models/Activity.js', () => ({
  Activity: {
    create: mocks.activityCreate,
    findById: mocks.activityFindById,
    updateOne: mocks.activityUpdateOne,
  },
}));

vi.mock('../modules/cases/models/Case.js', () => ({
  Case: { findById: mocks.caseFindById },
}));

vi.mock('../modules/cases/models/CaseAssignment.js', () => ({
  CaseAssignment: { findOne: mocks.assignmentFindOne },
}));

vi.mock('../modules/tasks/models/Task.js', () => ({
  Task: { findById: mocks.taskFindById },
}));

vi.mock('../modules/rates/models/RateCard.js', () => ({
  RateCard: { findOne: mocks.rateCardFindOne },
}));

vi.mock('../modules/timeEntries/models/TimeEntry.js', () => ({
  TimeEntry: {
    create: mocks.timeEntryCreate,
    findOne: mocks.timeEntryFindOne,
  },
}));

vi.mock('../modules/users/models/User.js', () => ({
  default: { findById: mocks.userFindById },
}));

vi.mock('../modules/firms/models/Firm.js', () => ({
  Firm: { findById: mocks.firmFindById },
}));

vi.mock('../modules/users/models/AssociateProfile.js', () => ({
  default: { findOne: mocks.associateProfileFindOne },
}));

vi.mock('../modules/users/models/InternProfile.js', () => ({
  default: { findOne: mocks.internProfileFindOne },
}));

vi.mock('../modules/users/models/LawyerProfile.js', () => ({
  default: { findOne: mocks.lawyerProfileFindOne },
}));

vi.mock('../modules/users/models/PartnerProfile.js', () => ({
  default: { findOne: mocks.partnerProfileFindOne },
}));

const { default: app } = await import('../app.js');

const USER_ID = '64b000000000000000000024';
const OTHER_USER_ID = '64b000000000000000000025';
const CLIENT_ID = '64b000000000000000000023';
const CASE_ID = '64b000000000000000000022';
const TASK_ID = '64b000000000000000000028';
const SESSION_ID = '64b000000000000000000029';
const ACTIVITY_ID = '64b000000000000000000021';
const TIME_ENTRY_ID = '64b000000000000000000026';

let server;
let baseUrl;
let mongoSession;
let startSessionSpy;

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
    populate: vi.fn(() => query),
    sort: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve(result)),
    session: vi.fn(() => query),
    select: vi.fn(() => query),
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
  taskId: TASK_ID,
  activityType: 'research',
  activityCode: 'RESEARCH',
  workTool: 'manual',
  narrative: 'Research issue',
  billable: true,
  timezone: 'Asia/Calcutta',
  status: 'running',
  startedAt: new Date(Date.now() - 10 * 60000),
  pausedMs: 0,
  webMeter: {
    captureLevel: 'none',
    maxSessionMinutes: 180,
    privacyNote: 'Tracks timer, pause/resume, and heartbeat count only.',
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

afterEach(() => {
  startSessionSpy?.mockRestore();
});

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mongoSession = {
    withTransaction: vi.fn(async (callback) => callback()),
    endSession: vi.fn(async () => {}),
  };
  startSessionSpy = vi.spyOn(mongoose, 'startSession').mockResolvedValue(mongoSession);

  mocks.workSessionFindOne.mockResolvedValue(null);
  mocks.workSessionFind.mockReturnValue(queryResult([]));
  mocks.workSessionCreate.mockImplementation(async (payload) => ({ _id: SESSION_ID, ...payload }));
  mocks.caseFindById.mockResolvedValue({
    _id: CASE_ID,
    clientId: CLIENT_ID,
    assignedUsers: [USER_ID],
  });
  mocks.assignmentFindOne.mockResolvedValue(null);
  mocks.taskFindById.mockResolvedValue({
    _id: TASK_ID,
    caseId: CASE_ID,
    clientId: CLIENT_ID,
    assignedTo: USER_ID,
    createdBy: OTHER_USER_ID,
  });
  mocks.activityCreate.mockImplementation(async ([payload]) => [{ _id: ACTIVITY_ID, ...payload }]);
  mocks.activityFindById.mockResolvedValue({ _id: ACTIVITY_ID, status: 'converted' });
  mocks.activityUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  mocks.rateCardFindOne.mockReturnValue(queryResult({ ratePerHour: 6000 }));
  mocks.timeEntryCreate.mockImplementation(async ([payload]) => [{ _id: TIME_ENTRY_ID, ...payload }]);
  mocks.timeEntryFindOne.mockResolvedValue({ _id: TIME_ENTRY_ID, activityId: ACTIVITY_ID, status: 'submitted' });
  mocks.userFindById.mockReturnValue(queryResult({ _id: USER_ID, role: 'lawyer' }));
});

test('POST /api/work-sessions/start creates one active session with task context', async () => {
  const response = await jsonRequest('/api/work-sessions/start', {
    method: 'POST',
    body: JSON.stringify({
      clientId: CLIENT_ID,
      caseId: CASE_ID,
      taskId: TASK_ID,
      activityType: 'research',
      activityCode: 'RESEARCH',
      workTool: 'manual',
      narrative: 'Research issue',
      billable: true,
      meterCaptureLevel: 'none',
    }),
  });
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(mocks.workSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
    userId: USER_ID,
    clientId: CLIENT_ID,
    caseId: CASE_ID,
    taskId: TASK_ID,
    status: 'running',
    webMeter: expect.objectContaining({
      captureLevel: 'none',
      privacyNote: expect.stringContaining('keyboard and mouse counts only'),
    }),
  }));
  expect(body.data.taskId).toBe(TASK_ID);
});

test('GET /api/work-sessions lets partners review session list', async () => {
  mocks.workSessionFind.mockReturnValue(queryResult([sessionDoc()]));

  const response = await jsonRequest('/api/work-sessions', {}, 'partner', OTHER_USER_ID);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(mocks.workSessionFind).toHaveBeenCalledWith({});
  expect(body.data).toHaveLength(1);
});

test('POST /api/work-sessions/start blocks duplicate active sessions with a stable code', async () => {
  mocks.workSessionFindOne.mockResolvedValue(sessionDoc());

  const response = await jsonRequest('/api/work-sessions/start', {
    method: 'POST',
    body: JSON.stringify({
      clientId: CLIENT_ID,
      caseId: CASE_ID,
      activityType: 'drafting',
    }),
  });
  const body = await response.json();

  expect(response.status).toBe(409);
  expect(body.code).toBe('ACTIVE_WORK_SESSION_EXISTS');
  expect(mocks.workSessionCreate).not.toHaveBeenCalled();
});

test('POST /api/work-sessions/:id/pause and resume are idempotent for repeated clicks', async () => {
  mocks.workSessionFindById.mockResolvedValueOnce(sessionDoc({ status: 'paused', pausedAt: new Date() }));
  const pauseResponse = await jsonRequest(`/api/work-sessions/${SESSION_ID}/pause`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const pauseBody = await pauseResponse.json();

  mocks.workSessionFindById.mockResolvedValueOnce(sessionDoc({ status: 'running' }));
  const resumeResponse = await jsonRequest(`/api/work-sessions/${SESSION_ID}/resume`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const resumeBody = await resumeResponse.json();

  expect(pauseResponse.status).toBe(200);
  expect(pauseBody.idempotent).toBe(true);
  expect(resumeResponse.status).toBe(200);
  expect(resumeBody.idempotent).toBe(true);
});

test('POST /api/work-sessions/:id/stop creates activity and submitted time entry by default', async () => {
  const doc = sessionDoc();
  mocks.workSessionFindById.mockResolvedValue(doc);

  const response = await jsonRequest(`/api/work-sessions/${SESSION_ID}/stop`, {
    method: 'POST',
    body: JSON.stringify({ finalNarrative: 'Research issue complete' }),
  });
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(mongoSession.withTransaction).toHaveBeenCalledTimes(1);
  expect(mocks.activityCreate).toHaveBeenCalledWith([
    expect.objectContaining({
      userId: USER_ID,
      clientId: CLIENT_ID,
      caseId: CASE_ID,
      taskId: TASK_ID,
      source: 'meter',
      narrative: 'Research issue complete',
    }),
  ], { session: mongoSession });
  expect(mocks.timeEntryCreate).toHaveBeenCalledWith([
    expect.objectContaining({
      activityId: ACTIVITY_ID,
      taskId: TASK_ID,
      status: 'submitted',
      submittedBy: USER_ID,
      billableMinutes: expect.any(Number),
    }),
  ], { session: mongoSession });
  expect(doc.status).toBe('stopped');
  expect(doc.activityId).toBe(ACTIVITY_ID);
  expect(body.timeEntry.status).toBe('submitted');
});

test('POST /api/work-sessions/:id/stop returns the prior conversion when retried', async () => {
  mocks.workSessionFindById.mockResolvedValue(sessionDoc({
    status: 'stopped',
    endedAt: new Date(),
    activityId: ACTIVITY_ID,
  }));

  const response = await jsonRequest(`/api/work-sessions/${SESSION_ID}/stop`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.idempotent).toBe(true);
  expect(body.timeEntry._id).toBe(TIME_ENTRY_ID);
  expect(mocks.activityCreate).not.toHaveBeenCalled();
  expect(mocks.timeEntryCreate).not.toHaveBeenCalled();
});

test('POST /api/work-sessions/start rejects tasks outside the selected matter', async () => {
  mocks.taskFindById.mockResolvedValue({
    _id: TASK_ID,
    caseId: '64b000000000000000000099',
    clientId: CLIENT_ID,
    assignedTo: USER_ID,
    createdBy: USER_ID,
  });

  const response = await jsonRequest('/api/work-sessions/start', {
    method: 'POST',
    body: JSON.stringify({
      clientId: CLIENT_ID,
      caseId: CASE_ID,
      taskId: TASK_ID,
      activityType: 'review',
    }),
  });
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.code).toBe('WORK_SESSION_TASK_MISMATCH');
  expect(mocks.workSessionCreate).not.toHaveBeenCalled();
});
