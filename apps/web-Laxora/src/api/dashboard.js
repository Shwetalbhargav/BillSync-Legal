import { activitiesApi } from "./activities.js";
import { adminApi } from "./admin.js";
import { billablesApi } from "./billables.js";
import { clientsApi } from "./clients.js";
import { backendGapAdapters } from "./gaps.js";
import { mattersApi } from "./matters.js";
import { asList, normalizeBillable, normalizeClient, normalizeMatter, normalizeTask } from "./normalizers.js";
import { associateProfilesApi, internProfilesApi, lawyerProfilesApi, partnerProfilesApi } from "./profiles.js";
import { tasksApi } from "./tasks.js";

const dashboardByRole = {
  admin: () => adminApi.dashboard(),
  partner: () => partnerProfilesApi.dashboard(),
  lawyer: () => lawyerProfilesApi.dashboard(),
  associate: () => associateProfilesApi.dashboard(),
  intern: () => internProfilesApi.dashboard(),
};

function quiet(promise, fallback) {
  return promise.then((data) => ({ ok: true, data })).catch((error) => ({ ok: false, error, data: fallback }));
}

function setupCards(role) {
  return [
    {
      id: "profile",
      title: "Profile",
      status: "working",
      message: "Your role and contact details are ready for the workspace.",
    },
    {
      id: "extension",
      title: "Extension",
      status: role === "intern" ? "optional" : "needs-attention",
      message: role === "intern" ? "Extension capture is optional for this role." : "Connect the extension to capture email and research work.",
    },
    {
      id: "calendar",
      title: "Calendar",
      status: "not-configured",
      message: "Calendar sync is planned. Use manual time entry until it is available.",
    },
    {
      id: "billing",
      title: "Billing",
      status: ["admin", "partner"].includes(role) ? "working" : "review-only",
      message: ["admin", "partner"].includes(role) ? "Billing review tools are available for your role." : "You can prepare work for billing review.",
    },
  ];
}

function notificationsFromState({ dashboard, setup }) {
  const alerts = setup
    .filter((item) => item.status !== "working")
    .map((item) => ({
      id: item.id,
      title: `${item.title} needs attention`,
      message: item.message,
      tone: item.status === "not-configured" ? "neutral" : "warning",
    }));

  if (!dashboard.ok) {
    alerts.unshift({
      id: "workspace-refresh",
      title: "Workspace refresh needed",
      message: "Some daily workspace details could not be refreshed. Try again when you are ready.",
      tone: "warning",
    });
  }

  return alerts;
}

export const dashboardApi = {
  async loadDashboard(role = "lawyer") {
    const dashboardLoader = dashboardByRole[role] || dashboardByRole.lawyer;
    const [dashboard, matters, tasks, clients, billables, activities] = await Promise.all([
      quiet(dashboardLoader(), null),
      quiet(mattersApi.list({ limit: 5 }), []),
      quiet(tasksApi.list({ limit: 5 }), []),
      quiet(clientsApi.list({ limit: 5 }), []),
      quiet(billablesApi.list({ limit: 5 }), []),
      quiet(activitiesApi.list({ limit: 5 }), []),
    ]);

    const setup = setupCards(role);
    return {
      dashboard,
      matters: asList(matters.data).map(normalizeMatter),
      tasks: asList(tasks.data).map(normalizeTask),
      clients: asList(clients.data).map(normalizeClient),
      billables: asList(billables.data).map(normalizeBillable),
      activities: asList(activities.data),
      setup,
      notifications: notificationsFromState({ dashboard, setup }),
      gaps: [backendGapAdapters.dashboardSummary, backendGapAdapters.setupStatus],
    };
  },

  async globalSearch(query) {
    const q = String(query || "").trim();
    if (!q) return { matters: [], clients: [], tasks: [] };
    const [matters, clients, tasks] = await Promise.all([
      quiet(mattersApi.list({ q, limit: 8 }), []),
      quiet(clientsApi.list({ q, limit: 8 }), []),
      quiet(tasksApi.list({ q, limit: 8 }), []),
    ]);
    return {
      matters: asList(matters.data).map(normalizeMatter),
      clients: asList(clients.data).map(normalizeClient),
      tasks: asList(tasks.data).map(normalizeTask),
      partial: !matters.ok || !clients.ok || !tasks.ok,
    };
  },

  setupStatus(role) {
    return Promise.resolve({ cards: setupCards(role), gap: backendGapAdapters.setupStatus });
  },
};
