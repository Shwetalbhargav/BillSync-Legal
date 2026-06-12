# Backend Gaps For Frontend Planning

These are not blockers for `feat/frontend-bootstrap`; they are tracked so feature branches can stay honest.

## Dashboard Summary

- Desired frontend need: one role-aware daily dashboard summary.
- Current bootstrap approach: compose from existing matter, task, billable, finance, and profile resources later.

## Setup Status

- Desired frontend need: browser extension, email, research, calendar, billing, and storage readiness in one response.
- Current bootstrap approach: guided setup placeholder and assistant coach placeholder.

## Global RAG Assistant Chat

- Desired frontend need: streamed global assistant with citations and product guidance.
- Current available backend AI routes: email generation, text assistance, billable narrative, matter documents, matter chat, and document generation.
- Current frontend approach: connect assistant, email writer, and research-notes modes to available routes while keeping source-backed research guidance explicit.
- Future work: add streaming chat, source-backed legal research citations, and evidence logging.
- Frontend adapters: `backendGapAdapters.globalAssistantChat` and `backendGapAdapters.assistantResearchSources`.

## Matter Document Indexing

- Desired frontend need: background document indexing, indexing status, source ingestion from uploaded files, and document-grounded chat readiness.
- Current available backend AI routes: save matter source text, summarize saved notes, answer from saved matter notes, and generate drafts from saved matter notes.
- Current frontend approach: require saved source notes before matter Q&A and never answer from unavailable documents.
- Future work: add `POST /api/ai/matter-documents/index`, `GET /api/ai/matter-documents/index-status`, uploaded-file ingestion, and persistent chat history.
- Frontend adapter: `backendGapAdapters.ragIndexing`.

## Extension Health

- Desired frontend need: connection status, latest captured item, test event result, and troubleshooting reason.
- Current bootstrap approach: extension setup/status placeholders.
- Frontend adapter: `backendGapAdapters.extensionHealth`.

## Calendar Provider

- Desired frontend need: hearing calendar sync and not-connected state.
- Current bootstrap approach: calendar placeholders and manual time entry route.
- Frontend adapter: `backendGapAdapters.calendarProvider`.

## Recording And Transcription

- Desired frontend need: meeting recorder, waveform, transcript, matter linking, and permission recovery.
- Current frontend approach: recorder workspace checks microphone readiness locally, shows an empty saved-recordings library, and composes related meeting/call work from activities and work sessions.
- Future work: add saved recording list/detail, upload or capture persistence, transcript generation, processing status, and matter linking routes.
- Needed routes: `GET /api/recordings`, `POST /api/recordings`, `GET /api/recordings/:recordingId`, `POST /api/recordings/:recordingId/transcribe`, and `PATCH /api/recordings/:recordingId/matter`.
- Frontend adapters: `backendGapAdapters.recorderTranscription`, `recordingsApi.loadWorkspace`, and `recordingsApi.getRecording`.

## Auth Recovery And Invites

- Desired frontend need: self-service forgot-password, reset-password, and invite-token acceptance flows.
- Current available backend auth routes: login, register, current user, logout, and extension token.
- Current frontend approach: registration-backed invite acceptance and calm password-help reserved states.
- Future work: add invite-token validation, forgot-password request, and reset-password confirmation routes.

## Fallback Recovery Status

- Desired frontend need: safe retry details for payment failure, upload failure, and court calendar sync failure states.
- Current frontend approach: reusable fallback states with honest retry/reconnect actions.
- Future work: add payment recovery status, resumable upload status, and calendar sync status routes.
- Frontend adapters: `backendGapAdapters.paymentRecovery`, `backendGapAdapters.uploadRecovery`, `backendGapAdapters.courtCalendarSync`.

## Global Dashboard Common

- Desired frontend need: one role-aware daily dashboard summary, managed notifications, managed guide content, and one setup readiness response.
- Current frontend approach: compose role dashboards with existing matter, task, client, billable, and activity resources.
- Future work: add `GET /api/dashboard/summary`, `GET /api/notifications`, and `GET /api/help/guides`.
- Frontend adapters: `dashboardApi.loadDashboard`, `dashboardApi.globalSearch`, `dashboardApi.setupStatus`.

## Client Contacts

- Desired frontend need: create, edit, and remove contacts from the client workspace.
- Current available backend client routes: client CRUD, related matters, related invoices, related payments, and financial summary.
- Current frontend approach: render existing contacts stored on the client model and show an honest not-ready editing state.
- Future work: add a client-contact route or extend client write validation to safely accept contact updates.
- Frontend adapter: `clientsApi.contacts.update`.

## Matter Lifecycle Helpers

- Desired frontend need: guided matter close, archive, delete, and status transition flows with confirmation copy.
- Current available backend matter routes: matter CRUD, status transition, rollup, related time entries, and team assignments.
- Current frontend approach: list, create, edit, detail, and team assignment screens use available resources.
- Future work: add dedicated UI flows for closing, archiving, and deleting matters.

## Matter History Feed

