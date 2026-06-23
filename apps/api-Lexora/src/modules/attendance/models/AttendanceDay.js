import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const AttendanceDaySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'leave', 'holiday'],
      required: true,
      index: true,
    },
    firstActivityAt: { type: Date },
    lastActivityAt: { type: Date },
    expectedStart: { type: String, default: '09:30' },
    expectedEnd: { type: String, default: '18:00' },
    minutesWorked: { type: Number, default: 0, min: 0 },
    lateMinutes: { type: Number, default: 0, min: 0 },
    leaveRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' },
    holidayId: { type: mongoose.Schema.Types.ObjectId, ref: 'Holiday' },
    source: { type: String, enum: ['work_sessions', 'leave', 'holiday', 'manual'], default: 'work_sessions' },
  },
  { timestamps: true }
);

AttendanceDaySchema.index({ userId: 1, date: 1 }, { unique: true });

AttendanceDaySchema.plugin(workspaceScopedPlugin);
export const AttendanceDay = mongoose.model('AttendanceDay', AttendanceDaySchema);
export default AttendanceDay;
