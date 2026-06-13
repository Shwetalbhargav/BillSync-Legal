import { asList, normalizeTimeEntry } from "./normalizers.js";
import { timeEntriesApi } from "./timeEntries.js";

export const timeApprovalWorkspaceApi = {
  async loadSubmittedQueue(params = {}) {
    const response = await timeEntriesApi.list({ status: "submitted", limit: 100, ...params });
    return asList(response).map(normalizeTimeEntry);
  },
  async approve(entryId) {
    return normalizeTimeEntry(await timeEntriesApi.approve(entryId));
  },
  async reject(entryId, reason) {
    return normalizeTimeEntry(await timeEntriesApi.reject(entryId, { reason }));
  },
};
