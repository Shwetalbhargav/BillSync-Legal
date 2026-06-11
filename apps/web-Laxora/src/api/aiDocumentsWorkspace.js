import { aiApi } from "./ai.js";
import { mattersApi } from "./matters.js";
import { asList, normalizeMatter, toId } from "./normalizers.js";

function unwrap(response) {
  return response?.data || response;
}

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function normalizeMatterDocument(item = {}) {
  const createdBy = item.createdBy || {};
  return {
    id: toId(item),
    title: item.title || "Matter document",
    type: item.documentType || "other",
    summary: item.summary || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
    createdBy: createdBy.name || "",
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || item.createdAt || "",
    raw: item,
  };
}

function normalizeGenerated(response) {
  const result = response?.result || {};
  return {
    title: result.title || "Document draft",
    text: result.content || result.text || "",
    citations: result.citations || [],
    raw: response,
  };
}

function normalizeAnswer(response) {
  const result = response?.result || {};
  return {
    title: "Matter answer",
    text: result.answer || "",
    citations: result.citations || [],
    raw: response,
  };
}

export const aiDocumentsWorkspaceApi = {
  async loadWorkspace(caseId = "") {
    const [mattersResult, documentsResult] = await Promise.allSettled([
      mattersApi.list({ limit: 100 }),
      caseId ? aiApi.matterDocuments({ caseId }) : Promise.resolve({ data: [] }),
    ]);

    return {
      matters: asList(settledValue(mattersResult, [])).map(normalizeMatter),
      documents: asList(settledValue(documentsResult, [])).map(normalizeMatterDocument),
      issues: [
        issueMessage(mattersResult, "Matter choices could not be refreshed."),
        issueMessage(documentsResult, "Matter documents could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async addMatterDocument(body) {
    return normalizeMatterDocument(unwrap(await aiApi.createMatterDocument(body)));
  },

  async askMatterQuestion(body) {
    return normalizeAnswer(await aiApi.matterChat(body));
  },

  async generateMatterDocument(body) {
    return normalizeGenerated(await aiApi.generateDocument(body));
  },
};
