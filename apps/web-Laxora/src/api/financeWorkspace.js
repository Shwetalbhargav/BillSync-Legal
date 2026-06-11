import { analyticsApi } from "./analytics.js";
import { arApi } from "./ar.js";
import { integrationLogsApi } from "./integrations.js";
import { invoicesApi } from "./invoices.js";
import { kpiApi, kpiSnapshotsApi } from "./kpi.js";
import { paymentsApi } from "./payments.js";
import { reportsApi } from "./reports.js";
import { revenueApi } from "./revenue.js";
import { asList, normalizeInvoice, normalizePayment, toId } from "./normalizers.js";

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

function percent(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 0;
  return amount > 1 ? amount : amount * 100;
}

function normalizeKpiSummary(data = {}) {
  const source = unwrap(data) || {};
  return {
    revenue: money(source.revenue),
    wip: money(source.WIP ?? source.wip),
    ar: money(source.AR ?? source.ar),
    utilization: percent(source.utilization),
    realization: percent(source.realization),
    invoiced: money(source.invoiced || source.invoicedTotal),
  };
}

function normalizeAging(data = {}) {
  const source = unwrap(data) || {};
  return {
    current: money(source.current),
    bkt_1_30: money(source.bkt_1_30),
    bkt_31_60: money(source.bkt_31_60),
    bkt_61_90: money(source.bkt_61_90),
    bkt_90_plus: money(source.bkt_90_plus),
    totalOutstanding: money(source.totalOutstanding),
    invoiceCount: Number(source.invoiceCount || 0),
  };
}

function normalizeRevenueRow(row = {}) {
  return {
    id: String(row.group || row.month || row._id || Math.random()),
    label: row.group || row.month || "Period",
    amount: money(row.amount || row.value),
    entries: Number(row.entries || 0),
    minutes: Number(row.billableMinutes || row.minutes || 0),
  };
}

function normalizeAuditLog(row = {}) {
  return {
    id: toId(row),
    platform: row.platform || "Workspace",
    status: row.status || "recorded",
    action: row.action || row.operation || row.event || "Activity",
    summary: row.message || row.description || row.errorMessage || "Activity recorded",
    createdAt: row.createdAt || row.updatedAt || "",
    invoiceId: row.invoiceId || "",
    billableId: row.billableId || "",
    raw: row,
  };
}

function normalizeSnapshot(row = {}) {
  return {
    id: toId(row),
    month: row.month || "Month",
    scope: row.scope || "firm",
    revenue: money(row.revenue),
    wip: money(row.WIP ?? row.wip),
    ar: money(row.AR ?? row.ar),
    utilization: percent(row.utilization),
    realization: percent(row.realization),
  };
}

function normalizeReportSummary(data = {}) {
  const source = unwrap(data) || {};
  return {
    invoiceCount: Number(source.invoiceCount || 0),
    taxableAmount: money(source.taxableAmount),
    gstAmount: money(source.gstAmount),
    grossAmount: money(source.grossAmount),
  };
}

