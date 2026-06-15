import SourceConfig from '../models/SourceConfig.js';
import { seedSources } from '../services/sourceSeeder.js';

export async function listSources(req, res, next) {
  try {
    const filter = {};
    if (req.query.enabled) filter.enabled = req.query.enabled === 'true';
    if (req.query.recommendedForScraping) {
      filter.recommendedForScraping = req.query.recommendedForScraping === 'true';
    }
    const sources = await SourceConfig.find(filter).sort({ enabled: -1, name: 1 }).lean();
    res.json({ items: sources });
  } catch (error) {
    next(error);
  }
}

export async function seed(req, res, next) {
  try {
    const keys = await seedSources();
    res.json({ message: 'Sources seeded', keys });
  } catch (error) {
    next(error);
  }
}

export async function updateSource(req, res, next) {
  try {
    const source = await SourceConfig.findOneAndUpdate(
      { key: req.params.key },
      { $set: req.body },
      { new: true }
    );
    if (!source) return res.status(404).json({ message: 'Source not found' });
    res.json(source);
  } catch (error) {
    next(error);
  }
}
