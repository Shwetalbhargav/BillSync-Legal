import { MAX_QUEUE_ITEMS } from './config.js';

const QUEUE_KEY = 'syncQueue';

function nowIso() {
  return new Date().toISOString();
}

function retryDelayMs(attempts) {
  const base = Math.min(30 * 60 * 1000, 2 ** Math.max(0, attempts - 1) * 15000);
  return base + Math.floor(Math.random() * 2000);
}

export class SyncQueue {
  constructor(store, client) {
    this.store = store;
    this.client = client;
  }

  list() {
    return Array.isArray(this.store.get(QUEUE_KEY)) ? this.store.get(QUEUE_KEY) : [];
  }

  save(items) {
    this.store.set(QUEUE_KEY, items.slice(0, MAX_QUEUE_ITEMS));
  }

  clear() {
    this.store.delete(QUEUE_KEY);
  }

  enqueue(item, error = '') {
    const queue = this.list();
    const key = item.key || `${item.type}:${item.workSessionId}:${item.body?.windowStart || item.body?.startedAt || nowIso()}`;
    const existing = queue.find((row) => row.key === key);
    const next = {
      key,
      type: item.type,
      workSessionId: item.workSessionId,
      body: item.body,
      attempts: existing?.attempts || 0,
      status: 'pending',
      lastError: error,
      createdAt: existing?.createdAt || nowIso(),
      updatedAt: nowIso(),
      nextRetryAt: new Date(Date.now() + retryDelayMs(existing?.attempts || 1)).toISOString(),
    };
    this.save(existing ? queue.map((row) => (row.key === key ? next : row)) : [next, ...queue]);
    return next;
  }

  async send(item) {
    if (item.type === 'activitySample') return this.client.activitySample(item.workSessionId, item.body);
    if (item.type === 'appUsageEvent') return this.client.appUsageEvent(item.workSessionId, item.body);
    if (item.type === 'heartbeat') return this.client.heartbeat(item.workSessionId, item.body);
    if (item.type === 'detectIdle') return this.client.detectIdle(item.workSessionId, item.body);
    throw new Error(`Unknown queue item type: ${item.type}`);
  }

  async sendOrQueue(item) {
    try {
      await this.send(item);
      return { queued: false };
    } catch (error) {
      this.enqueue(item, error.message || 'Sync failed');
      return { queued: true, error };
    }
  }

  async process({ force = false } = {}) {
    const queue = this.list();
    const now = Date.now();
    let changed = false;
    for (const item of queue) {
      if (item.status === 'synced') continue;
      if (!force && item.nextRetryAt && Date.parse(item.nextRetryAt) > now) continue;
      item.status = 'syncing';
      item.updatedAt = nowIso();
      changed = true;
      this.save(queue);
      try {
        await this.send(item);
        item.status = 'synced';
        item.syncedAt = nowIso();
        item.lastError = '';
      } catch (error) {
        item.status = 'pending';
        item.attempts = Number(item.attempts || 0) + 1;
        item.lastError = error.message || 'Sync failed';
        item.nextRetryAt = new Date(Date.now() + retryDelayMs(item.attempts)).toISOString();
      }
      item.updatedAt = nowIso();
      changed = true;
    }
    if (changed) {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      this.save(queue.filter((item) => item.status !== 'synced' || Date.parse(item.syncedAt || item.updatedAt) > cutoff));
    }
    return this.status();
  }

  status() {
    const items = this.list();
    const pending = items.filter((item) => item.status !== 'synced').length;
    return { pending, total: items.length, items };
  }
}
