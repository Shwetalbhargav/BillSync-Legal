# Authenticated Smoke and Staging Rerun Audit

Base URL: `https://billsync-legal.onrender.com`
Account used: sample owner account from `apps/api-Lexora/docs/fresh-sample-data-inventory.md`

## Authentication

`POST /api/auth/desktop-login` passed.

- Status: `200 OK`
- Token: stored into Postman environment
- Latest login response time: `719ms`

## Authenticated Smoke Result

Report: `reports/authenticated-smoke-results.json`

- Requests executed: 39
- Failed assertions: 4
- Workspace status: working; all smoke Workspace endpoints returned `200`

Remaining Smoke failures:

| Module | Endpoint | Actual | Meaning |
|---|---|---:|---|
| Invoices | `GET /api/invoices/:invoiceId/lines` | `409` | The sample invoice is finalised/immutable. This is business-rule behavior or test-data mismatch, not auth failure. |
| Ops / Health | `GET /api/ops/readyz` | `503`, ~120s | Real health/readiness failure. This remains the highest-priority backend/deployment issue. |

## Full Staging Result

Reports:

- `reports/results.json`
- `reports/report.html`

The command hit the 30-minute shell timeout, but Newman wrote report artifacts. Recorded run stats:

- Collection items: 351
- Actual HTTP requests: 187
- Destructive requests skipped by guard: 164
- Failed assertions: 34
- Failed request count: 1
- Max response time: ~120s

## Failed or Problem Modules

| Module | Evidence | Likely Cause |
|---|---|---|
| Ops / Health | `/api/ops/readyz` produced `503` / `ECONNRESET` / ~120s wait | Render app or dependency readiness is unhealthy or timing out. |
| Analytics | Multiple `/api/analytics/*` routes returned `404` | Enterprise modules likely disabled or deployed route set differs from local inventory. |
| Attendance | `/api/attendance`, `/holidays`, `/leave-requests` returned `404` | Enterprise modules likely disabled in deployed environment. |
| Revenue | `/api/revenue/breakdown`, `/monthly` returned `404` | Enterprise modules likely disabled in deployed environment. |
| Invoices | `/api/invoices/:invoiceId/lines` returned `409` | Sample invoice is finalised and immutable; use a draft invoice or update expected business-rule status. |
| Integration Logs | `/api/integration-logs/by-billable/:billableId` returned `500` | Needs backend log check or valid `billableId` test data. |
| Zoho Sync | `/api/integrations/zoho-sync/modules` returned `500` | Missing Zoho config/connection or backend integration error. |
| Users | `GET /api/users` returned `500` | Backend error; check Render logs. |
| Payments Portal | `/api/payments/portal/:token` returned `401` | `portalToken` is not populated with a valid payment portal token. |
| Partner Profiles | `/partner-profiles` slow; `/by-id` and `/by-user` returned `400` | Missing required query/data values and one performance issue. |

## Test Harness / Data Issues Still Present

These are not necessarily backend bugs:

- Some detail endpoints use placeholder IDs and need module-specific valid IDs.
- Some schema checks expect an object, but the API correctly returns arrays for list endpoints.
- CSV endpoints are now handled better in the generator, but older generated assertions should be regenerated before each run.
- The full staging command can run long because `/api/ops/readyz` waits about 120 seconds and some integrations are slow.

## Conclusion

Workspace is working after authenticated login. The previous Workspace failures were caused by missing auth and incomplete expected-status metadata.

The most important real backend issue is still `/api/ops/readyz`.

The next most important deployment/config issue is that Analytics, Attendance, and Revenue are returning `404`, which matches enterprise routes being disabled or missing on the deployed Render environment.
