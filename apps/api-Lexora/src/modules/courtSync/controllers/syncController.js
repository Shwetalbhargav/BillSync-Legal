import SourceConfig from '../models/SourceConfig.js';
import ScrapeJob from '../models/ScrapeJob.js';
import { syncSource } from '../services/scraperService.js';
import { seedSources } from '../services/sourceSeeder.js';

async function ensureSeededSources() {
  const count = await SourceConfig.countDocuments();
  if (!count) await seedSources();
}

export async function syncOne(req, res, next) {
  try {
    await ensureSeededSources();
    const source = await SourceConfig.findOne({ key: req.params.key }).lean();
    if (!source) return res.status(404).json({ message: 'Source not found' });

    const result = await syncSource(source, {
      force: req.query.force === 'true',
      parsePdf: req.query.parsePdf === 'true',
      maxItems: req.query.maxItems,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function syncAll(req, res, next) {
  try {
    await ensureSeededSources();
    const limit = Math.min(Math.max(Number(req.query.limit || 3), 1), 9);
    const sources = await SourceConfig.find({ enabled: true, strategy: { $in: ['html_pdf_links', 'rss_xml'] } }).limit(limit).lean();
    const results = [];

    for (const source of sources) {
      try {
        const result = await syncSource(source, {
          parsePdf: req.query.parsePdf === 'true',
          maxItems: req.query.maxItems || 10,
        });
        results.push({ sourceKey: source.key, success: true, result });
      } catch (error) {
        results.push({ sourceKey: source.key, success: false, error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    next(error);
  }
}

export async function listJobs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const jobs = await ScrapeJob.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ items: jobs });
  } catch (error) {
    next(error);
  }
}
