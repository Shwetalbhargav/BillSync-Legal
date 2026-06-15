import { courtSyncSources } from '../config/sources.js';
import SourceConfig from '../models/SourceConfig.js';

export async function seedSources() {
  const results = [];

  for (const source of courtSyncSources) {
    const result = await SourceConfig.findOneAndUpdate(
      { key: source.key },
      { $set: source },
      { upsert: true, new: true }
    );
    results.push(result.key);
  }

  return results;
}
