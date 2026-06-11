import { backendGapAdapters } from "./gaps.js";
import { clientsApi } from "./clients.js";
import { documentStorageApi } from "./documentStorage.js";
import { mattersApi } from "./matters.js";
import { asList, normalizeClient, normalizeMatter, normalizeStoredDocument } from "./normalizers.js";
import { zohoStorageApi } from "./zohoStorage.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function unwrap(response) {
  return response?.data || response;
}

function providerStatus(result) {
  return result.status === "fulfilled" ? "available" : "needs-attention";
}

export const storageWorkspaceApi = {
  async loadLibrary(params = {}) {
    const [documentsResult, mattersResult, clientsResult, zohoResult, googleResult, firmStorageResult] = await Promise.allSettled([
      documentStorageApi.list(params),
      mattersApi.list({ limit: 100 }),
      clientsApi.list({ limit: 100 }),
      zohoStorageApi.modules(),
      backendGapAdapters.googleStorageProvider.load(),
      backendGapAdapters.awsStorageProvider.load(),
    ]);

    return {
      documents: asList(settledValue(documentsResult, [])).map(normalizeStoredDocument),
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      clients: asList(settledValue(clientsResult, [])).map(normalizeClient),
      providers: providerCards({ zohoResult, googleResult, firmStorageResult }),
      issues: [
        issueMessage(documentsResult, "Documents could not be refreshed."),
        issueMessage(mattersResult, "Matter choices could not be refreshed."),
        issueMessage(clientsResult, "Client choices could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async loadDocument(documentId) {
    const [documentResult, downloadResult] = await Promise.allSettled([
      documentStorageApi.get(documentId),
      backendGapAdapters.matterDocumentDownload.load(),
    ]);
    if (documentResult.status === "rejected") throw documentResult.reason;
    return {
      document: normalizeStoredDocument(unwrap(documentResult.value)),
      downloadReady: downloadResult.status === "fulfilled",
      issues: [issueMessage(downloadResult, "Secure download is not ready yet.")].filter(Boolean),
    };
  },

  async loadUploadOptions() {
    const library = await this.loadLibrary();
    return {
      matters: library.matters,
      clients: library.clients,
      providers: library.providers,
      issues: library.issues,
    };
  },

  async createDocumentRecord(form) {
    return normalizeStoredDocument(unwrap(await documentStorageApi.createRecord(form)));
  },

  async archiveDocument(documentId, note) {
    return normalizeStoredDocument(unwrap(await documentStorageApi.setStatus(documentId, { status: "archived", note })));
  },
};

function providerCards({ zohoResult, googleResult, firmStorageResult }) {
  return [
    {
      id: "zoho_workdrive",
      name: "Zoho WorkDrive",
      status: providerStatus(zohoResult),
      detail: "Used for linked matter folders and attachment review where the firm has connected Zoho.",
    },
    {
      id: "google_drive",
      name: "Google Drive",
      status: providerStatus(googleResult),
      detail: "Planned provider for firms that keep client documents in Google Drive.",
    },
    {
      id: "s3",
      name: "Firm storage",
      status: providerStatus(firmStorageResult),
      detail: "Planned provider for private firm-controlled document storage.",
    },
  ];
}
