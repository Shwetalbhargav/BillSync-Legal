import mongoose from 'mongoose';
import { AiUsageEvent } from '../../ai/models/AiUsageEvent.js';
import { StoredDocument } from '../../documentStorage/models/StoredDocument.js';
import Membership from '../models/Membership.js';
import { PlatformInvoice } from '../models/PlatformInvoice.js';
import { PlatformPayment } from '../models/PlatformPayment.js';
import { PlatformUsageRecord } from '../models/PlatformUsageRecord.js';
import { getWorkspaceSubscription, publicPlan, publicSubscription } from './subscriptionFeatureService.js';

export const PLATFORM_BILLING_PERMISSIONS = {
  read: 'platform_billing.read',
  manage: 'platform_billing.manage',
  pay: 'platform_billing.pay',
};

const PAYMENT_PROVIDER_CONFIGURED = Boolean(process.env.PLATFORM_BILLING_PROVIDER || process.env.STRIPE_SECRET_KEY || process.env.RAZORPAY_KEY_ID);

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

function monthEnd(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0));
}

function toObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || '')) ? new mongoose.Types.ObjectId(value) : value;
}

function canReadPlatformCollections() {
  return process.env.NODE_ENV !== 'test' || PlatformInvoice.db?.readyState === 1;
}

function formatInvoiceNumber(workspaceId, date = new Date()) {
  const suffix = String(workspaceId || 'workspace').slice(-6).toUpperCase();
  const month = date.toISOString().slice(0, 7).replace('-', '');
  return `LEX-${month}-${suffix}`;
}

export function resolvePlatformUsage({ plan = {}, seats = 0, storageGb = 0, aiCredits = 0 }) {
  const limits = plan.limits || plan.usage || {};
  const seatLimit = Number(limits.members ?? limits.seats ?? 0);
  const storageLimit = Number(limits.storageGb ?? 0);
  const aiCreditLimit = Number(limits.aiCredits ?? 0);
  return {
    seats: {
      label: 'Seats',
      metric: 'seats',
      included: seatLimit,
      used: Number(seats || 0),
      remaining: Math.max(seatLimit - Number(seats || 0), 0),
      overage: Math.max(Number(seats || 0) - seatLimit, 0),
    },
    storage: {
      label: 'Storage',
      metric: 'storage_gb',
      included: storageLimit,
      used: Number(storageGb || 0),
      remaining: Math.max(storageLimit - Number(storageGb || 0), 0),
      overage: Math.max(Number(storageGb || 0) - storageLimit, 0),
    },
    aiCredits: {
      label: 'AI credits',
      metric: 'ai_credits',
      included: aiCreditLimit,
      used: Number(aiCredits || 0),
      remaining: Math.max(aiCreditLimit - Number(aiCredits || 0), 0),
      overage: Math.max(Number(aiCredits || 0) - aiCreditLimit, 0),
    },
  };
}

export function publicPlatformInvoice(invoice) {
  if (!invoice) return null;
  const obj = typeof invoice.toObject === 'function' ? invoice.toObject() : invoice;
  return {
    id: String(obj._id || obj.id),
    number: obj.invoiceNumber,
    status: obj.status,
    billingReason: obj.billingReason,
    currency: obj.currency || 'INR',
    periodStart: obj.periodStart,
    periodEnd: obj.periodEnd,
    dueAt: obj.dueAt,
    paidAt: obj.paidAt,
    subtotalPaise: Number(obj.subtotalPaise || 0),
    taxPaise: Number(obj.taxPaise || 0),
    totalPaise: Number(obj.totalPaise || 0),
    balancePaise: Number(obj.balancePaise || 0),
    lines: obj.lines || [],
    hostedInvoiceUrl: obj.hostedInvoiceUrl || '',
  };
}

export function publicPlatformPayment(payment) {
  if (!payment) return null;
  const obj = typeof payment.toObject === 'function' ? payment.toObject() : payment;
  return {
    id: String(obj._id || obj.id),
    platformInvoiceId: String(obj.platformInvoiceId || ''),
    status: obj.status,
    amountPaise: Number(obj.amountPaise || 0),
    currency: obj.currency || 'INR',
    method: obj.method || '',
    failureCode: obj.failureCode || '',
    failureMessage: obj.failureMessage || '',
    receivedAt: obj.receivedAt,
  };
}

export async function getMeasuredUsage({ workspaceId, periodStart = monthStart(), periodEnd = monthEnd() }) {
  if (!(await canReadPlatformCollections())) {
    return { seats: 0, storageGb: 0, aiCredits: 0 };
  }
  const workspaceObjectId = toObjectId(workspaceId);
  const [seats, storageRows, aiRows] = await Promise.all([
    Membership.countDocuments({ workspaceId, status: 'active' }),
    StoredDocument.aggregate([
      { $match: { workspaceId: workspaceObjectId, status: { $ne: 'deleted' } } },
      { $group: { _id: null, bytes: { $sum: { $ifNull: ['$sizeBytes', 0] } } } },
    ]),
    AiUsageEvent.aggregate([
      {
        $match: {
          workspaceId: workspaceObjectId,
          status: 'succeeded',
          createdAt: { $gte: periodStart, $lt: periodEnd },
        },
      },
      { $group: { _id: null, credits: { $sum: '$credits' } } },
    ]),
  ]);
  return {
    seats,
    storageGb: Number(((storageRows[0]?.bytes || 0) / (1024 ** 3)).toFixed(4)),
    aiCredits: Number(aiRows[0]?.credits || 0),
  };
}

