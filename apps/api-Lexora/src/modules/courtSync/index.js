import { Router } from 'express';
import legalDocumentRoutes from './routes/legalDocumentRoutes.js';
import sourceRoutes from './routes/sourceRoutes.js';
import syncRoutes from './routes/syncRoutes.js';

export { default as LegalDocument } from './models/LegalDocument.js';
export { default as ScrapeJob } from './models/ScrapeJob.js';
export { default as SourceConfig } from './models/SourceConfig.js';

const courtSyncRoutes = Router();

courtSyncRoutes.use('/documents', legalDocumentRoutes);
courtSyncRoutes.use('/sources', sourceRoutes);
courtSyncRoutes.use('/sync', syncRoutes);

courtSyncRoutes.get('/health', (req, res) => {
  res.json({ ok: true, module: 'court-sync', time: new Date().toISOString() });
});

export { courtSyncRoutes };
export default courtSyncRoutes;
