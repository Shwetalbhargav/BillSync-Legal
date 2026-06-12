import { firmsApi } from "./firms.js";
import { backendGapAdapters } from "./gaps.js";
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

export const settingsWorkspaceApi = {
  async load({ firmId, includeUsers = true } = {}) {
    const [firmResult, settingsResult, usersResult, notificationResult, storageResult, permissionResult, invoiceResult] = await Promise.allSettled([
      firmId ? firmsApi.get(firmId) : Promise.resolve(DEFAULT_SETTINGS),
      firmId ? firmsApi.settings(firmId) : Promise.resolve(DEFAULT_SETTINGS),
      includeUsers ? usersApi.list({ limit: 100 }) : Promise.resolve([]),
      settleGap(backendGapAdapters.notificationDefaults),
      settleGap(backendGapAdapters.storageDefaults),
      settleGap(backendGapAdapters.permissionMatrix),
      settleGap(backendGapAdapters.invoiceDefaults),
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
      issues,
    };
  },
  updateFirm: (firmId, body) => firmsApi.replace(firmId, body),
  updateCurrency: (firmId, body) => firmsApi.updateCurrency(firmId, body),
  updateTaxSettings: (firmId, body) => firmsApi.updateTaxSettings(firmId, body),
  updateBillingPreferences: (firmId, body) => firmsApi.updateBillingPreferences(firmId, body),
};
