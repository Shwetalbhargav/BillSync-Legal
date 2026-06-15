import LegalDocument from '../models/LegalDocument.js';

function buildFilter(query) {
  const filter = {};

  if (query.type) filter.documentType = query.type;
  if (query.sourceKey) filter['source.key'] = query.sourceKey;
  if (query.court) filter['jurisdiction.court'] = new RegExp(query.court, 'i');
  if (query.level) filter['jurisdiction.level'] = query.level;
  if (query.state) filter['jurisdiction.state'] = new RegExp(query.state, 'i');
  if (query.tag) filter.tags = query.tag;

  if (query.from || query.to) {
    filter['dates.publicationDate'] = {};
    if (query.from) filter['dates.publicationDate'].$gte = new Date(query.from);
    if (query.to) filter['dates.publicationDate'].$lte = new Date(query.to);
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  return filter;
}

export async function listDocuments(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;
    const filter = buildFilter(req.query);

    const sort = req.query.q
      ? { score: { $meta: 'textScore' }, 'dates.publicationDate': -1, createdAt: -1 }
      : { 'dates.publicationDate': -1, createdAt: -1 };

    const projection = req.query.q ? { score: { $meta: 'textScore' } } : {};

    const [items, total] = await Promise.all([
      LegalDocument.find(filter, projection).sort(sort).skip(skip).limit(limit).lean(),
      LegalDocument.countDocuments(filter),
    ]);

    res.json({ page, limit, total, totalPages: Math.ceil(total / limit), items });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentById(req, res, next) {
  try {
    const item = await LegalDocument.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Document not found' });
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function getLatestDocuments(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const items = await LegalDocument.find({})
      .sort({ 'dates.publicationDate': -1, createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

export async function getStats(req, res, next) {
  try {
    const [byType, bySource, latest] = await Promise.all([
      LegalDocument.aggregate([{ $group: { _id: '$documentType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      LegalDocument.aggregate([{ $group: { _id: '$source.key', name: { $first: '$source.name' }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      LegalDocument.findOne({}).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({ byType, bySource, latestSyncDocument: latest });
  } catch (error) {
    next(error);
  }
}
