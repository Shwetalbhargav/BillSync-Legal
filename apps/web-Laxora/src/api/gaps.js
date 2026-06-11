function unavailable(message) {
  return async () => Promise.reject(new Error(message));
}

export const backendGapAdapters = {
  dashboardSummary: {
    routeNeeded: "GET /api/dashboard/summary",
    note: "Role-aware dashboard summary is planned; compose from existing resources until available.",
    load: unavailable("Dashboard summary is not configured yet."),
  },
  setupStatus: {
    routeNeeded: "GET /api/users/me/setup-status",
    note: "One readiness response for extension, email, research, calendar, billing, and storage is planned.",
    load: unavailable("Setup status is not configured yet."),
  },
  notificationCenter: {
    routeNeeded: "GET /api/notifications",
    note: "Notification center is planned; current branch derives workspace guidance from setup and refresh states.",
    load: unavailable("Notifications are not configured yet."),
  },
  guideCenter: {
    routeNeeded: "GET /api/help/guides",
    note: "Help and guide content is frontend-authored until a managed guide library is available.",
    load: unavailable("Guides are not configured yet."),
  },
  globalAssistantChat: {
    routeNeeded: "POST /api/ai/chat",
    note: "Streaming RAG assistant is planned; current AI routes support email and billable drafting only.",
    send: unavailable("Assistant chat is not configured yet."),
  },
  extensionHealth: {
    routeNeeded: "GET /api/extension/health",
    note: "Extension health diagnostics are planned; current auth can issue extension tokens.",
    load: unavailable("Extension health is not configured yet."),
  },
  calendarProvider: {
    routeNeeded: "GET /api/calendar/events",
    note: "Calendar provider sync is planned; manual time capture can use existing time-entry resources.",
    load: unavailable("Calendar connection is not configured yet."),
  },
  recorderTranscription: {
    routeNeeded: "POST /api/recordings",
    note: "Meeting recording and transcription resources are planned.",
    create: unavailable("Recording is not configured yet."),
  },
  paymentRecovery: {
    routeNeeded: "GET /api/payments/:paymentId/recovery-status",
    note: "Payment retry screens need a safe status check before offering another attempt.",
    load: unavailable("Payment recovery is not configured yet."),
  },
  uploadRecovery: {
    routeNeeded: "GET /api/document-storage/uploads/:uploadId",
    note: "Upload failure and progress states need a resumable upload status route.",
    load: unavailable("Upload recovery is not configured yet."),
  },
  courtCalendarSync: {
    routeNeeded: "GET /api/calendar/sync-status",
    note: "Court sync states need provider status and last-sync details.",
    load: unavailable("Court calendar sync is not configured yet."),
  },
};
