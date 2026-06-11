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

