import { arApi } from "./ar.js";
import { backendGapAdapters } from "./gaps.js";
import { invoicesApi } from "./invoices.js";
import { paymentsApi } from "./payments.js";
import { asList, normalizeInvoice, normalizePayment } from "./normalizers.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function unwrapData(response) {
  return response?.data || response;
}

function normalizeAging(row = {}) {
  return {
    current: Number(row.current || 0),
    bkt_1_30: Number(row.bkt_1_30 || 0),
    bkt_31_60: Number(row.bkt_31_60 || 0),
    bkt_61_90: Number(row.bkt_61_90 || 0),
    bkt_90_plus: Number(row.bkt_90_plus || 0),
    totalOutstanding: Number(row.totalOutstanding || 0),
    invoiceCount: Number(row.invoiceCount || 0),
  };
}

function normalizeFinanceSummary(response = {}) {
  const data = unwrapData(response) || {};
  return {
    invoiceTotal: Number(data.invoiceTotal || 0),
    clearedPayments: Number(data.clearedPayments || 0),
    writeOffs: Number(data.writeOffs || 0),
    outstanding: Number(data.outstanding || 0),
    invoiceByStatus: asList(data.invoiceByStatus),
    paymentByType: asList(data.paymentByType),
  };
}

export const paymentWorkspaceApi = {
  async loadDashboard(params = {}) {
    const [paymentsResult, invoicesResult, summaryResult, agingResult, agingByClientResult] = await Promise.allSettled([
      paymentsApi.list(params),
      invoicesApi.list({ limit: 200 }),
      paymentsApi.financeSummary(),
      arApi.aging(),
      arApi.agingByClient(),
    ]);

    return {
      payments: asList(settledValue(paymentsResult, [])).map(normalizePayment),
      invoices: asList(settledValue(invoicesResult, [])).map(normalizeInvoice),
      summary: normalizeFinanceSummary(settledValue(summaryResult, {})),
      aging: normalizeAging(unwrapData(settledValue(agingResult, {}))),
      agingByClient: asList(unwrapData(settledValue(agingByClientResult, []))).map((item) => ({
        id: item._id || item.clientId || item.clientName,
        clientId: item._id || item.clientId || "",
        client: item.clientName || "Client",
        ...normalizeAging(item),
      })),
      gatewayGap: backendGapAdapters.paymentGateway,
      issues: [
        issueMessage(paymentsResult, "Payments could not be refreshed."),
        issueMessage(invoicesResult, "Invoices could not be refreshed."),
        issueMessage(summaryResult, "Finance totals could not be refreshed."),
        issueMessage(agingResult, "Receivables aging could not be refreshed."),
        issueMessage(agingByClientResult, "Client receivables could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadPortal(paymentCode) {
    const response = await paymentsApi.portalInvoice(paymentCode);
    return unwrapData(response);
  },
};
