import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { Invoice } from '../../invoices/models/Invoice.js';
import { Payment } from '../../payments/models/Payment.js';
import { WorkSession } from '../../workSessions/models/WorkSession.js';

const DEFAULT_HEALTH_TIMEOUT_MS = 2500;

function healthTimeoutMs(name) {
  const value = Number(process.env[name] || process.env.HEALTH_CHECK_TIMEOUT_MS || DEFAULT_HEALTH_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_HEALTH_TIMEOUT_MS;
}

async function withTimeout(label, promise, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => {
          const error = new Error(`${label} timed out after ${timeoutMs}ms`);
          error.code = 'HEALTH_CHECK_TIMEOUT';
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function emailHealth() {
  if (!process.env.SMTP_HOST) return { ok: true, configured: false, message: 'SMTP not configured; JSON transport fallback is used' };
  const timeoutMs = healthTimeoutMs('SMTP_HEALTH_TIMEOUT_MS');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: timeoutMs,
    greetingTimeout: timeoutMs,
    socketTimeout: timeoutMs,
  });
  await withTimeout('SMTP health check', transporter.verify(), timeoutMs);
  return { ok: true, configured: true };
}

export async function readiness(_req, res) {
  const smtpRequired = String(process.env.SMTP_HEALTH_REQUIRED || '').toLowerCase() === 'true';
  const checks = {
    database: { ok: false, readyState: mongoose.connection.readyState },
    email: { ok: false },
    backgroundJobs: { ok: true, scheduler: process.env.BACKGROUND_JOBS_ENABLED === 'true' ? 'external' : 'not_configured' },
  };

  try {
    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection is not initialized');
    }
    await withTimeout(
      'MongoDB ping',
      mongoose.connection.db.admin().ping(),
      healthTimeoutMs('DATABASE_HEALTH_TIMEOUT_MS'),
    );
    checks.database.ok = true;
  } catch (error) {
    checks.database = { ok: false, error: error.message, readyState: mongoose.connection.readyState };
  }

  try {
    checks.email = await emailHealth();
  } catch (error) {
    checks.email = {
      ok: !smtpRequired,
      configured: true,
      required: smtpRequired,
      warning: smtpRequired ? undefined : 'SMTP health failed, but SMTP is optional for readiness.',
      error: error.message,
    };
  }

  const ok = checks.database.ok && checks.email.ok && checks.backgroundJobs.ok;
  res.status(ok ? 200 : 503).json({
    ok,
    checks,
    timeoutMs: healthTimeoutMs('HEALTH_CHECK_TIMEOUT_MS'),
  });
}

export async function alerts(_req, res) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [failedCaptures, failedInvoiceDeliveries, unreconciledPayments] = await Promise.all([
    WorkSession.countDocuments({ 'captureHealth.status': { $in: ['failed', 'retrying'] }, updatedAt: { $gte: since } }),
    Invoice.countDocuments({ deliveryStatus: 'failed', updatedAt: { $gte: since } }),
    Payment.countDocuments({ status: 'pending', createdAt: { $lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }),
  ]);

  res.json({
    ok: failedCaptures === 0 && failedInvoiceDeliveries === 0 && unreconciledPayments === 0,
    windowHours: 24,
    alerts: {
      failedCaptures,
      failedInvoiceDeliveries,
      stalePaymentReconciliation: unreconciledPayments,
    },
  });
}
