import { AttendanceDay } from '../models/AttendanceDay.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Holiday } from '../models/Holiday.js';
import { attendanceSummary, isoDate, rebuildAttendance } from '../services/attendanceService.js';

const isManager = (role) => ['admin', 'partner'].includes(String(role || '').toLowerCase());
const idString = (value) => (value === undefined || value === null ? '' : String(value._id || value));

function scopedUser(req) {
  return isManager(req.user?.role) ? req.query.userId : req.user?.id;
}

export const AttendanceController = {
  async list(req, res) {
    try {
      const from = req.query.from || isoDate();
      const to = req.query.to || from;
      await rebuildAttendance({ from, to, userId: scopedUser(req) });
      const filter = { date: { $gte: from, $lte: to } };
      if (scopedUser(req)) filter.userId = scopedUser(req);
      const rows = await AttendanceDay.find(filter).populate('userId', 'name role email mobile').sort({ date: -1, 'userId.name': 1 }).limit(1000);
      res.json({ ok: true, data: { rows, summary: attendanceSummary(rows) } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load attendance' });
    }
  },

  async rebuild(req, res) {
    try {
      if (!isManager(req.user?.role)) return res.status(403).json({ ok: false, code: 'ATTENDANCE_FORBIDDEN', message: 'Attendance rebuild is available to firm reviewers' });
      const rows = await rebuildAttendance({ from: req.query.from, to: req.query.to, userId: req.query.userId });
      res.json({ ok: true, data: { rows, summary: attendanceSummary(rows) } });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to refresh attendance' });
    }
  },

  async createLeave(req, res) {
    try {
      const startDate = isoDate(req.body.startDate);
      const endDate = isoDate(req.body.endDate);
      if (endDate < startDate) {
        return res.status(400).json({ ok: false, code: 'LEAVE_DATE_INVALID', message: 'End date must be on or after start date' });
      }
      const doc = await LeaveRequest.create({
        userId: req.user.id,
        startDate,
        endDate,
        leaveType: req.body.leaveType || 'vacation',
        reason: req.body.reason,
      });
      res.status(201).json({ ok: true, data: doc });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to submit leave request' });
    }
  },

  async listLeaves(req, res) {
    try {
      const filter = {};
      if (!isManager(req.user?.role)) filter.userId = req.user.id;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.userId && isManager(req.user?.role)) filter.userId = req.query.userId;
      const rows = await LeaveRequest.find(filter).populate('userId', 'name role email mobile').sort({ createdAt: -1 }).limit(500);
      res.json({ ok: true, data: rows });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load leave requests' });
    }
  },

  async reviewLeave(req, res) {
    try {
      if (!isManager(req.user?.role)) return res.status(403).json({ ok: false, code: 'LEAVE_REVIEW_FORBIDDEN', message: 'Leave review is available to firm reviewers' });
      const doc = await LeaveRequest.findById(req.params.id);
      if (!doc) return res.status(404).json({ ok: false, code: 'LEAVE_NOT_FOUND', message: 'Leave request not found' });
      doc.status = req.body.decision;
      doc.reviewNote = req.body.reviewNote;
      doc.reviewedBy = req.user.id;
      doc.reviewedAt = new Date();
      await doc.save();
      if (doc.status === 'approved') await rebuildAttendance({ from: doc.startDate, to: doc.endDate, userId: idString(doc.userId) });
      res.json({ ok: true, data: doc });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to review leave request' });
    }
  },

  async listHolidays(req, res) {
    try {
      const rows = await Holiday.find({}).sort({ date: 1 }).limit(200);
      res.json({ ok: true, data: rows });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to load holidays' });
    }
  },

  async createHoliday(req, res) {
    try {
      if (!isManager(req.user?.role)) return res.status(403).json({ ok: false, code: 'HOLIDAY_FORBIDDEN', message: 'Holiday setup is available to firm reviewers' });
      const doc = await Holiday.findOneAndUpdate(
        { date: isoDate(req.body.date) },
        { $set: { date: isoDate(req.body.date), name: req.body.name, region: req.body.region || 'firm', paid: req.body.paid !== false, createdBy: req.user.id } },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
      await rebuildAttendance({ from: doc.date, to: doc.date });
      res.status(201).json({ ok: true, data: doc });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Failed to save holiday' });
    }
  },
};
