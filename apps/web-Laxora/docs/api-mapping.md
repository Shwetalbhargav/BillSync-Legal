# BillSync Frontend API Mapping

This branch adds the frontend service boundary and route placeholders. Feature branches will connect screens deeply to these resources.

## Connected In Bootstrap

- `GET /healthz` via `src/api/health.js`
- Auth service names:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`

## Resource Services Declared

- Activities: `/api/activities`
- Analytics: `/api/analytics`
- Accounts receivable: `/api/ar`
- Billables: `/api/billables`
- Case assignments: `/api/case-assignments`
- Matters: `/api/cases`
- Clients: `/api/clients`
- Document storage: `/api/document-storage`
- Email entries: `/api/email-entries`
- Firms: `/api/firms`
- Integration logs: `/api/integration-logs`
- Invoices: `/api/invoices`
- Invoice lines: `/api/invoices/:invoiceId/lines`
- KPI snapshots: `/api/kpi-snapshots`
- KPI: `/api/kpi`
- Payments: `/api/payments`
- Rate cards: `/api/rate-cards`
- Reports: `/api/reports`
- Tasks: `/api/tasks`
- Revenue: `/api/revenue`
- Time entries: `/api/time-entries`
- Work sessions: `/api/work-sessions`
- Users: `/api/users`
- Admin: `/api/admin`
- AI: `/api/ai`
- Profiles:
  - `/api/partner-profiles`
  - `/api/lawyer-profiles`
  - `/api/associate-profiles`
  - `/api/intern-profiles`
- Zoho:
  - `/api/integrations/zoho`
  - `/api/integrations/zoho-sync`

## User-Facing Wording

The interface says `Matters`. The adapter may call the backend resource `cases` internally.

