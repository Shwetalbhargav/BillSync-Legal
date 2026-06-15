import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    key: { type: String, index: true },
    name: String,
    type: String,
    url: String,
  },
  { _id: false }
);

const legalDocumentSchema = new mongoose.Schema(
  {
    source: sourceSchema,
    jurisdiction: {
      country: { type: String, default: 'India', index: true },
      court: { type: String, index: true },
      level: { type: String, index: true },
      state: { type: String, index: true },
    },
    documentType: {
      type: String,
      enum: [
        'court_order',
        'judgment',
        'notice',
        'circular',
        'press_release',
        'collegium_resolution',
        'gazette',
        'act',
        'amendment_act',
        'rule',
        'notification',
        'act_or_rule',
        'consolidated_law',
        'case_lookup',
        'legal_news',
        'unknown',
      ],
      default: 'unknown',
      index: true,
    },
    title: { type: String, required: true, index: 'text' },
    caseNumber: { type: String, index: true },
    diaryNumber: String,
    neutralCitation: String,
    parties: {
      petitioner: String,
      respondent: String,
    },
    law: {
      actName: String,
      section: String,
      amendmentOf: String,
      ministry: String,
    },
    dates: {
      publicationDate: { type: Date, index: true },
      judgmentDate: Date,
      uploadDate: Date,
      fetchedAt: { type: Date, default: Date.now, index: true },
    },
    files: {
      pdfUrl: { type: String, index: true },
      sourcePageUrl: String,
      pdfHash: { type: String, unique: true, sparse: true },
      textHash: String,
      contentType: String,
      sizeBytes: Number,
    },
    content: {
      rawText: { type: String, index: 'text' },
      summary: String,
      language: { type: String, default: 'en' },
    },
    tags: [{ type: String, index: true }],
    status: {
      isActive: { type: Boolean, default: true },
      isDuplicate: { type: Boolean, default: false },
      parseStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'skipped'],
        default: 'pending',
      },
      error: String,
    },
  },
  { timestamps: true }
);

legalDocumentSchema.index({ title: 'text', 'content.rawText': 'text', caseNumber: 'text', tags: 'text' });
legalDocumentSchema.index({ documentType: 1, 'dates.publicationDate': -1 });
legalDocumentSchema.index({ 'source.key': 1, 'files.pdfUrl': 1 }, { unique: true, sparse: true });

export const LegalDocument =
  mongoose.models.LegalDocument || mongoose.model('LegalDocument', legalDocumentSchema);

export default LegalDocument;
