import mongoose from 'mongoose';

const AppUsageEventSchema = new mongoose.Schema(
  {
    workSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkSession', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', index: true },

    appName: { type: String, required: true, trim: true, maxlength: 120, index: true },
    url: { type: String, trim: true, maxlength: 2048 },
    domain: { type: String, trim: true, lowercase: true, maxlength: 255, index: true },
    title: { type: String, trim: true, maxlength: 180 },
    startedAt: { type: Date, required: true, index: true },
    endedAt: { type: Date, required: true, index: true },
    durationSeconds: { type: Number, required: true, min: 1, max: 86400 },
    platform: {
      type: String,
      enum: ['desktop_windows', 'desktop_macos', 'desktop_linux', 'mobile_ios', 'mobile_android', 'web', 'unknown'],
      default: 'unknown',
      index: true,
    },
    sourceApp: {
      type: String,
      enum: ['desktop_agent', 'mobile_agent', 'web_meter', 'manual_agent', 'chrome_extension', 'unknown'],
      default: 'unknown',
      index: true,
    },
    privacyPolicy: {
      type: String,
      enum: ['app_url_duration_only_no_content'],
      default: 'app_url_duration_only_no_content',
      required: true,
    },
  },
  { timestamps: true, strict: true }
);

AppUsageEventSchema.index({ workSessionId: 1, startedAt: 1, appName: 1 });
AppUsageEventSchema.index({ userId: 1, startedAt: -1 });
AppUsageEventSchema.index({ domain: 1, startedAt: -1 });

export const AppUsageEvent = mongoose.model('AppUsageEvent', AppUsageEventSchema);
export default AppUsageEvent;
