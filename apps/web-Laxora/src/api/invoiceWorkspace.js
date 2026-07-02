import { billablesApi } from "./billables.js";
import { clientsApi } from "./clients.js";
import { backendGapAdapters } from "./gaps.js";
import { integrationLogsApi } from "./integrations.js";
import { invoicesApi } from "./invoices.js";
import { mattersApi } from "./matters.js";
import { expensesApi } from "./expenses.js";
import { timeEntriesApi } from "./timeEntries.js";
import { usersApi } from "./users.js";
import {
  asList,
  normalizeBillable,
  normalizeClient,
  normalizeExpense,
  normalizeIntegrationLog,
  normalizeInvoice,
  normalizeMatter,
  normalizeUser,
  normalizeTimeEntry,
} from "./normalizers.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function unwrap(response) {
  return response?.data || response;
}

export const invoiceWorkspaceApi = {
  async loadInvoices(params = {}) {
    const [invoicesResult, pipelineResult, pendingResult, clientsResult, mattersResult] = await Promise.allSettled([
      invoicesApi.list(params),
      invoicesApi.pipeline(params),
      invoicesApi.pendingByClient(params),
      clientsApi.list({ limit: 200 }),
      mattersApi.list({ limit: 200 }),
    ]);

    return {
      invoices: asList(settledValue(invoicesResult, [])).map(normalizeInvoice),
      pipeline: asList(settledValue(pipelineResult, [])).map((item) => ({
        status: item.status || item._id || "draft",
        count: Number(item.count || 0),
        total: Number(item.total || 0),
      })),
      pendingByClient: asList(settledValue(pendingResult, [])).map((item) => ({
        id: item.clientId || item._id || item.clientName,
        client: item.clientName || "Client",
        invoiceCount: Number(item.invoiceCount || 0),
        totalPending: Number(item.totalPending || 0),
      })),
      clients: asList(settledValue(clientsResult, [])).map(normalizeClient),
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      issues: [
        issueMessage(invoicesResult, "Invoices could not be refreshed."),
        issueMessage(pipelineResult, "Invoice totals could not be refreshed."),
        issueMessage(pendingResult, "Client pending totals could not be refreshed."),
        issueMessage(clientsResult, "Clients could not be refreshed."),
        issueMessage(mattersResult, "Matters could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadBuilderOptions(params = {}) {
    const workParams = {
      limit: 500,
      ...(params.clientId ? { clientId: params.clientId } : {}),
      ...(params.caseId ? { caseId: params.caseId } : {}),
    };
    const [clientsResult, mattersResult, billablesResult, timeResult, expensesResult, usersResult] = await Promise.allSettled([
      clientsApi.list({ limit: 200 }),
      mattersApi.list({ limit: 200 }),
      billablesApi.approved(workParams),
      timeEntriesApi.list({ ...workParams, status: "approved" }),
      expensesApi.approved(workParams),
      usersApi.list({ limit: 200 }),
    ]);

    return {
      clients: asList(settledValue(clientsResult, [])).map(normalizeClient),
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      billables: asList(settledValue(billablesResult, [])).map(normalizeBillable),
      timeEntries: asList(settledValue(timeResult, [])).map(normalizeTimeEntry),
      expenses: asList(settledValue(expensesResult, [])).map(normalizeExpense),
      advocates: asList(settledValue(usersResult, [])).map(normalizeUser).filter((item) => ["lawyer", "partner", "admin"].includes(item.role)),
      templateGap: backendGapAdapters.invoiceTemplates,
      issues: [
        issueMessage(clientsResult, "Clients could not be refreshed."),
        issueMessage(mattersResult, "Matters could not be refreshed."),
        issueMessage(billablesResult, "Approved billable work could not be refreshed."),
        issueMessage(timeResult, "Approved time could not be refreshed."),
        issueMessage(expensesResult, "Approved reimbursable expenses could not be refreshed."),
        issueMessage(usersResult, "Issuing advocates could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadInvoiceDetail(id) {
    const [invoiceResult, logsResult] = await Promise.allSettled([
      invoicesApi.get(id),
      integrationLogsApi.byInvoice(id),
    ]);

    const invoice = unwrap(settledValue(invoiceResult, null));
    if (!invoice) throw new Error("We could not find this invoice.");

    return {
      invoice: normalizeInvoice(invoice),
      logs: asList(settledValue(logsResult, [])).map(normalizeIntegrationLog),
      shareGap: backendGapAdapters.invoiceShareLink,
      issues: [issueMessage(logsResult, "Invoice activity could not be refreshed.")].filter(Boolean),
    };
  },
};
