# Billables Rates API Branch

Branch: `feat/billables-rates-api`

## Implemented Screens

- `/app/billables` - billables list with status, client, and matter filters.
- `/app/billables/:billableId` - billable detail with amount, time, rate, status, and sync history.
- `/app/billables/approval` - pending approval queue with approve and send-back actions for administrators.
- `/app/rate-cards` - rate-card list and create/remove workflow for administrators.

## Data Approach

The branch uses real billing resources already present in the backend:

- `GET /api/billables`
- `GET /api/billables/:id`
- `POST /api/billables/:id/approve`
- `POST /api/billables/:id/reject`
- `GET /api/rate-cards`
- `POST /api/rate-cards`
- `DELETE /api/rate-cards/:id`
- `GET /api/integration-logs/by-billable/:billableId`
- `GET /api/clients`
- `GET /api/cases`
- `GET /api/users`

## UX States Covered

- Loading while billing resources refresh.
- Empty billables, approval queue, sync history, and rate-card lists.
- Error state with retry copy.
- Permission guidance for reviewer-only actions.
- Inline validation for rate-card required fields.
- Success reload after approval, rejection, create, and remove actions.

## Backend Gaps And Notes

- The frontend plan labels approval queue and rate cards for Admin and Partner, but current backend approval and rate-card management routes require `admin`.
- Direct conversion from approved time entries to billables is still tracked separately as `POST /api/billables/from-time-entry/:timeEntryId`.
- Billable approval uses `POST /api/billables/:id/approve`; partner reviewer support would need backend authorization changes before the frontend can safely enable it.
