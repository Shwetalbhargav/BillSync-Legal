import { analyticsApi } from "./analytics.js";
import { backendGapAdapters } from "./gaps.js";
import { firmsApi } from "./firms.js";
import { invoicesApi } from "./invoices.js";
import { reportsApi } from "./reports.js";
import { asList, normalizeInvoice } from "./normalizers.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function unwrap(response) {
  return response?.data || response;
}

function money(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeTaxSettings(data = {}) {
  const source = unwrap(data) || {};
  const settings = source.taxSettings || source;
  return {
    taxName: settings.taxName || "GST",
    taxRatePct: Number(settings.taxRatePct || 0),
    inclusive: Boolean(settings.inclusive),
    currency: source.currency || "INR",
  };
}

function normalizeGstSummary(data = {}) {
  const source = unwrap(data) || {};
  return {
    invoiceCount: Number(source.invoiceCount || 0),
    taxableAmount: money(source.taxableAmount),
    gstAmount: money(source.gstAmount),
    grossAmount: money(source.grossAmount),
  };
}

function normalizeInvoiceTax(invoice = {}) {
  const normalized = normalizeInvoice(invoice);
  return {
    ...normalized,
    taxName: invoice.taxName || invoice.taxDetails?.taxName || "GST",
    taxRatePct: Number(invoice.taxRatePct ?? invoice.taxDetails?.taxRatePct ?? 0),
    taxInclusive: Boolean(invoice.taxInclusive ?? invoice.taxDetails?.inclusive),
    taxableAmount: money(invoice.subtotal ?? invoice.taxDetails?.taxableAmount),
    taxAmount: money(invoice.tax ?? invoice.taxDetails?.taxAmount),
  };
}

export const taxWorkspaceApi = {
  async loadGst({ firmId, params = {} } = {}) {
    const [settingsResult, summaryResult, invoiceResult, invoiceTotalsResult] = await Promise.allSettled([
      firmId ? firmsApi.settings(firmId) : Promise.reject(new Error("Firm details are needed.")),
      reportsApi.gstSummary(params),
      invoicesApi.list({ limit: 25, ...params }),
      analyticsApi.invoices(params),
    ]);

    return {
      settings: normalizeTaxSettings(settledValue(settingsResult, {})),
      summary: normalizeGstSummary(settledValue(summaryResult, {})),
      invoices: asList(settledValue(invoiceResult, [])).map(normalizeInvoiceTax),
      invoiceTotals: unwrap(settledValue(invoiceTotalsResult, {}))?.totals || {},
      issues: [
        issueMessage(settingsResult, "Firm tax settings could not be refreshed."),
        issueMessage(summaryResult, "GST summary could not be refreshed."),
        issueMessage(invoiceResult, "Invoice tax details could not be refreshed."),
        issueMessage(invoiceTotalsResult, "Invoice totals could not be refreshed."),
      ].filter(Boolean),
    };
  },

  updateGstSettings(firmId, body) {
    return firmsApi.updateTaxSettings(firmId, body);
  },

  loadTds() {
    return backendGapAdapters.tdsSettings.load();
  },
};
