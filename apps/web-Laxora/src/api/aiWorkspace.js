import { aiApi } from "./ai.js";

function unwrapResult(response, fallbackTitle = "Assistant draft") {
  if (response?.result) {
    return {
      title: response.result.title || fallbackTitle,
      text: response.result.text || response.result.answer || "",
      citations: response.result.citations || [],
      usage: response.aiUsage || null,
      raw: response,
    };
  }
  if (response?.email?.text) {
    return {
      title: "Email draft",
      text: response.email.text,
      citations: [],
      usage: response.aiUsage || null,
      raw: response,
    };
  }
  if (response?.planned?.description) {
    return {
      title: "Billable narrative",
      text: response.planned.description,
      citations: [],
      usage: response.aiUsage || null,
      raw: response,
    };
  }
  return {
    title: fallbackTitle,
    text: "",
    citations: [],
    usage: response?.aiUsage || null,
    raw: response,
  };
}

function unwrapData(response) {
  return response?.data || response;
}

export const aiWorkspaceApi = {
  async draftEmail(input) {
    return unwrapResult(await aiApi.generateEmail({ prompt: input }), "Email draft");
  },

  async assist(input, context = {}) {
    return unwrapResult(await aiApi.assist({ mode: "app_guide", input, context }), "Assistant guide");
  },

  async analyze(input, context = {}) {
    return unwrapResult(await aiApi.assist({ mode: "analyze_text", input, context }), "Research notes");
  },

  async billableNarrative(input, context = {}) {
    return unwrapResult(await aiApi.assist({ mode: "billable_narrative", input, context }), "Billable narrative");
  },

  async matterQuestion({ caseId, question }) {
    return unwrapResult(await aiApi.matterChat({ caseId, question }), "Matter answer");
  },

  async usage() {
    const data = unwrapData(await aiApi.usage());
    return {
      limit: Number(data.limit || 0),
      used: Number(data.used || 0),
      remaining: Number(data.remaining || 0),
      periodStart: data.periodStart || "",
      byModule: Array.isArray(data.byModule) ? data.byModule : [],
    };
  },

  async consumers() {
    return unwrapData(await aiApi.consumers()) || [];
  },
};
