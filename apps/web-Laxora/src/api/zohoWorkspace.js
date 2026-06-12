import { clientsApi } from "./clients.js";
import { integrationLogsApi } from "./integrations.js";
import { mattersApi } from "./matters.js";
import { asList, normalizeClient, normalizeIntegrationLog, normalizeMatter } from "./normalizers.js";
import { zohoApi } from "./zoho.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function normalizeStatus(response) {
  return {
    connected: Boolean(response?.connected),
    accountsServer: response?.accountsServer || "",
    apiDomain: response?.apiDomain || "",
    scopes: Array.isArray(response?.scopes) ? response.scopes : [],
    userName: response?.zohoUser?.users?.[0]?.full_name || response?.zohoUser?.full_name || "",
    userEmail: response?.zohoUser?.users?.[0]?.email || response?.zohoUser?.email || "",
  };
}

function normalizeModule(item = {}) {
  return {
    id: item.id || item.api_name || item.module_name || item.plural_label || "",
    name: item.plural_label || item.module_name || item.api_name || "Zoho module",
    apiName: item.api_name || item.module_name || "",
    enabled: item.visible !== false,
  };
}

function normalizeSyncResult(response = {}) {
  const results = Array.isArray(response.results) ? response.results : Array.isArray(response.data) ? response.data : [];
  const failed = results.filter((item) => item && item.ok === false).length;
  return {
    ok: response.ok !== false,
    total: results.length,
    failed,
    succeeded: Math.max(results.length - failed, 0),
    results,
  };
}

export const zohoWorkspaceApi = {
  async loadWorkspace(params = {}) {
    const [statusResult, connectResult, modulesResult, logsResult, clientsResult, mattersResult] = await Promise.allSettled([
      zohoApi.status(),
      zohoApi.connectUrl(),
      zohoApi.modules(),
      integrationLogsApi.list({ platform: "Zoho", limit: 50, ...params }),
      clientsApi.list({ limit: 100 }),
      mattersApi.list({ limit: 100 }),
    ]);

    const modulesData = settledValue(modulesResult, {});
    const modules = asList(modulesData?.data || modulesData).map(normalizeModule);

    return {
      status: statusResult.status === "fulfilled" ? normalizeStatus(statusResult.value) : normalizeStatus(),
      connectUrl: settledValue(connectResult, {})?.url || "",
      modules,
      logs: asList(settledValue(logsResult, [])).map(normalizeIntegrationLog),
      clients: asList(settledValue(clientsResult, [])).map(normalizeClient),
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      issues: [
        issueMessage(statusResult, "Zoho is not connected yet."),
        issueMessage(connectResult, "Connect link is not ready yet."),
        issueMessage(modulesResult, "Zoho modules could not be refreshed."),
        issueMessage(logsResult, "Zoho sync logs could not be refreshed."),
        issueMessage(clientsResult, "Client list could not be refreshed."),
        issueMessage(mattersResult, "Matter list could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async syncClients(clientIds = []) {
    return normalizeSyncResult(await zohoApi.syncClients(clientIds.length ? { clientIds } : {}));
  },

  async syncMatters(caseIds = []) {
    return normalizeSyncResult(await zohoApi.syncCases(caseIds.length ? { caseIds } : {}));
  },

  async syncInvoices(invoiceIds = []) {
    return normalizeSyncResult(await zohoApi.syncInvoices(invoiceIds.length ? { invoiceIds } : {}));
  },

  async linkWorkDrive(body) {
    return zohoApi.linkWorkdrive(body);
  },

  async loadAttachments(moduleApiName, recordId) {
    return zohoApi.attachments(moduleApiName, recordId);
  },
};
