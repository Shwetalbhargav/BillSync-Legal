import { clientsApi } from "./clients.js";
import { emailEntriesApi } from "./emailEntries.js";
import { mattersApi } from "./matters.js";
import { asList, normalizeClient, normalizeEmailEntry, normalizeMatter } from "./normalizers.js";

function unwrap(response) {
  return response?.data || response;
}

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

export const captureApi = {
  async loadReview(source) {
    const [entriesResult, clientsResult, mattersResult] = await Promise.allSettled([
      emailEntriesApi.list({ source, limit: 100 }),
      clientsApi.list({ limit: 200 }),
      mattersApi.list({ limit: 200 }),
    ]);

    if (entriesResult.status === "rejected") throw entriesResult.reason;

    return {
      entries: asList(entriesResult.value).map(normalizeEmailEntry),
      clients: asList(settledValue(clientsResult, [])).map(normalizeClient),
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      issues: [
        issueMessage(clientsResult, "Clients could not be refreshed."),
        issueMessage(mattersResult, "Matters could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async mapEntry(entryId, { clientId, matterId, convert = false }) {
    const response = await emailEntriesApi.map(entryId, { clientId, caseId: matterId, convert });
    return normalizeEmailEntry(unwrap(response));
  },

  async generateNarrative(entryId) {
    const response = await emailEntriesApi.generateNarrative(entryId);
    return normalizeEmailEntry(unwrap(response));
  },

  async createActivity(entryId) {
    return emailEntriesApi.createActivity(entryId);
  },

  async convertEntry(entryId, body = {}) {
    return emailEntriesApi.createTimeEntry(entryId, body);
  },
};
