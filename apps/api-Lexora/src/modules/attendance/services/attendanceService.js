import { AttendanceDay } from '../models/AttendanceDay.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Holiday } from '../models/Holiday.js';
import { WorkSession } from '../../workSessions/models/WorkSession.js';
import User from '../../users/models/User.js';

const DEFAULT_START = '09:30';
const DEFAULT_END = '18:00';
const LATE_GRACE_MINUTES = 15;

export const isoDate = (value = new Date()) => new Date(value).toISOString().slice(0, 10);

function localExpected(dateText, timeText) {
  return new Date(`${dateText}T${timeText}:00.000Z`);
}

function datesBetween(startDate, endDate) {
  const dates = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  while (current <= end) {
    dates.push(isoDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
}

export async function rebuildAttendance({ from, to, userId } = {}) {
  const startDate = from || isoDate();
  const endDate = to || startDate;
  const dateList = datesBetween(startDate, endDate);
  const userFilter = userId ? { _id: userId } : {};
  const users = await User.find(userFilter, { passwordHash: 0 }).sort('name').limit(500);
  const rows = [];

  for (const user of users) {
    for (const date of dateList) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      const [sessions, approvedLeave, holiday] = await Promise.all([
        WorkSession.find({ userId: user._id, startedAt: { $gte: dayStart, $lte: dayEnd }, status: { $ne: 'discarded' } }).sort({ startedAt: 1 }),
        LeaveRequest.findOne({ userId: user._id, status: 'approved', startDate: { $lte: date }, endDate: { $gte: date } }),
        Holiday.findOne({ date }),
      ]);

      const first = sessions[0]?.startedAt || null;
      const last = sessions.reduce((latest, session) => {
        const candidate = session.endedAt || session.lastHeartbeatAt || session.startedAt;
        return !latest || new Date(candidate) > new Date(latest) ? candidate : latest;
      }, null);
      const lateMinutes = first ? Math.max(0, minutesBetween(localExpected(date, DEFAULT_START), first) - LATE_GRACE_MINUTES) : 0;
      const minutesWorked = sessions.reduce((sum, session) => sum + Number(session.payableDurationMinutes || session.durationMinutes || 0), 0);
      const status = holiday ? 'holiday' : approvedLeave ? 'leave' : first ? (lateMinutes > 0 ? 'late' : 'present') : 'absent';
      const row = await AttendanceDay.findOneAndUpdate(
        { userId: user._id, date },
        {
          $set: {
            userId: user._id,
            date,
            status,
            firstActivityAt: first || undefined,
            lastActivityAt: last || undefined,
            expectedStart: DEFAULT_START,
            expectedEnd: DEFAULT_END,
            minutesWorked,
            lateMinutes,
            leaveRequestId: approvedLeave?._id,
            holidayId: holiday?._id,
            source: holiday ? 'holiday' : approvedLeave ? 'leave' : 'work_sessions',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      ).populate('userId', 'name role email mobile');
      rows.push(row);
    }
  }
  return rows;
}

export function attendanceSummary(rows = []) {
  return rows.reduce((summary, row) => {
    summary.total += 1;
    summary[row.status] = Number(summary[row.status] || 0) + 1;
    return summary;
  }, { total: 0, present: 0, absent: 0, late: 0, leave: 0, holiday: 0 });
}

export { datesBetween };
