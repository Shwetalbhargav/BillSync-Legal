import { billablesApi } from "./billables.js";
import { clientsApi } from "./clients.js";
import { integrationLogsApi } from "./integrations.js";
import { mattersApi } from "./matters.js";
import { rateCardsApi } from "./rateCards.js";
import { usersApi } from "./users.js";
import {
  asList,
  normalizeBillable,
  normalizeClient,
  normalizeIntegrationLog,
  normalizeMatter,
  normalizeRateCard,
  normalizeUser,
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

export const billingApi = {
  async loadBillables(params = {}) {
    const [billablesResult, clientsResult, mattersResult] = await Promise.allSettled([
      billablesApi.list(params),
      clientsApi.list({ limit: 200 }),
      mattersApi.list({ limit: 200 }),
    ]);

    return {
      billables: asList(settledValue(billablesResult, [])).map(normalizeBillable),
      clients: asList(settledValue(clientsResult, [])).map(normalizeClient),
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      issues: [
        issueMessage(billablesResult, "Billable work could not be refreshed."),
        issueMessage(clientsResult, "Clients could not be refreshed."),
        issueMessage(mattersResult, "Matters could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadBillableDetail(id) {
    const [billableResult, logsResult] = await Promise.allSettled([
      billablesApi.get(id),
      integrationLogsApi.byBillable ? integrationLogsApi.byBillable(id) : Promise.resolve([]),
    ]);

    const billable = unwrap(settledValue(billableResult, null));
    if (!billable) {
      throw new Error("We could not find this billable work item.");
    }

    return {
      billable: normalizeBillable(billable),
      logs: asList(settledValue(logsResult, [])).map(normalizeIntegrationLog),
      issues: [issueMessage(logsResult, "Sync history could not be refreshed.")].filter(Boolean),
    };
  },

  async loadApprovalQueue(params = {}) {
    const response = await billablesApi.pending(params);
    return asList(response).map(normalizeBillable);
  },

  async loadRateCards(params = {}) {
    const [rateCardsResult, usersResult, mattersResult] = await Promise.allSettled([
      rateCardsApi.list(params),
      usersApi.list({ limit: 100 }),
      mattersApi.list({ limit: 200 }),
    ]);

    return {
      rateCards: asList(settledValue(rateCardsResult, [])).map(normalizeRateCard),
      users: asList(settledValue(usersResult, [])).map(normalizeUser),
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      issues: [
        issueMessage(rateCardsResult, "Rate cards could not be refreshed."),
        issueMessage(usersResult, "Team members could not be refreshed."),
        issueMessage(mattersResult, "Matters could not be refreshed."),
      ].filter(Boolean),
    };
  },
};