export const financeWorkspaceApi = {
  async loadDashboard(params = {}) {
    const [kpiResult, revenueResult, monthlyResult, summaryResult, agingResult, invoiceResult, paymentResult, unbilledClientResult, utilizationTrendResult] = await Promise.allSettled([
      kpiApi.summary(params),
      revenueApi.breakdown({ ...params, groupBy: "client" }),
      revenueApi.monthly({ months: 6 }),
      paymentsApi.financeSummary(),
      arApi.aging(),
      invoicesApi.list({ limit: 8 }),
      paymentsApi.list({ limit: 8 }),
      analyticsApi.unbilledByClient(params),
      kpiApi.trend({ metric: "utilization", months: 6 }),
    ]);

    const paymentSummary = unwrap(settledValue(summaryResult, {})) || {};
    return {
      kpi: normalizeKpiSummary(settledValue(kpiResult, {})),
      paymentSummary: {
        invoiceTotal: money(paymentSummary.invoiceTotal),
        clearedPayments: money(paymentSummary.clearedPayments),
        writeOffs: money(paymentSummary.writeOffs),
        outstanding: money(paymentSummary.outstanding),
      },
      aging: normalizeAging(settledValue(agingResult, {})),
      revenueByClient: asList(settledValue(revenueResult, {})).map(normalizeRevenueRow),
      monthlyRevenue: asList(settledValue(monthlyResult, {})).map(normalizeRevenueRow),
      recentInvoices: asList(settledValue(invoiceResult, [])).map(normalizeInvoice),
      recentPayments: asList(settledValue(paymentResult, [])).map(normalizePayment),
      wipByClient: asList(unwrap(settledValue(unbilledClientResult, {}))?.unbilledByClient || settledValue(unbilledClientResult, [])).map((row) => ({
        id: row.clientId || row._id || row.clientName,
        label: row.clientName || "Client",
        amount: money(row.totalUnbilledValue),
        hours: Number(row.totalUnbilledHours || 0),
        entries: Number(row.entries || 0),
      })),
      utilizationTrend: asList(unwrap(settledValue(utilizationTrendResult, {}))).map((row) => ({
        id: row.month || row._id,
        label: row.month || "Month",
        value: percent(row.value),
      })),
      issues: [
        issueMessage(kpiResult, "Finance indicators could not be refreshed."),
        issueMessage(revenueResult, "Revenue details could not be refreshed."),
        issueMessage(monthlyResult, "Revenue trend could not be refreshed."),
        issueMessage(summaryResult, "Payment totals could not be refreshed."),
        issueMessage(agingResult, "Receivables could not be refreshed."),
        issueMessage(invoiceResult, "Recent invoices could not be refreshed."),
        issueMessage(paymentResult, "Recent payments could not be refreshed."),
        issueMessage(unbilledClientResult, "Work in progress could not be refreshed."),
        issueMessage(utilizationTrendResult, "Utilization trend could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadReports(params = {}) {
    const [gstResult, invoiceResult, billableResult] = await Promise.allSettled([
      reportsApi.gstSummary(params),
      analyticsApi.invoices(params),
      analyticsApi.billables(params),
    ]);

    return {
      gst: normalizeReportSummary(settledValue(gstResult, {})),
      invoiceTotals: unwrap(settledValue(invoiceResult, {}))?.totals || {},
      billableTotals: unwrap(settledValue(billableResult, {}))?.totals || {},
      issues: [
        issueMessage(gstResult, "Tax summary could not be refreshed."),
        issueMessage(invoiceResult, "Invoice summary could not be refreshed."),
        issueMessage(billableResult, "Work summary could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadAudit(params = {}) {
    const [logsResult, platformStatsResult, statusStatsResult] = await Promise.allSettled([
      integrationLogsApi.list({ limit: 100, ...params }),
      integrationLogsApi.stats({ groupBy: "platform", ...params }),
      integrationLogsApi.stats({ groupBy: "status", ...params }),
    ]);
    return {
      logs: asList(settledValue(logsResult, [])).map(normalizeAuditLog),
      platformStats: asList(settledValue(platformStatsResult, [])).map((row) => ({ id: row._id || "Unknown", label: row._id || "Unknown", count: Number(row.count || 0) })),
      statusStats: asList(settledValue(statusStatsResult, [])).map((row) => ({ id: row._id || "Unknown", label: row._id || "Unknown", count: Number(row.count || 0) })),
      issues: [
        issueMessage(logsResult, "Audit events could not be refreshed."),
        issueMessage(platformStatsResult, "Audit source totals could not be refreshed."),
        issueMessage(statusStatsResult, "Audit status totals could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadSnapshots(params = {}) {
    const [snapshotsResult, trendResult] = await Promise.allSettled([
      kpiSnapshotsApi.list(params),
      kpiApi.trend({ metric: "revenue", months: 12 }),
    ]);
    return {
      snapshots: asList(settledValue(snapshotsResult, [])).map(normalizeSnapshot),
      revenueTrend: asList(unwrap(settledValue(trendResult, {}))).map((row) => ({ id: row.month || row._id, label: row.month || "Month", amount: money(row.value) })),
      issues: [
        issueMessage(snapshotsResult, "Saved finance snapshots could not be refreshed."),
        issueMessage(trendResult, "Revenue trend could not be refreshed."),
      ].filter(Boolean),
    };
  },
};
