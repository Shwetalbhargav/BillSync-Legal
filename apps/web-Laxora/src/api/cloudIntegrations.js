import { backendGapAdapters } from "./gaps.js";
import { documentStorageApi } from "./documentStorage.js";
import { asList, normalizeStoredDocument } from "./normalizers.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function providerStatus(result) {
  return result.status === "fulfilled" ? "connected" : "not-connected";
}

function providerCards({ googleResult, awsResult, documents }) {
  const googleDocs = documents.filter((document) => document.provider === "google_drive");
  const awsDocs = documents.filter((document) => document.provider === "s3");
  return [
    {
      id: "google_drive",
      name: "Google Drive",
      status: providerStatus(googleResult),
      documentCount: googleDocs.length,
      detail: "Use for firms that already organize client and matter folders in Google Drive.",
      requirements: ["Workspace administrator approval", "Matter folder rules", "Document access review"],
    },
    {
      id: "s3",
      name: "AWS firm storage",
      status: providerStatus(awsResult),
      documentCount: awsDocs.length,
      detail: "Use for private firm-controlled storage with stricter retention and access needs.",
      requirements: ["Storage bucket selection", "Access policy review", "Upload and preview rules"],
    },
  ];
}

export const cloudIntegrationsApi = {
  async loadWorkspace(params = {}) {
    const [documentsResult, googleResult, awsResult] = await Promise.allSettled([
      documentStorageApi.list(params),
      backendGapAdapters.googleStorageProvider.load(),
      backendGapAdapters.awsStorageProvider.load(),
    ]);

    const documents = asList(settledValue(documentsResult, [])).map(normalizeStoredDocument);
    const providers = providerCards({ googleResult, awsResult, documents });

    return {
      documents,
      providers,
      issues: [
        issueMessage(documentsResult, "Storage records could not be refreshed."),
        issueMessage(googleResult, "Google Drive is not connected yet."),
        issueMessage(awsResult, "AWS firm storage is not connected yet."),
      ].filter(Boolean),
    };
  },
};
