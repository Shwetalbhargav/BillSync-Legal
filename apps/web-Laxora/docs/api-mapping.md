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

