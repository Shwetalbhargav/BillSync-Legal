import { makeResource, request } from "./client";

export const resources = {
  activities: makeResource("/api/activities"),
  analytics: { billables: () => request("/api/analytics/billables"), invoices: () => request("/api/analytics/invoices") },
  ar: { aging: () => request("/api/ar/aging"), agingByClient: () => request("/api/ar/aging/by-client") },
  billables: makeResource("/api/billables"),
  caseAssignments: makeResource("/api/case-assignments"),
  matters: makeResource("/api/cases"),
  clients: makeResource("/api/clients"),
  documentStorage: makeResource("/api/document-storage"),
  emailEntries: makeResource("/api/email-entries"),
  firms: makeResource("/api/firms"),
  integrationLogs: makeResource("/api/integration-logs"),
  invoices: makeResource("/api/invoices"),
  kpiSnapshots: makeResource("/api/kpi-snapshots"),
  kpi: { summary: () => request("/api/kpi/summary"), trend: () => request("/api/kpi/trend") },
  payments: makeResource("/api/payments"),
  rateCards: makeResource("/api/rate-cards"),
  revenue: { breakdown: () => request("/api/revenue/breakdown"), monthly: () => request("/api/revenue/monthly") },
  tasks: makeResource("/api/tasks"),
  timeEntries: makeResource("/api/time-entries"),
  workSessions: makeResource("/api/work-sessions"),
  users: makeResource("/api/users"),
};

export const backendGapAdapters = {
  dashboardSummary: {
    note: "Composes dashboard cards from existing resources until a dedicated summary is available.",
    load: async () => Promise.reject(new Error("Dashboard summary is not configured yet.")),
  },
  setupStatus: {
    note: "Shows guided readiness from local checks until a setup status resource is available.",
    load: async () => Promise.reject(new Error("Setup status is not configured yet.")),
  },
  globalAssistantChat: {
    note: "Uses the assistant shell now; streaming RAG chat will be connected in the assistant branch.",
    send: async () => Promise.reject(new Error("Assistant chat is not configured yet.")),
  },
  extensionHealth: {
    note: "Shows setup guidance until extension health checks are available.",
    load: async () => Promise.reject(new Error("Extension health is not configured yet.")),
  },
};
