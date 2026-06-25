import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { Invoice } from '../../invoices/models/Invoice.js';
import { Payment } from '../../payments/models/Payment.js';
import { WorkSession } from '../../workSessions/models/WorkSession.js';

async function emailHealth() {
  if (!process.env.SMTP_HOST) return { ok: true, configured: false, message: 'SMTP not configured; JSON transport fallback is used' };
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.verify();
  return { ok: true, configured: true };
}

export async function readiness(_req, res) {
  const checks = {
    database: { ok: mongoose.connection.readyState === 1, readyState: mongoose.connection.readyState },
    email: { ok: false },
    backgroundJobs: { ok: true, scheduler: process.env.BACKGROUND_JOBS_ENABLED === 'true' ? 'external' : 'not_configured' },
  };

  try {
    await mongoose.connection.db.admin().ping();
    checks.database.ok = true;
  } catch (error) {
    checks.database = { ok: false, error: error.message, readyState: mongoose.connection.readyState };
  }

  try {
    checks.email = await emailHealth();
  } catch (error) {
    checks.email = { ok: false, error: error.message };
  }

  const ok = Object.values(checks).every((check) => check.ok);
  res.status(ok ? 200 : 503).json({ ok, checks });
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
