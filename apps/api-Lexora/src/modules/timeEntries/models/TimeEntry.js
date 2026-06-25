// src/models/TimeEntry.js

import mongoose from 'mongoose';
import { workspaceScopedPlugin } from '../../../middleware/workspaceScopedPlugin.js';

const TimeEntrySchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', index: true },

    activityCode: { type: String },
    narrative: { type: String, required: true },

    billableMinutes: { type: Number, min: 0, default: 0 },
    nonbillableMinutes: { type: Number, min: 0, default: 0 },
    idleSummary: {
      totalSeconds: { type: Number, default: 0, min: 0 },
      discardedSeconds: { type: Number, default: 0, min: 0 },
      payableMinutes: { type: Number, min: 0 },
    },

    rateApplied: { type: Number, min: 0 },
    rateAppliedPaise: { type: Number, min: 0, default: 0 },
    amount: { type: Number, min: 0 },
    amountPaise: { type: Number, min: 0, default: 0 },
    date: { type: Date, default: () => new Date() },

    status: { type: String, enum: ['draft', 'submitted', 'ready_to_bill', 'approved', 'billed', 'paid', 'excluded', 'rejected'], default: 'draft', index: true },
    submittedAt: { type: Date },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },

    external: {
      system: { type: String },
      entryId: { type: String },
      syncedAt: { type: Date },
    },
  },
  { timestamps: true }
);

TimeEntrySchema.index({ clientId: 1, caseId: 1, date: -1 });
TimeEntrySchema.index(
  { activityId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      activityId: { $exists: true },
    },
  }
);

TimeEntrySchema.plugin(workspaceScopedPlugin);
export const TimeEntry = mongoose.model('TimeEntry', TimeEntrySchema);
export default TimeEntry;
