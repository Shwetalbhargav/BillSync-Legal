import { aiApi } from "./ai.js";

function unwrapResult(response, fallbackTitle = "Assistant draft") {
  if (response?.result) {
    return {
      title: response.result.title || fallbackTitle,
      text: response.result.text || response.result.answer || "",
      citations: response.result.citations || [],
      raw: response,
    };
  }
  if (response?.email?.text) {
    return {
      title: "Email draft",
      text: response.email.text,
      citations: [],
      raw: response,
    };
  }
  if (response?.planned?.description) {
    return {
      title: "Billable narrative",
      text: response.planned.description,
      citations: [],
      raw: response,
    };
  }
  return {
    title: fallbackTitle,
    text: "",
    citations: [],
    raw: response,
  };
}

export const aiWorkspaceApi = {
  async draftEmail(input) {
    return unwrapResult(await aiApi.generateEmail({ prompt: input }), "Email draft");
  },

  async assist(input, context = {}) {
    return unwrapResult(await aiApi.assist({ mode: "summarize_text", input, context }), "Assistant summary");
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
};
