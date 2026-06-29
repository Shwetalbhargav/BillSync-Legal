import { afterEach, describe, expect, test, vi } from 'vitest';
import mongoose from 'mongoose';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      verify: vi.fn().mockRejectedValue(new Error('SMTP credentials rejected')),
    })),
  },
}));

const { readiness } = await import('../modules/operations/controllers/healthController.js');

function setMongooseConnection({ readyState = 1, ping = vi.fn().mockResolvedValue({ ok: 1 }) } = {}) {
  Object.defineProperty(mongoose.connection, 'readyState', {
    configurable: true,
    value: readyState,
  });
  Object.defineProperty(mongoose.connection, 'db', {
    configurable: true,
    value: {
      admin: () => ({ ping }),
    },
  });
}

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

afterEach(() => {
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_HEALTH_REQUIRED;
  delete process.env.HEALTH_CHECK_TIMEOUT_MS;
  setMongooseConnection();
});

describe('operations readiness', () => {
  test('does not fail readiness for optional SMTP verification failure', async () => {
    process.env.SMTP_HOST = 'smtp.example.test';
    setMongooseConnection();
    const res = mockResponse();

    await readiness({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.checks.database.ok).toBe(true);
    expect(res.body.checks.email.ok).toBe(true);
    expect(res.body.checks.email.warning).toContain('SMTP health failed');
  });

  test('fails readiness when database ping fails', async () => {
    setMongooseConnection({
      readyState: 0,
      ping: vi.fn().mockRejectedValue(new Error('database unavailable')),
    });
    const res = mockResponse();

    await readiness({}, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.checks.database.ok).toBe(false);
    expect(res.body.checks.database.error).toBe('database unavailable');
  });
});
