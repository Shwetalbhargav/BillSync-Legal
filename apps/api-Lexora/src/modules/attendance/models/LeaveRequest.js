import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const LeaveRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: String, required: true, index: true },
    endDate: { type: String, required: true, index: true },
    leaveType: {
      type: String,
      enum: ['vacation', 'sick', 'personal', 'court_duty', 'unpaid', 'other'],
      default: 'vacation',
      index: true,
    },
    reason: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 500 },
    affectsPayroll: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ userId: 1, startDate: 1, endDate: 1 });

LeaveRequestSchema.plugin(workspaceScopedPlugin);
export const LeaveRequest = mongoose.model('LeaveRequest', LeaveRequestSchema);
export default LeaveRequest;
