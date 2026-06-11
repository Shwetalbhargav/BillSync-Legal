import { makeResource, request } from "./client.js";

export const kpiApi = {
  summary: (params) => request("/api/kpi/summary", { params }),
  trend: (params) => request("/api/kpi/trend", { params }),
};

export const kpiSnapshotsApi = {
  ...makeResource("/api/kpi-snapshots"),
  generate: (body) => request("/api/kpi-snapshots/generate", { method: "POST", body }),
  computeUpsert: (body) => request("/api/kpi-snapshots/compute-upsert", { method: "POST", body }),
};
