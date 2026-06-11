import { authApi } from "./auth.js";
import { emailEntriesApi } from "./emailEntries.js";
import { backendGapAdapters } from "./gaps.js";
import { asList, safeText, toId } from "./normalizers.js";

function normalizeCapture(item = {}) {
  return {
    id: toId(item),
    title: safeText(item.subject || item.billableSummary || item.selectedText, "Captured item"),
    recipient: item.recipient || "",
    source: item.source || "extension",
    status: item.status || "captured",
    minutes: Number(item.durationMinutes ?? item.typingTimeMinutes ?? item.minutes ?? 0),
    createdAt: item.createdAt || item.workDate || item.date || "",
    raw: item,
  };
}

function safeTokenCheck(response) {
  return {
    available: Boolean(response?.success),
    expiresIn: response?.expiresIn || "",
    userName: response?.user?.name || "",
    extension: response?.extension || null,
  };
}

export const extensionApi = {
  health: backendGapAdapters.extensionHealth,
  testEvent: backendGapAdapters.extensionTestEvent,

  async testWorkspaceLink() {
    const response = await authApi.extensionToken();
    return safeTokenCheck(response);
  },

  async recentCaptures() {
    const [extensionResponse, gmailResponse] = await Promise.allSettled([
      emailEntriesApi.list({ source: "extension", limit: 10 }),
      emailEntriesApi.list({ source: "gmail", limit: 10 }),
    ]);

    const extensionItems = extensionResponse.status === "fulfilled" ? asList(extensionResponse.value).map(normalizeCapture) : [];
    const gmailItems = gmailResponse.status === "fulfilled" ? asList(gmailResponse.value).map(normalizeCapture) : [];
    return {
      captures: [...extensionItems, ...gmailItems].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
      issues: [
        extensionResponse.status === "rejected" ? "Extension captures could not be refreshed." : "",
        gmailResponse.status === "rejected" ? "Gmail captures could not be refreshed." : "",
      ].filter(Boolean),
    };
  },

  async setupStatus() {
    const [linkResult, captureResult] = await Promise.allSettled([
      authApi.extensionToken(),
      this.recentCaptures(),
    ]);

    const link = linkResult.status === "fulfilled" ? safeTokenCheck(linkResult.value) : { available: false, expiresIn: "", userName: "", extension: null };
    const captureData = captureResult.status === "fulfilled" ? captureResult.value : { captures: [], issues: ["Captured work could not be refreshed."] };

    return {
      link,
      captures: captureData.captures,
      issues: [
        linkResult.status === "rejected" ? "Workspace link could not be checked." : "",
        ...captureData.issues,
      ].filter(Boolean),
    };
  },
};
