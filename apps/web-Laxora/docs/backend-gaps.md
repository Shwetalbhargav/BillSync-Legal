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
- Current available backend AI routes: email generation and email-to-billable.
- Future work: add Gemini-backed assistant/RAG route and evidence logging.
- Frontend adapter: `backendGapAdapters.globalAssistantChat`.

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
- Current bootstrap approach: recording placeholders and fallback state.
- Frontend adapter: `backendGapAdapters.recorderTranscription`.

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

