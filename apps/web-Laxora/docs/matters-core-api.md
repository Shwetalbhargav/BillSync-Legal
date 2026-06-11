# Matters Core API Branch

Branch: `feat/matters-core-api`

## Scope

- Matter list with search and status filter.
- Create and edit matter form using backend-supported case fields.
- Matter detail overview with rollup, assignments, and recent time entries.
- Matter team assignment screen using case-assignment resources.

## Routes

- `/app/matters`
- `/app/matters/new`
- `/app/matters/:matterId`
- `/app/matters/:matterId/edit`
- `/app/matters/:matterId/overview`
- `/app/matters/:matterId/team`
- `/app/case-assignments`

## Connected Services

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

## Notes

- UI uses Matter terminology while the service route remains `/api/cases`.
- Delete and status-transition UI are not included in this branch because they need confirmation and lifecycle-specific flows.
