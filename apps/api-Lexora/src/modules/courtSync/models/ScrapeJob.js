import mongoose from 'mongoose';

const scrapeJobSchema = new mongoose.Schema(
  {
    sourceKey: { type: String, index: true },
    sourceName: String,
    sourceUrl: String,
    startedAt: { type: Date, default: Date.now },
    finishedAt: Date,
    status: {
      type: String,
      enum: ['running', 'success', 'partial_success', 'failed'],
      default: 'running',
      index: true,
    },
    documentsFound: { type: Number, default: 0 },
    newDocuments: { type: Number, default: 0 },
    updatedDocuments: { type: Number, default: 0 },
    skippedDocuments: { type: Number, default: 0 },
    errors: [
      {
        message: String,
        url: String,
        stack: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const ScrapeJob = mongoose.models.ScrapeJob || mongoose.model('ScrapeJob', scrapeJobSchema);

export default ScrapeJob;
