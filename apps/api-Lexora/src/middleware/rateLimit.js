const buckets = new Map();

function keyFor(req, scope) {
  return `${scope}:${req.ip || req.socket?.remoteAddress || 'unknown'}:${String(req.body?.mobile || req.body?.email || '').toLowerCase()}`;
}

export function rateLimit({ windowMs = 60_000, max = 120, scope = 'api' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = keyFor(req, scope);
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };
    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }
    bucket.count += 1;
    buckets.set(key, bucket);

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(max - bucket.count, 0)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      return res.status(429).json({ ok: false, message: 'Too many requests' });
    }
    next();
  };
}

