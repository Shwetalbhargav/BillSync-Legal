import { firmsApi } from "./firms.js";
import { backendGapAdapters } from "./gaps.js";
import { request } from "./client.js";
import { asList, normalizeUser, toId } from "./normalizers.js";
import { usersApi } from "./users.js";

const DEFAULT_SETTINGS = {
  id: "",
  name: "",
  currency: "INR",
  taxSettings: {
    taxName: "GST",
    taxRatePct: 0,
    inclusive: false,
  },
  billingPreferences: {
    defaultRate: 0,
    autoSync: false,
  },
};

function unwrap(data) {
  return data?.data || data?.firm || data?.settings || data || {};
}

export function normalizeFirmSettings(firm = {}, settings = {}) {
  const firmData = unwrap(firm);
  const settingsData = unwrap(settings);
  const merged = { ...firmData, ...settingsData };
  const taxSettings = merged.taxSettings || {};
  const billingPreferences = merged.billingPreferences || {};

  return {
    id: toId(merged) || toId(firmData),
    name: merged.name || firmData.name || "",
    currency: merged.currency || DEFAULT_SETTINGS.currency,
    taxSettings: {
      taxName: taxSettings.taxName || DEFAULT_SETTINGS.taxSettings.taxName,
      taxRatePct: Number(taxSettings.taxRatePct ?? DEFAULT_SETTINGS.taxSettings.taxRatePct),
      inclusive: Boolean(taxSettings.inclusive),
    },
    billingPreferences: {
      defaultRate: Number(billingPreferences.defaultRate ?? DEFAULT_SETTINGS.billingPreferences.defaultRate),
      autoSync: Boolean(billingPreferences.autoSync),
    },
    raw: merged,
  };
}

async function settleGap(adapter) {
  try {
    await adapter.load();
    return { status: "ready", note: adapter.note, routeNeeded: adapter.routeNeeded };
  } catch (error) {
    return {
      status: "not-configured",
      message: error?.userMessage || error?.message || "This setting is not configured yet.",
      note: adapter.note,
      routeNeeded: adapter.routeNeeded,
    };
  }
}

function roleLabel(role = "") {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Team";
}

function moneyPaise(value = 0, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(Number(value || 0) / 100);
}

function normalizePlatformBilling(response = {}) {
  const data = response?.data || response || {};
  const plan = data.plan || {};
  const subscription = data.subscription || {};
  const invoices = Array.isArray(data.invoices) ? data.invoices : [];
  const payments = Array.isArray(data.payments) ? data.payments : [];
  const currency = plan.price?.currency || invoices[0]?.currency || "INR";
  return {
    planName: plan.name || subscription.planKey || "Not selected",
    status: subscription.status || data.state || "not_configured",
    price: moneyPaise(plan.price?.amountPaise || 0, currency),
    interval: plan.price?.interval || "month",
    provider: data.provider || { configured: false, status: "not_configured", message: "Subscription payments are not connected yet." },
    usage: data.usage || {},
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      total: moneyPaise(invoice.totalPaise, invoice.currency || currency),
      balance: moneyPaise(invoice.balancePaise, invoice.currency || currency),
      dueAt: invoice.dueAt,
      raw: invoice,
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      status: payment.status,
      amount: moneyPaise(payment.amountPaise, payment.currency || currency),
      failureMessage: payment.failureMessage || "",
      receivedAt: payment.receivedAt,
      raw: payment,
    })),
    paymentState: data.paymentState || { status: "not_started", message: "" },
    raw: data,
  };
}

function normalizeEnterprise(response = {}) {
  const data = response?.data || response || {};
  const emptyUnits = { departments: [], offices: [], practiceGroups: [] };
  return {
    enabled: Boolean(data.enabled),
    state: data.state || (data.enabled ? "enabled" : "hidden"),
    message: data.message || "",
    units: data.units || emptyUnits,
    settings: Array.isArray(data.settings) ? data.settings : [],
    apiKeys: Array.isArray(data.apiKeys) ? data.apiKeys : [],
    webhooks: Array.isArray(data.webhooks) ? data.webhooks : [],
    auditEvents: Array.isArray(data.auditEvents) ? data.auditEvents : [],
    backendGaps: Array.isArray(data.backendGaps) ? data.backendGaps : [],
  };
}

