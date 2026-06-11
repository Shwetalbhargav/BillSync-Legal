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
  clientContacts: {
    routeNeeded: "PATCH /api/clients/:clientId/contacts",
    note: "Client contacts are present on the model, but current client write validation does not accept contact updates.",
    load: unavailable("Client contact editing is not configured yet."),
  },
  globalAssistantChat: {
    routeNeeded: "POST /api/ai/chat",
    note: "Streaming RAG assistant is planned; current AI routes support email and billable drafting only.",
    send: unavailable("Assistant chat is not configured yet."),
  },
  assistantResearchSources: {
    routeNeeded: "POST /api/ai/research with source-backed citations",
    note: "Current assistant can summarize and analyze text. Source-backed legal research with citations is planned.",
    send: unavailable("Research sources are not configured yet."),
  },
  ragIndexing: {
    routeNeeded: "POST /api/ai/matter-documents/index and GET /api/ai/matter-documents/index-status",
    note: "Matter Q&A can use saved matter notes today. Full indexing status and background ingestion are planned.",
    load: unavailable("Document indexing is not configured yet."),
  },
  extensionHealth: {
    routeNeeded: "GET /api/extension/health",
    note: "Extension health diagnostics are planned; current auth can issue extension tokens.",
    load: unavailable("Extension health is not configured yet."),
  },
  extensionTestEvent: {
    routeNeeded: "POST /api/extension/test-event",
    note: "A browser-side handshake test is planned; current frontend checks workspace authorization and recent captured items.",
    load: unavailable("Extension test event is not configured yet."),
  },
  capturedWorkBulkReview: {
    routeNeeded: "POST /api/email-entries/bulk-review",
    note: "Single-item mapping and conversion are available; batch review is a future efficiency helper.",
    load: unavailable("Bulk captured work review is not configured yet."),
  },
  whatsappProvider: {
    routeNeeded: "GET /api/communications/whatsapp/status and POST /api/communications/whatsapp/send",
    note: "WhatsApp provider setup, templates, inbox, and sending are planned.",
    load: unavailable("WhatsApp is not connected yet."),
    send: unavailable("WhatsApp is not connected yet."),
  },
  smsProvider: {
    routeNeeded: "GET /api/communications/sms/status and POST /api/communications/sms/send",
    note: "SMS provider setup, templates, inbox, and sending are planned.",
    load: unavailable("SMS is not connected yet."),
    send: unavailable("SMS is not connected yet."),
  },
  communicationLogs: {
    routeNeeded: "GET /api/communications/logs",
    note: "Unified communication logs across WhatsApp, SMS, and future providers are planned.",
    load: unavailable("Communication logs are not configured yet."),
  },
  calendarProvider: {
    routeNeeded: "GET /api/calendar/events",
    note: "Calendar provider sync is planned; manual time capture can use existing time-entry resources.",
    load: unavailable("Calendar connection is not configured yet."),
  },
  hearingWorkSessionCalendarEvent: {
    routeNeeded: "POST /api/work-sessions/start with calendarEvent fields accepted by validation",
    note: "Work sessions can store hearing calendar metadata, but start validation does not currently accept calendarEvent.",
    load: unavailable("Hearing meter details are not configured yet."),
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
  matterAuditTrail: {
    routeNeeded: "GET /api/cases/:caseId/audit",
    note: "Matter audit screens currently compose activity, document, and integration records; a single chronological audit feed is still needed.",
    load: unavailable("Matter history is not configured yet."),
  },
  matterDocumentDownload: {
    routeNeeded: "GET /api/document-storage/:documentId/download",
    note: "Matter document lists can show stored metadata, but signed download links are not available yet.",
    load: unavailable("Document download is not configured yet."),
  },
  storageBinaryUpload: {
    routeNeeded: "POST /api/document-storage/uploads",
    note: "Document metadata can be saved today; direct file transfer needs a storage upload route.",
    create: unavailable("File transfer is not configured yet."),
  },
  googleStorageProvider: {
    routeNeeded: "GET /api/integrations/google-drive/status",
    note: "Google Drive provider setup is planned; current storage records support Google provider labels only.",
    load: unavailable("Google Drive storage is not connected yet."),
  },
  awsStorageProvider: {
    routeNeeded: "GET /api/integrations/aws-storage/status",
    note: "AWS storage provider setup is planned; current storage records support firm storage labels only.",
    load: unavailable("Firm storage is not connected yet."),
  },
  taskWorkMeterContext: {
    routeNeeded: "POST /api/work-sessions/from-task/:taskId",
    note: "Task detail can pass task and matter context to the work meter route, but a persisted task-linked work session contract is still needed.",
    load: unavailable("Task work meter handoff is not configured yet."),
  },
  timeEntryBillableConversion: {
    routeNeeded: "POST /api/billables/from-time-entry/:timeEntryId",
    note: "Captured work can become a time entry and be submitted for approval; direct billable creation from approved time is still planned.",
    load: unavailable("Billing conversion is not configured yet."),
  },
  invoiceTemplates: {
    routeNeeded: "GET /api/invoice-templates",
    note: "Reusable invoice templates, branding, and default terms are planned.",
    load: unavailable("Invoice templates are not configured yet."),
  },
  invoiceShareLink: {
    routeNeeded: "POST /api/invoices/:id/share-link",
    note: "Secure client share links are planned; current route supports send and document preview.",
    create: unavailable("Invoice sharing is not configured yet."),
  },
  paymentGateway: {
    routeNeeded: "POST /api/payments/gateway/session",
    note: "External gateway collection is planned; current portal supports client payment submission for reconciliation.",
    create: unavailable("Online payment collection is not configured yet."),
  },
  financePdfReports: {
    routeNeeded: "GET /api/reports/pdf with generated PDF content",
    note: "The report route exists but returns a not-implemented response until PDF generation is wired.",
    load: unavailable("Board pack export is not configured yet."),
  },
  tdsSettings: {
    routeNeeded: "GET /api/tax/tds-settings and PATCH /api/tax/tds-settings",
    note: "TDS setup, deduction rules, certificates, and summaries are planned; current backend has GST-style invoice tax fields only.",
    load: unavailable("TDS setup is not configured yet."),
    update: unavailable("TDS setup is not configured yet."),
  },
  attendanceOverview: {
    routeNeeded: "GET /api/hr/attendance",
    note: "Attendance summaries are planned; current HR screens derive workload from time entries and work sessions.",
    load: unavailable("Attendance overview is not configured yet."),
  },
  payrollRuns: {
    routeNeeded: "GET /api/payroll/runs, GET /api/payroll/runs/:runId, and POST /api/payroll/runs",
    note: "Payroll runs, compensation records, approvals, and payslip generation are planned. Current screens show setup readiness only.",
    load: unavailable("Payroll is not configured yet."),
    create: unavailable("Payroll is not configured yet."),
  },
};