- Desired frontend need: one chronological matter history feed spanning team changes, document changes, sync results, billing changes, and important work events.
- Current available backend routes: activities by matter, documents by matter, case-assignment timeline by matter, and integration logs by billable or invoice.
- Current frontend approach: compose the history tab from available matter activities, stored documents, and integration-log records while showing a calm partial-refresh warning when one source is unavailable.
- Future work: add `GET /api/cases/:caseId/audit` with typed event categories and actor display fields.
- Frontend adapter: `backendGapAdapters.matterAuditTrail`.

## Matter Document Download

- Desired frontend need: secure open/download actions for documents stored against a matter.
- Current available backend routes: document metadata list, create, update, and status changes.
- Current frontend approach: render document metadata and storage status without exposing an unavailable download action.
- Future work: add `GET /api/document-storage/:documentId/download` or a signed-link field on document detail.
- Frontend adapter: `backendGapAdapters.matterDocumentDownload`.

## Task Work Meter Handoff

- Desired frontend need: start a work session directly from a task and keep the task link on the captured work record.
- Current available backend routes: task CRUD and work-session resources exist separately.
- Current frontend approach: task detail passes task and matter context to `/app/work-meter` through route context so the work-meter branch can pick it up.
- Future work: add `POST /api/work-sessions/from-task/:taskId` or allow work-session create requests to store `taskId`.
- Frontend adapter: `backendGapAdapters.taskWorkMeterContext`.

## Calendar Provider Events

- Desired frontend need: connected court calendar events, sync status, and provider reconnect guidance.
- Current available backend routes: hearing activities, work sessions, and manual time entries.
- Current frontend approach: show an honest calendar-not-connected state and allow manual hearing time capture.
- Future work: add `GET /api/calendar/events` and `GET /api/calendar/sync-status`.
- Frontend adapters: `backendGapAdapters.calendarProvider`, `backendGapAdapters.courtCalendarSync`.

## Hearing Work Session Metadata

- Desired frontend need: start a work meter session from a hearing while storing court, courtroom, bench, and scheduled-time details.
- Current available backend routes: work sessions store calendar metadata, but start validation does not accept `calendarEvent` yet.
- Current frontend approach: manual court time saves hearing metadata through activity capture and creates a draft time entry.
- Future work: allow `calendarEvent` on work-session start validation.
- Frontend adapter: `backendGapAdapters.hearingWorkSessionCalendarEvent`.

## Time Entry To Billable Conversion

- Desired frontend need: approved time entries can become billables without re-entering duration and matter context.
- Current available backend routes: captured activity to time entry, draft time entry submission, and manual billable creation.
- Current frontend approach: work meter creates captured work and draft/submitted time entries; billable conversion is documented for a later billing branch.
- Future work: add `POST /api/billables/from-time-entry/:timeEntryId`.
- Frontend adapter: `backendGapAdapters.timeEntryBillableConversion`.

## Billing Reviewer Authorization

- Desired frontend need: Admin and Partner users can review the billable approval queue and manage rate cards according to the frontend route plan.
- Current available backend routes: billable approve/reject and rate-card list/create/update/delete require `admin`.
- Current frontend approach: show approval and rate-card actions only for administrators, with calm permission guidance for other billing users.
- Future work: allow partner reviewer authorization in the backend if partners should approve billables or manage rates.

## Invoice Templates And Share Links

- Desired frontend need: reusable invoice templates, firm branding, default terms, and secure client share links.
- Current available backend routes: invoice generation, document preview, PDF download, send, void, and line editing.
- Current frontend approach: show a visible template shell and share-link not-configured state while keeping send/PDF actions tied to available routes.
- Future work: add `GET /api/invoice-templates` and `POST /api/invoices/:id/share-link`.
- Frontend adapters: `backendGapAdapters.invoiceTemplates`, `backendGapAdapters.invoiceShareLink`.

## External Payment Gateway

- Desired frontend need: collect online payments, confirm collection status, and update invoices after gateway confirmation.
- Current available backend routes: payment records, write-offs, reconciliation, portal link creation, and client payment-detail submission.
- Current frontend approach: let clients submit payment details through the payment page, then keep reconciliation manual and clearly mark online collection as not connected.
- Future work: add `POST /api/payments/gateway/session`, gateway status checks, and webhook handling for cleared or failed payments.
- Frontend adapter: `backendGapAdapters.paymentGateway`.

## Finance PDF Reports

- Desired frontend need: generate a polished board-ready finance pack.
- Current available backend routes: spreadsheet exports for time entries, invoices, tax summary, utilization, and a PDF route that returns a not-implemented response.
- Current frontend approach: enable downloadable spreadsheet-style reports and show a calm not-ready message for the board pack.
- Future work: wire a PDF generation service behind `GET /api/reports/pdf`.
- Frontend adapter: `backendGapAdapters.financePdfReports`.

## TDS Management