export const settingsWorkspaceApi = {
  async load({ firmId, includeUsers = true } = {}) {
    const [firmResult, settingsResult, usersResult, notificationResult, storageResult, permissionResult, invoiceResult, platformBillingResult, enterpriseResult] = await Promise.allSettled([
      firmId ? firmsApi.get(firmId) : Promise.resolve(DEFAULT_SETTINGS),
      firmId ? firmsApi.settings(firmId) : Promise.resolve(DEFAULT_SETTINGS),
      includeUsers ? usersApi.list({ limit: 100 }) : Promise.resolve([]),
      settleGap(backendGapAdapters.notificationDefaults),
      settleGap(backendGapAdapters.storageDefaults),
      settleGap(backendGapAdapters.permissionMatrix),
      settleGap(backendGapAdapters.invoiceDefaults),
      request("/api/workspace/platform-billing"),
      request("/api/workspace/enterprise"),
    ]);

    const firm = normalizeFirmSettings(
      firmResult.status === "fulfilled" ? firmResult.value : DEFAULT_SETTINGS,
      settingsResult.status === "fulfilled" ? settingsResult.value : DEFAULT_SETTINGS,
    );
    const users = usersResult.status === "fulfilled" ? asList(usersResult.value).map(normalizeUser) : [];
    const issues = [];

    if (!firmId) {
      issues.push({
        title: "Firm account needed",
        message: "Sign in with a firm account before changing shared settings.",
      });
    }
    if (!firm.name) {
      issues.push({
        title: "Firm name is not set",
        message: "Add a firm name so invoices, reports, and workspace pages feel complete.",
      });
    }
    if (settingsResult.status === "rejected") {
      issues.push({
        title: "Firm settings need attention",
        message: settingsResult.reason?.userMessage || "Firm defaults could not be loaded right now.",
      });
    }
    if (usersResult.status === "rejected") {
      issues.push({
        title: "Team list needs attention",
        message: usersResult.reason?.userMessage || "The team list could not be loaded right now.",
      });
    }

    return {
      firm,
      users,
      roleSummary: users.reduce((summary, user) => {
        const label = roleLabel(user.role);
        summary[label] = (summary[label] || 0) + 1;
        return summary;
      }, {}),
      defaults: {
        notifications: notificationResult.value,
        storage: storageResult.value,
        permissions: permissionResult.value,
        invoices: invoiceResult.value,
      },
      platformBilling: platformBillingResult.status === "fulfilled"
        ? normalizePlatformBilling(platformBillingResult.value)
        : {
          status: "not_available",
          message: platformBillingResult.reason?.userMessage || "Lexora subscription billing could not be loaded right now.",
          provider: { configured: false, status: "not_configured", message: "Subscription payment setup is not connected yet." },
          usage: {},
          invoices: [],
          payments: [],
          paymentState: { status: "not_started", message: "" },
        },
      enterprise: enterpriseResult.status === "fulfilled"
        ? normalizeEnterprise(enterpriseResult.value)
        : {
          enabled: false,
          state: "error",
          message: enterpriseResult.reason?.userMessage || "Enterprise controls could not be loaded right now.",
          units: { departments: [], offices: [], practiceGroups: [] },
          settings: [],
          apiKeys: [],
          webhooks: [],
          auditEvents: [],
          backendGaps: [],
        },
      issues,
    };
  },
  createPlatformInvoice: () => request("/api/workspace/platform-billing/invoices/current", { method: "POST" }),
  recordPlatformPayment: (invoiceId, body) => request(`/api/workspace/platform-billing/invoices/${invoiceId}/payments`, { method: "POST", body }),
  createEnterpriseUnit: (body) => request("/api/workspace/enterprise/units", { method: "POST", body }),
  updateEnterpriseSetting: (category, body) => request(`/api/workspace/enterprise/settings/${category}`, { method: "PUT", body }),
  updateFirm: (firmId, body) => firmsApi.replace(firmId, body),
  updateCurrency: (firmId, body) => firmsApi.updateCurrency(firmId, body),
  updateTaxSettings: (firmId, body) => firmsApi.updateTaxSettings(firmId, body),
  updateBillingPreferences: (firmId, body) => firmsApi.updateBillingPreferences(firmId, body),
};
