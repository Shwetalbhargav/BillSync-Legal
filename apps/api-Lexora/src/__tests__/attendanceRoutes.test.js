import { createServer } from 'node:http';
import { beforeAll, afterAll, beforeEach, expect, test, vi } from 'vitest';
import { AUTH_COOKIE_NAME, signAuthToken } from '../modules/auth/services/authTokenService.js';

const mocks = vi.hoisted(() => ({
  attendanceFind: vi.fn(),
  attendanceFindOneAndUpdate: vi.fn(),
  leaveCreate: vi.fn(),
  leaveFind: vi.fn(),
  leaveFindOne: vi.fn(),
  leaveFindById: vi.fn(),
  holidayFind: vi.fn(),
  holidayFindOne: vi.fn(),
  holidayFindOneAndUpdate: vi.fn(),
  workSessionFind: vi.fn(),
  userFind: vi.fn(),
}));

vi.mock('../modules/attendance/models/AttendanceDay.js', () => ({
  AttendanceDay: { find: mocks.attendanceFind, findOneAndUpdate: mocks.attendanceFindOneAndUpdate },
}));
vi.mock('../modules/attendance/models/LeaveRequest.js', () => ({
  LeaveRequest: { create: mocks.leaveCreate, find: mocks.leaveFind, findOne: mocks.leaveFindOne, findById: mocks.leaveFindById },
}));
vi.mock('../modules/attendance/models/Holiday.js', () => ({
  Holiday: { find: mocks.holidayFind, findOne: mocks.holidayFindOne, findOneAndUpdate: mocks.holidayFindOneAndUpdate },
}));
vi.mock('../modules/workSessions/models/WorkSession.js', () => ({
  WorkSession: { find: mocks.workSessionFind },
}));
vi.mock('../modules/users/models/User.js', () => ({
  default: { find: mocks.userFind },
}));

const { default: app } = await import('../app.js');

const USER_ID = '64b000000000000000000024';
const OTHER_USER_ID = '64b000000000000000000025';
const ATTENDANCE_ID = '64b000000000000000000090';
const LEAVE_ID = '64b000000000000000000091';

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
    populate: vi.fn(() => query),
    sort: vi.fn(() => query),
    skip: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };
  return query;
};

const userDoc = { _id: USER_ID, name: 'Karan Sethi', role: 'lawyer', email: 'karan@example.com' };
const attendanceDoc = (overrides = {}) => ({
  _id: ATTENDANCE_ID,
  userId: userDoc,
  date: '2026-06-13',
  status: 'late',
  firstActivityAt: new Date('2026-06-13T10:00:00.000Z'),
  lastActivityAt: new Date('2026-06-13T11:00:00.000Z'),
  minutesWorked: 60,
  lateMinutes: 15,
  ...overrides,
});
const leaveDoc = (overrides = {}) => ({
  _id: LEAVE_ID,
  userId: USER_ID,
  startDate: '2026-06-14',
  endDate: '2026-06-14',
  leaveType: 'vacation',
  status: 'pending',
  save: vi.fn(async function save() { return this; }),
  ...overrides,
});

beforeAll(async () => {
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.userFind.mockReturnValue(queryResult([userDoc]));
  mocks.workSessionFind.mockReturnValue(queryResult([{ startedAt: new Date('2026-06-13T10:00:00.000Z'), endedAt: new Date('2026-06-13T11:00:00.000Z'), durationMinutes: 60, status: 'stopped' }]));
  mocks.leaveFindOne.mockResolvedValue(null);
  mocks.holidayFindOne.mockResolvedValue(null);
  mocks.attendanceFindOneAndUpdate.mockReturnValue({ populate: vi.fn(() => Promise.resolve(attendanceDoc())) });
  mocks.attendanceFind.mockReturnValue(queryResult([attendanceDoc()]));
  mocks.leaveCreate.mockImplementation(async (payload) => ({ _id: LEAVE_ID, ...payload, status: 'pending' }));
  mocks.leaveFind.mockReturnValue(queryResult([leaveDoc()]));
  mocks.leaveFindById.mockResolvedValue(leaveDoc());
  mocks.holidayFind.mockReturnValue(queryResult([]));
  mocks.holidayFindOneAndUpdate.mockResolvedValue({ _id: '64b000000000000000000092', date: '2026-06-15', name: 'Firm holiday' });
});

test('GET /api/attendance shows present or late status from first activity', async () => {
  const response = await jsonRequest('/api/attendance?from=2026-06-13&to=2026-06-13', {}, 'partner', OTHER_USER_ID);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.data.rows[0]).toMatchObject({ status: 'late', minutesWorked: 60 });
  expect(body.data.summary.late).toBe(1);
  expect(mocks.attendanceFindOneAndUpdate).toHaveBeenCalled();
});

test('POST /api/attendance/leave-requests lets employee request leave', async () => {
  const response = await jsonRequest('/api/attendance/leave-requests', {
    method: 'POST',
    body: JSON.stringify({ startDate: '2026-06-14', endDate: '2026-06-14', leaveType: 'vacation', reason: 'Family commitment' }),
  });
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(body.data).toMatchObject({ userId: USER_ID, status: 'pending' });
  expect(mocks.leaveCreate).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID, leaveType: 'vacation' }));
});

test('POST /api/attendance/leave-requests rejects a reversed date range', async () => {
  const response = await jsonRequest('/api/attendance/leave-requests', {
    method: 'POST',
    body: JSON.stringify({ startDate: '2026-06-16', endDate: '2026-06-14', leaveType: 'vacation' }),
  });
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.code).toBe('LEAVE_DATE_INVALID');
  expect(mocks.leaveCreate).not.toHaveBeenCalled();
});

test('POST /api/attendance/leave-requests/:id/review approves leave and refreshes attendance', async () => {
  const leave = leaveDoc();
  mocks.leaveFindById.mockResolvedValue(leave);
  mocks.leaveFindOne.mockResolvedValue(leaveDoc({ status: 'approved' }));

  const response = await jsonRequest(`/api/attendance/leave-requests/${LEAVE_ID}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'approved', reviewNote: 'Approved' }),
  }, 'partner', OTHER_USER_ID);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(leave.status).toBe('approved');
  expect(body.data.status).toBe('approved');
  expect(mocks.attendanceFindOneAndUpdate).toHaveBeenCalled();
});

test('leave review is manager-only', async () => {
  const response = await jsonRequest(`/api/attendance/leave-requests/${LEAVE_ID}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'approved' }),
  });

  expect(response.status).toBe(403);
});