- Desired frontend need: TDS setup, deduction rates, party categories, certificate tracking, deduction summaries, and payment matching.
- Current available backend routes: firm GST-style tax settings and invoice tax fields.
- Current frontend approach: show a TDS management area with an honest not-turned-on state and readiness cards.
- Future work: add `GET /api/tax/tds-settings`, `PATCH /api/tax/tds-settings`, `GET /api/tax/tds-summary`, and certificate tracking routes.
- Frontend adapter: `backendGapAdapters.tdsSettings`.

## HR Attendance Overview

- Desired frontend need: attendance days, leave status, absence reasons, late arrivals, and monthly attendance summaries.
- Current available backend routes: users, role profiles, time entries, and work sessions.
- Current frontend approach: derive workload from time entries and work sessions, while showing attendance as not turned on.
- Future work: add `GET /api/hr/attendance`, `GET /api/hr/attendance/:userId`, and attendance/leave update routes.
- Frontend adapter: `backendGapAdapters.attendanceOverview`.

## Payroll Runs And Compensation

- Desired frontend need: payroll run list/detail/create, compensation records, review approvals, and payslip generation.
- Current available backend routes: users, role profiles, time entries, and work sessions.
- Current frontend approach: render payroll runs, payroll detail, and compensation setup as honest not-turned-on screens while using team records for setup readiness.
- Future work: add `GET /api/payroll/runs`, `POST /api/payroll/runs`, `GET /api/payroll/runs/:runId`, `GET /api/payroll/compensation`, `PATCH /api/payroll/compensation/:userId`, `POST /api/payroll/runs/:runId/approve`, and `POST /api/payroll/runs/:runId/payslips`.
- Frontend adapter: `backendGapAdapters.payrollRuns`.

## Document Binary Upload And Provider Setup

- Desired frontend need: upload a file, track upload progress, preview or download a stored document, and configure Zoho WorkDrive, Google Drive, or firm storage providers.
- Current available backend routes: document metadata records, document status updates, Zoho WorkDrive linking, and Zoho CRM attachment helpers.
- Current frontend approach: save document metadata, link records to matters, show document viewer details, and clearly mark direct file transfer/provider setup as not connected.
- Future work: add `POST /api/document-storage/uploads`, `GET /api/document-storage/uploads/:uploadId`, `GET /api/document-storage/:documentId/download`, `GET /api/integrations/google-drive/status`, and `GET /api/integrations/aws-storage/status`.
- Frontend adapters: `backendGapAdapters.storageBinaryUpload`, `backendGapAdapters.uploadRecovery`, `backendGapAdapters.matterDocumentDownload`, `backendGapAdapters.googleStorageProvider`, and `backendGapAdapters.awsStorageProvider`.

## Extension Health And Test Event

- Desired frontend need: one status response for installed extension version, last capture, browser permission state, and reconnect guidance.
- Current available backend routes: extension authorization through auth and email-entry capture records.
- Current frontend approach: use the workspace authorization check and recent captured work as honest readiness signals.
- Future work: add `GET /api/extension/health` and `POST /api/extension/test-event`.
- Frontend adapters: `backendGapAdapters.extensionHealth`, `backendGapAdapters.extensionTestEvent`.

## Captured Work Bulk Review

- Desired frontend need: select several captured email or research items and map or convert them in one action.
- Current available backend routes: single-item map, activity creation, time-entry creation, and conversion to billable records.
- Current frontend approach: review and convert captured items one at a time using real routes.
- Future work: add `POST /api/email-entries/bulk-review`.
- Frontend adapter: `backendGapAdapters.capturedWorkBulkReview`.

## WhatsApp SMS Communications

- Desired frontend need: provider status, WhatsApp inbox, SMS inbox, approved templates, send actions, replies, delivery history, and failure logs.
- Current available backend routes: no WhatsApp, SMS, or unified communication-log resources were found.
- Current frontend approach: render setup guidance, disabled compose previews, message template planning, and empty logs without claiming that messages were sent.
- Future work: add `GET /api/communications/whatsapp/status`, `POST /api/communications/whatsapp/send`, `GET /api/communications/sms/status`, `POST /api/communications/sms/send`, and `GET /api/communications/logs`.
- Frontend adapters: `backendGapAdapters.whatsappProvider`, `backendGapAdapters.smsProvider`, and `backendGapAdapters.communicationLogs`.

## Court Daily Sync

- Desired frontend need: court feed status, daily cause list updates, verdict/order detail, case-to-matter matching, manual review, and sync settings.
- Current available backend routes: activities, work sessions, time entries, and cases can support manual hearing capture and matter context.
- Current frontend approach: show live court sync as not connected, list manual hearing context separately, and keep matter-link review ready without linking unsupported feed items.
- Future work: add `GET /api/court/daily-sync`, `POST /api/court/daily-sync/run`, `GET /api/court/matches`, `PATCH /api/court/matches/:matchId`, `GET /api/court/verdicts`, and `GET /api/court/verdicts/:verdictId`.
- Frontend adapters: `backendGapAdapters.courtDailyFeed`, `backendGapAdapters.courtCaseMatch`, and `backendGapAdapters.courtVerdicts`.

