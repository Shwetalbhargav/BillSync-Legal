import { calendarApi } from "./calendar.js";
import { request } from "./client.js";
import { mattersApi } from "./matters.js";
import { asList, normalizeMatter } from "./normalizers.js";

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

const setupSteps = [
  "Seed trusted public court and law sources",
  "Run a polite daily feed refresh",
  "Review incoming legal updates",
  "Link relevant items to firm matters",
];

function buildReadiness(documentsResult, sourcesResult, jobsResult) {
  const documentCount = settledValue(documentsResult, { total: 0 }).total || 0;
  const sourceCount = asList(settledValue(sourcesResult, { items: [] }).items).filter((source) => source.enabled).length;
  const latestJob = asList(settledValue(jobsResult, { items: [] }).items)[0];

  return [
    {
      id: "daily-feed",
      label: "Daily court feed",
      status: documentsResult.status === "fulfilled" && documentCount > 0 ? "Connected" : "Ready",
      detail: documentCount > 0 ? `${documentCount} live legal updates are available.` : "Sources are ready. Run sync to fetch the latest official PDFs.",
    },
    {
      id: "source-feed",
      label: "Official sources",
      status: sourceCount > 0 ? "Connected" : "Needs setup",
      detail: sourceCount > 0 ? `${sourceCount} public court and law sources are configured.` : "Seed source configs before running the feed.",
    },
    {
      id: "verdict-feed",
      label: "Sync jobs",
      status: latestJob ? "Connected" : "Ready",
      detail: latestJob ? `Last job ${latestJob.status} for ${latestJob.sourceName}.` : "No scraper jobs have run yet.",
    },
  ];
}

function normalizeCourtItem(item) {
  const date = item?.dates?.publicationDate || item?.dates?.fetchedAt || item?.createdAt;
  return {
    id: item._id || item.id,
    title: item.title || "Untitled legal update",
    court: item?.jurisdiction?.court || item?.source?.name || "India law source",
    source: item?.source?.name || "Official source",
    type: item.documentType || "unknown",
    date,
    status: item?.status?.parseStatus || "linked",
    pdfUrl: item?.files?.pdfUrl,
    isPdf: /\.pdf($|\?)/i.test(item?.files?.pdfUrl || ""),
    sourcePageUrl: item?.files?.sourcePageUrl || item?.source?.url,
  };
}

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

async function seedSourcesIfEmpty(sourcesResult) {
  const sources = asList(settledValue(sourcesResult, { items: [] }).items);
  if (sources.length) return sourcesResult;
  await request("/api/court-sync/sources/seed", { method: "POST" });
  return Promise.resolve({ status: "fulfilled", value: await request("/api/court-sync/sources", { params: { enabled: true } }) });
}

export const courtSyncApi = {
  async loadWorkspace(params = {}) {
    const [hearingsResult, mattersResult, documentsResult, sourcesInitialResult, jobsResult, statsResult] = await Promise.allSettled([
      calendarApi.loadHearings(params),
      mattersApi.list({ limit: 100 }),
      request("/api/court-sync/documents", { params: { page: 1, limit: 25 } }),
      request("/api/court-sync/sources", { params: { enabled: true } }),
      request("/api/court-sync/sync/jobs/list", { params: { limit: 5 } }),
      request("/api/court-sync/documents/stats"),
    ]);

    const sourcesResult = sourcesInitialResult.status === "fulfilled" ? await seedSourcesIfEmpty(sourcesInitialResult) : sourcesInitialResult;
    const hearings = settledValue(hearingsResult, { hearings: [], sessions: [], timeEntries: [] });
    const matters = asList(settledValue(mattersResult, [])).map(normalizeMatter);
    const documents = settledValue(documentsResult, { items: [], total: 0 });
    const sources = asList(settledValue(sourcesResult, { items: [] }).items);
    const jobs = asList(settledValue(jobsResult, { items: [] }).items);
    const stats = settledValue(statsResult, { byType: [], bySource: [], latestSyncDocument: null });

    return {
      hearings: hearings.hearings || [],
      hearingTimeEntries: hearings.timeEntries || [],
      matters,
      courtItems: asList(documents.items).map(normalizeCourtItem),
      matches: [],
      verdicts: asList(documents.items).filter((item) => ["judgment", "court_order"].includes(item.documentType)).map(normalizeCourtItem),
      sources,
      jobs,
      stats,
      setupSteps,
      readiness: buildReadiness(documentsResult, sourcesResult, jobsResult),
      issues: [
        issueMessage(hearingsResult, "Manual hearing records could not be refreshed."),
        issueMessage(mattersResult, "Matter list could not be refreshed."),
        issueMessage(documentsResult, "Daily court documents could not be refreshed."),
        issueMessage(sourcesResult, "Court source configuration could not be refreshed."),
        issueMessage(jobsResult, "Court sync job history could not be refreshed."),
      ].filter(Boolean),
    };
  },

  async runDailySync(params = {}) {
    return request("/api/court-sync/sync/all", {
      method: "POST",
      params: { limit: 3, maxItems: 8, parsePdf: false, ...params },
    });
  },

  async linkCourtMatch(matchId, body) {
    return { matchId, ...body, status: "reviewed" };
  },
};
