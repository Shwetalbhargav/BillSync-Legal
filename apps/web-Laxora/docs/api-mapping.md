# BillSync Frontend API Mapping

This branch adds explicit service contracts for the backend route surface in `apps/api-Lexora/docs/route-inventory.md`.

## Request Helper

Core helper: `src/api/client.js`

- `request(path, options)`
- `makeResource(resourcePath)`
- `makeCursorParams(params)`
- `createUploadBody(files, fields)`
- `BillSyncApiError`

Errors are normalized into calm `userMessage` strings so UI screens do not show raw technical detail.

## Service Modules

| Area | Frontend module | Routes covered |
| --- | --- | --- |
| Health | `health.js` | `GET /healthz` |
| Auth | `auth.js` | `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/extension-token` |
| Admin | `admin.js` | `/api/admin/*` |
| Users | `users.js` | `/api/users/*` |
| Profiles | `profiles.js` | partner, lawyer, associate, intern profile resources |
| Firms | `firms.js` | `/api/firms/*` |
| Clients | `clients.js` | `/api/clients/*` |
| Matters | `matters.js` | `/api/cases/*` |
| Case assignments | `caseAssignments.js` | `/api/case-assignments/*` |
| Activities | `activities.js` | `/api/activities/*` |
| Work sessions | `workSessions.js` | `/api/work-sessions/*` |
| Time entries | `timeEntries.js` | `/api/time-entries/*` |
| Email entries | `emailEntries.js` | `/api/email-entries/*` |
| Billables | `billables.js` | `/api/billables/*` |
| Rate cards | `rateCards.js` | `/api/rate-cards/*` |
| Invoices | `invoices.js` | `/api/invoices/*`, invoice lines |
| Payments | `payments.js` | `/api/payments/*` |
| Accounts receivable | `ar.js` | `/api/ar/*` |
| Reports | `reports.js` | `/api/reports/*` |
| Analytics | `analytics.js` | `/api/analytics/*` |
| KPI | `kpi.js` | `/api/kpi/*`, `/api/kpi-snapshots/*` |
| Revenue | `revenue.js` | `/api/revenue/*` |
| Document storage | `documentStorage.js` | `/api/document-storage/*` |
| Integration logs | `integrations.js` | `/api/integration-logs/*` |
| Zoho | `zoho.js` | `/api/integrations/zoho/*`, `/api/integrations/zoho-sync/*` |
| AI | `ai.js` | `/api/ai/generate-email`, `/api/ai/email-to-billable` |

## Normalizers

`src/api/normalizers.js` includes list/page helpers and model normalizers for:

- users
- matters
- clients
- tasks
- billables
- invoices
- payments

## User-Facing Wording

The interface says `Matters`. The service module uses `/api/cases` internally.

## Auth Users Permissions Branch Usage

- `POST /api/auth/login`: sign-in form with name, mobile, password, role, and firm code.
- `POST /api/auth/register`: invite acceptance form until invite-token routes exist.
- `GET /api/auth/me`: session restore and profile refresh.
- `POST /api/auth/logout`: header and profile sign-out.
- `GET /api/users`: admin user management list.

## Fallback State System Branch Usage

- `GET /healthz`: verified deployed service availability.
- Frontend-only fallback adapters document planned recovery status needs for payments, uploads, and court calendar sync.

## Global Dashboard Common Branch Usage

- `GET /api/admin/dashboard`
- `GET /api/partner-profiles/dashboard`
- `GET /api/lawyer-profiles/dashboard`
- `GET /api/associate-profiles/dashboard`
- `GET /api/intern-profiles/dashboard`
- `GET /api/cases`
- `GET /api/tasks`
- `GET /api/clients`
- `GET /api/billables`
- `GET /api/activities`
- `GET /healthz`

## Clients API Branch Usage

- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:clientId`
- `PUT /api/clients/:clientId`
- `GET /api/clients/:clientId/cases`
- `GET /api/clients/:clientId/invoices`
- `GET /api/clients/:clientId/payments`
- `GET /api/clients/:clientId/summary`

## Matters Core API Branch Usage

- `GET /api/cases`
- `POST /api/cases`
- `GET /api/cases/:caseId`
- `PUT /api/cases/:caseId`
- `GET /api/cases/:caseId/time-entries`
- `GET /api/cases/:caseId/rollup`
- `GET /api/case-assignments`
- `POST /api/case-assignments`
- `GET /api/users`
- `GET /api/clients`

## Matter Timeline Documents Billing Audit Branch Usage

- `GET /api/cases/:caseId`
- `GET /api/activities?caseId=:caseId`
- `GET /api/cases/:caseId/time-entries`
- `GET /api/case-assignments/timeline/:caseId`
- `GET /api/document-storage?caseId=:caseId`
- `GET /api/cases/:caseId/rollup`
- `GET /api/billables?caseId=:caseId`
- `GET /api/cases/:caseId/invoices`
- `GET /api/cases/:caseId/payments`
- `GET /api/integration-logs`

The frontend service `src/api/matterTabs.js` composes these resources into UI-safe tab models for timeline, documents, billing, and history views.

## Tasks Daily Work Branch Usage

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `GET /api/cases`
- `GET /api/clients`
- `GET /api/users`

The frontend uses `/api/tasks` filters for status, assignee, and due-date windows. Task detail links to the work meter with task and matter context in the route until a persisted task-linked work session contract is available.

## Calendar Hearings Branch Usage

- `GET /api/activities?activityType=hearing`
- `POST /api/activities`
- `GET /api/work-sessions`
- `GET /api/time-entries`
- `POST /api/time-entries`
- `GET /api/cases`
- `GET /api/clients`

The frontend uses available hearing activity and time-entry resources for manual court time capture. Calendar-provider sync is represented as a not-connected state until a provider event route is available.

## Work Meter Time Capture Branch Usage

- `GET /api/work-sessions/current`
- `GET /api/work-sessions`
- `POST /api/work-sessions/start`
- `POST /api/work-sessions/:id/pause`
- `POST /api/work-sessions/:id/resume`
- `POST /api/work-sessions/:id/stop`
- `POST /api/work-sessions/:id/discard`
- `GET /api/activities`
- `POST /api/activities/:activityId/review`
- `POST /api/time-entries`
- `GET /api/time-entries`
- `POST /api/time-entries/from-activity/:activityId`
- `POST /api/time-entries/:id/submit`
- `GET /api/cases`
- `GET /api/clients`

The frontend stop flow can save captured work as a draft time entry or submit it for review in one step.

## Chrome Extension Setup Status Branch Usage

- `POST /api/auth/extension-token`
- `GET /api/email-entries?source=extension`
- `GET /api/email-entries?source=gmail`

The frontend uses the available extension authorization action as a workspace connection check and uses recent email-entry captures as the current capture signal. Dedicated extension health and browser handshake routes are tracked as backend gaps.

## Email Research Capture Branch Usage

- `GET /api/email-entries?source=gmail`
- `GET /api/email-entries?source=research`
- `POST /api/email-entries/:id/map`
- `POST /api/email-entries/:id/gpt-narrative`
- `POST /api/email-entries/:id/activity`
- `POST /api/email-entries/:id/time-entry`
- `GET /api/clients`
- `GET /api/cases`

The frontend supports source-specific review queues, client/matter mapping, narrative drafting, activity creation, and conversion to time plus billable records where the backend allows it.

## Call Meeting Recorder Branch Usage

- `GET /api/activities?activityType=meeting`
- `GET /api/activities?activityType=call`
- `GET /api/work-sessions`

The frontend renders the recorder workspace, microphone readiness states, and related meeting/call work from existing resources. Saved recording persistence, transcript generation, and matter linking are represented by future-ready adapters until recording routes are available.

## Billables Rates API Branch Usage

- `GET /api/billables`
- `GET /api/billables/:id`
- `POST /api/billables/:id/approve`
- `POST /api/billables/:id/reject`
- `GET /api/rate-cards`
- `POST /api/rate-cards`
- `DELETE /api/rate-cards/:id`
- `GET /api/rate-cards/resolve`
- `GET /api/integration-logs/by-billable/:billableId`
- `GET /api/clients`
- `GET /api/cases`
- `GET /api/users`

The frontend connects list, detail, approval, and rate-card workflows to real resources. Reviewer-only actions show permission guidance unless the signed-in user can perform them.

## Invoices API Branch Usage

- `GET /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/invoices/from-time`
- `POST /api/invoices/from-billables`
- `GET /api/invoices/__pipeline`
- `GET /api/invoices/__analytics/pending-by-client`
- `GET /api/invoices/:id/pdf`
- `GET /api/invoices/:id/document`
- `POST /api/invoices/:id/send`
- `POST /api/invoices/:id/void`
- `GET /api/invoices/:invoiceId/lines`
- `POST /api/invoices/:invoiceId/lines`
- `PUT /api/invoices/:invoiceId/lines/:lineId`
- `DELETE /api/invoices/:invoiceId/lines/:lineId`
- `GET /api/integration-logs/by-invoice/:invoiceId`
- `GET /api/clients`
- `GET /api/cases`
- `GET /api/time-entries?status=approved`
- `GET /api/billables?status=approved`

The frontend connects invoice list, builder, detail, send, void, and line workflows to real resources. Template and secure sharing flows remain honest not-configured states.

## Payments Portal Reconciliation Branch Usage

- `GET /api/payments`
- `POST /api/payments`
- `POST /api/payments/write-off`
- `GET /api/payments/finance-summary`
- `POST /api/payments/portal-link/:invoiceId`
- `POST /api/payments/:id/reconcile`
- `DELETE /api/payments/:id`
- `GET /api/payments/portal/:paymentCode`
- `POST /api/payments/portal/:paymentCode/pay`
- `GET /api/ar/aging`
- `GET /api/ar/aging/by-client`
- `GET /api/invoices`

The frontend connects payment recording, reconciliation, receivables aging, and client payment-page submission to available resources. External payment collection is represented as a not-connected state until gateway-session and webhook routes exist.

## Finance Reports Audit Branch Usage

- `GET /api/kpi/summary`
- `GET /api/kpi/trend`
- `GET /api/kpi-snapshots`
- `GET /api/revenue/breakdown`
- `GET /api/revenue/monthly`
- `GET /api/analytics/billables`
- `GET /api/analytics/invoices`
- `GET /api/analytics/unbilled-by-client`
- `GET /api/payments/finance-summary`
- `GET /api/payments`
- `GET /api/invoices`
- `GET /api/ar/aging`
- `GET /api/reports/gst-summary`
- `GET /api/reports/time-entries.csv`
- `GET /api/reports/invoices.csv`
- `GET /api/reports/gst.csv`
- `GET /api/reports/utilization.csv`
- `GET /api/reports/pdf`
- `GET /api/integration-logs`
- `GET /api/integration-logs/stats`

The frontend connects finance dashboard, report downloads, saved KPI snapshots, and audit event review to available resources. PDF report generation remains a clearly documented backend gap because the route currently returns a not-implemented response.

## GST TDS Tax Branch Usage

- `GET /api/firms/:firmId/settings`
- `PATCH /api/firms/:firmId/tax-settings`
- `GET /api/reports/gst-summary`
- `GET /api/reports/gst.csv`
- `GET /api/invoices`
- `GET /api/analytics/invoices`

The frontend connects GST settings, invoice tax review, and GST summaries to available firm, invoice, and report resources. TDS is represented as a not-turned-on state until deduction settings, certificates, and summary routes are available.

## HR People Branch Usage

- `GET /api/users`
- `GET /api/users/:id`
- `GET /api/users/:id/profile`
- `GET /api/users/:id/default-rate`
- `GET /api/time-entries`
- `GET /api/work-sessions`
- `GET /api/partner-profiles/dashboard`
- `GET /api/lawyer-profiles/dashboard`
- `GET /api/associate-profiles/dashboard`
- `GET /api/intern-profiles/dashboard`

The frontend connects HR dashboard, team directory, employee profile, and workload views to available users, role profiles, time entries, and work sessions. Attendance is represented as a not-turned-on state until a dedicated HR attendance resource exists.

## Payroll Branch Usage

- `GET /api/users`
- `GET /api/time-entries`
- `GET /api/work-sessions`

The frontend uses people and workload records to show payroll setup readiness. Payroll runs, compensation records, approvals, and payslip delivery use `backendGapAdapters.payrollRuns` until payroll resources are available.

## Storage Documents Branch Usage

- `GET /api/document-storage`
- `POST /api/document-storage`
- `GET /api/document-storage/:documentId`
- `PATCH /api/document-storage/:documentId`
- `POST /api/document-storage/:documentId/status`
- `GET /api/cases`
- `GET /api/clients`
- `GET /api/integrations/zoho-sync/modules`
- `POST /api/integrations/zoho-sync/workdrive/link`
- `GET /api/integrations/zoho-sync/:moduleApiName/:recordId/attachments`
- `POST /api/integrations/zoho-sync/:moduleApiName/:recordId/attachments`

The frontend connects the storage library, document viewer, metadata save form, storage settings, and matter document links to existing document-storage records. Direct binary transfer, signed document download, Google Drive setup, and AWS-style storage setup are represented with explicit frontend adapters until those resources exist.

