import { activitiesApi } from "./activities.js";
import { billablesApi } from "./billables.js";
import { caseAssignmentsApi } from "./caseAssignments.js";
import { documentStorageApi } from "./documentStorage.js";
import { integrationLogsApi } from "./integrations.js";
import { mattersApi } from "./matters.js";
import {
  asList,
  normalizeActivity,
  normalizeBillable,
  normalizeIntegrationLog,
  normalizeInvoice,
  normalizeMatter,
  normalizePayment,
  normalizeStoredDocument,
  normalizeTimeEntry,
} from "./normalizers.js";

function unwrap(response) {
  return response?.data || response;
}

function settledValue(result, fallback) {
  if (result.status === "fulfilled") return result.value;
  return fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

export async function loadMatterTimeline(caseId) {
  const [matterResult, activitiesResult, timeResult, assignmentsResult] = await Promise.allSettled([
    mattersApi.get(caseId),
    activitiesApi.list({ caseId, limit: 50, sort: "-createdAt" }),
    mattersApi.timeEntries(caseId, { limit: 50 }),
    caseAssignmentsApi.timeline(caseId),
  ]);

  if (matterResult.status === "rejected") throw matterResult.reason;

  const activities = asList(settledValue(activitiesResult, [])).map(normalizeActivity);
  const timeEntries = asList(settledValue(timeResult, [])).map(normalizeTimeEntry);
  const assignments = asList(settledValue(assignmentsResult, []));
  const timeline = [
    ...activities.map((item) => ({ ...item, kind: "Captured work" })),
    ...timeEntries.map((item) => ({ ...item, kind: "Time entry" })),
    ...assignments.map((item) => ({
      id: item.id || item._id || `${item.userId}-${item.createdAt}`,
      title: item.user?.name || item.userName || "Team update",
      type: item.role || "assignment",
      source: "Matter team",
      status: item.status || "active",
      minutes: 0,
      occurredAt: item.createdAt || item.startAt || "",
      kind: "Team update",
      raw: item,
    })),
  ].sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0));

  return {
    matter: normalizeMatter(unwrap(matterResult.value)),
    timeline,
    issues: [
      issueMessage(activitiesResult, "Captured work could not be refreshed."),
      issueMessage(timeResult, "Time entries could not be refreshed."),
      issueMessage(assignmentsResult, "Team changes could not be refreshed."),
    ].filter(Boolean),
  };
}

export async function loadMatterDocuments(caseId) {
  const [matterResult, documentsResult] = await Promise.allSettled([
    mattersApi.get(caseId),
    documentStorageApi.list({ caseId, status: "stored" }),
  ]);

  if (matterResult.status === "rejected") throw matterResult.reason;

  return {
    matter: normalizeMatter(unwrap(matterResult.value)),
    documents: asList(settledValue(documentsResult, [])).map(normalizeStoredDocument),
    issues: [issueMessage(documentsResult, "Documents could not be refreshed.")].filter(Boolean),
  };
}

export async function loadMatterBilling(caseId) {
  const [matterResult, rollupResult, billablesResult, invoicesResult, paymentsResult, timeResult] = await Promise.allSettled([
    mattersApi.get(caseId),
    mattersApi.rollup(caseId),
    billablesApi.list({ caseId }),
    mattersApi.invoices(caseId, { limit: 25 }),
    mattersApi.payments(caseId, { limit: 25 }),
    mattersApi.timeEntries(caseId, { limit: 25 }),
  ]);

  if (matterResult.status === "rejected") throw matterResult.reason;

  return {
    matter: normalizeMatter(unwrap(matterResult.value)),
    rollup: settledValue(rollupResult, null),
    billables: asList(settledValue(billablesResult, [])).map(normalizeBillable),
    invoices: asList(settledValue(invoicesResult, [])).map(normalizeInvoice),
    payments: asList(settledValue(paymentsResult, [])).map(normalizePayment),
    timeEntries: asList(settledValue(timeResult, [])).map(normalizeTimeEntry),
    issues: [
      issueMessage(rollupResult, "Billing totals could not be refreshed."),
      issueMessage(billablesResult, "Billable work could not be refreshed."),
      issueMessage(invoicesResult, "Invoices could not be refreshed."),
      issueMessage(paymentsResult, "Payments could not be refreshed."),
      issueMessage(timeResult, "Time entries could not be refreshed."),
    ].filter(Boolean),
  };
}

export async function loadMatterAudit(caseId) {
  const [matterResult, logsResult, documentsResult, activitiesResult] = await Promise.allSettled([
    mattersApi.get(caseId),
    integrationLogsApi.list({ caseId }),
    documentStorageApi.list({ caseId, status: "stored" }),
    activitiesApi.list({ caseId, limit: 20, sort: "-createdAt" }),
  ]);

  if (matterResult.status === "rejected") throw matterResult.reason;

  return {
    matter: normalizeMatter(unwrap(matterResult.value)),
    logs: asList(settledValue(logsResult, [])).map(normalizeIntegrationLog),
    documentEvents: asList(settledValue(documentsResult, [])).map(normalizeStoredDocument),
    activityEvents: asList(settledValue(activitiesResult, [])).map(normalizeActivity),
    issues: [
      issueMessage(logsResult, "Sync history could not be refreshed."),
      issueMessage(documentsResult, "Document history could not be refreshed."),
      issueMessage(activitiesResult, "Work history could not be refreshed."),
    ].filter(Boolean),
  };
}
