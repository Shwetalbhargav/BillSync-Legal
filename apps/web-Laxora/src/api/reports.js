import { request } from "./client.js";

export const reportsApi = {
  timeEntriesCsv: (params) => request("/api/reports/time-entries.csv", { params }),
  invoicesCsv: (params) => request("/api/reports/invoices.csv", { params }),
  gstSummary: (params) => request("/api/reports/gst-summary", { params }),
  gstCsv: (params) => request("/api/reports/gst.csv", { params }),
  utilizationCsv: (params) => request("/api/reports/utilization.csv", { params }),
  pdf: (params) => request("/api/reports/pdf", { params }),
};
