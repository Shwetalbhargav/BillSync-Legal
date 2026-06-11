# Global Dashboard Common Branch

Branch: `feat/global-dashboard-common`

## Scope

- Role-aware daily dashboard.
- Setup confidence cards.
- Notification center derived from workspace readiness.
- Global search across matters, clients, and tasks.
- Help center guide cards.

## Routes

- `/app/dashboard`
- `/app/setup-status`
- `/app/notifications`
- `/app/search`
- `/app/help`

## Connected Services

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

## Frontend Adapters

- `dashboardApi.loadDashboard(role)` composes role dashboard and daily workspace resources.
- `dashboardApi.globalSearch(query)` searches matter, client, and task resources.
- `dashboardApi.setupStatus(role)` returns honest setup cards until one setup readiness response exists.

## Backend Gaps

- Dedicated role-aware daily dashboard summary.
- Managed notification center.
- Managed help and guide content.
- One setup-readiness response for extension, email, calendar, billing, and storage.