export async function recordUsageSnapshot({ workspaceId, periodStart = monthStart(), periodEnd = monthEnd(), source = 'system' }) {
  const measured = await getMeasuredUsage({ workspaceId, periodStart, periodEnd });
  if (!(await canReadPlatformCollections())) {
    return { measured, records: [] };
  }
  const records = [];
  for (const [key, metric] of [
    ['seats', 'seats'],
    ['storageGb', 'storage_gb'],
    ['aiCredits', 'ai_credits'],
  ]) {
    const row = await PlatformUsageRecord.findOneAndUpdate(
      { workspaceId, metric, periodStart, periodEnd },
      { $set: { quantity: measured[key], source, measuredAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    records.push(row);
  }
  return { measured, records };
}

export async function getPlatformBillingOverview({ workspaceId }) {
  const periodStart = monthStart();
  const periodEnd = monthEnd();
  const [{ subscription, plan }, usageSnapshot] = await Promise.all([
    getWorkspaceSubscription(workspaceId),
    recordUsageSnapshot({ workspaceId, periodStart, periodEnd }),
  ]);
  const usage = resolvePlatformUsage({ plan, ...usageSnapshot.measured });
  const [invoices, payments] = await (await canReadPlatformCollections()
    ? Promise.all([
      PlatformInvoice.find({ workspaceId }).sort({ createdAt: -1 }).limit(12),
      PlatformPayment.find({ workspaceId }).sort({ createdAt: -1 }).limit(12),
    ])
    : Promise.resolve([[], []]));

  const latestPayment = payments[0] || null;
  return {
    subscription: publicSubscription(subscription, plan),
    plan: publicPlan(plan),
    usage,
    invoices: invoices.map(publicPlatformInvoice),
    payments: payments.map(publicPlatformPayment),
    provider: {
      configured: PAYMENT_PROVIDER_CONFIGURED,
      status: PAYMENT_PROVIDER_CONFIGURED ? 'connected' : 'not_configured',
      message: PAYMENT_PROVIDER_CONFIGURED
        ? 'Subscription payments are connected.'
        : 'Subscription payments are not connected yet. Platform invoices can be reviewed, but checkout is not available.',
    },
    paymentState: latestPayment?.status === 'failed'
      ? {
        status: 'failed',
        message: latestPayment.failureMessage || 'The latest Lexora subscription payment did not go through.',
      }
      : { status: latestPayment?.status || 'not_started', message: '' },
  };
}

export async function ensureCurrentPlatformInvoice({ workspaceId }) {
  const { subscription, plan } = await getWorkspaceSubscription(workspaceId);
  const periodStart = subscription?.currentPeriodStart || monthStart();
  const periodEnd = subscription?.currentPeriodEnd || monthEnd();
  const existing = await PlatformInvoice.findOne({ workspaceId, periodStart, billingReason: 'subscription_cycle' });
  if (existing) return existing;

  const price = plan?.price || {};
  const amountPaise = Number(price.amountPaise || 0);
  return PlatformInvoice.create({
    workspaceId,
    subscriptionId: subscription?._id,
    invoiceNumber: formatInvoiceNumber(workspaceId, periodStart),
    status: amountPaise > 0 ? 'open' : 'paid',
    billingReason: 'subscription_cycle',
    currency: price.currency || 'INR',
    periodStart,
    periodEnd,
    dueAt: periodEnd,
    paidAt: amountPaise > 0 ? null : new Date(),
    subtotalPaise: amountPaise,
    totalPaise: amountPaise,
    balancePaise: amountPaise,
    lines: [{
      metric: 'subscription',
      label: `Lexora ${plan?.name || 'Workspace'} subscription`,
      quantity: 1,
      unitAmountPaise: amountPaise,
      amountPaise,
    }],
    metadata: { ledger: 'platform_subscription' },
  });
}

export async function recordPlatformPaymentState({ workspaceId, platformInvoiceId, status, amountPaise, failureMessage, method = 'manual' }) {
  if (!['pending', 'succeeded', 'failed', 'refunded'].includes(status)) {
    const error = new Error('Choose a valid subscription payment state.');
    error.statusCode = 400;
    throw error;
  }
  const invoice = await PlatformInvoice.findOne({ workspaceId, _id: platformInvoiceId });
  if (!invoice) {
    const error = new Error('Subscription invoice was not found.');
    error.statusCode = 404;
    throw error;
  }
  const payment = await PlatformPayment.create({
    workspaceId,
    platformInvoiceId: invoice._id,
    status,
    amountPaise: Number(amountPaise ?? invoice.balancePaise ?? invoice.totalPaise ?? 0),
    currency: invoice.currency,
    method,
    failureMessage,
    receivedAt: status === 'succeeded' || status === 'failed' ? new Date() : null,
    metadata: { ledger: 'platform_subscription' },
  });

  if (status === 'succeeded') {
    invoice.status = 'paid';
    invoice.balancePaise = 0;
    invoice.paidAt = payment.receivedAt;
    await invoice.save();
  }
  if (status === 'failed') {
    invoice.status = 'past_due';
    await invoice.save();
  }

  return { payment, invoice };
}
