# Production Smoke Audit

Source run: `npm.cmd run test:production-smoke`
Base URL: `https://billsync-legal.onrender.com`

## Summary

- Requests executed: 39
- Failed requests: 3 request areas produced assertion failures
- Failed assertions: 10
- Dominant response: protected endpoints returned `401 Unauthorized` because no token was supplied
- Actual service health failure: `/api/ops/readyz` returned `503 Service Unavailable`

## Failed Modules

| Module | Endpoint(s) | Observed | Failure Type | Assessment |
|---|---|---:|---|---|
| Auth | `GET /api/auth/me` | `401`, 32.5s | Response time exceeded 2500ms | Endpoint is protected and unauthorized response is acceptable per generated status list, but latency is not acceptable. |
| Operations / Health | `GET /api/ops/readyz` | `503`, 120.2s | Server error, timeout/latency, expected `200` | Real production health failure. This should be investigated first. |
| Workspace | `GET /api/workspace/context` | `401` | Expected-status mismatch | Route requires auth. Smoke test expected only `500`, so the test metadata is wrong for unauthenticated smoke. |
| Workspace | `GET /api/workspace/modules` | `401` | Expected-status mismatch | Route requires auth. With no token, `401` is expected. |
| Workspace | `GET /api/workspace/modules/:moduleKey/access` | `401` | Expected-status mismatch | Route requires auth and also has missing `moduleKey` test data. |
| Workspace | `GET /api/workspace/navigation` | `401` | Expected-status mismatch | Route requires auth. With no token, `401` is expected. |
| Workspace | `GET /api/workspace/permissions` | `401` | Expected-status mismatch | Route requires auth. Smoke test expected only `500`, so the test metadata is wrong. |
| Workspace | `GET /api/workspace/permissions/me` | `401` | Expected-status mismatch | Route requires auth. Smoke test expected only `500`, so the test metadata is wrong. |

## Modules With No Assertion Failures

Cases, Clients, Invoices, KPI, Payments, and Reports did not fail assertions in this unauthenticated smoke run.

Important: many of those passed because their accepted status list includes `401` / `403`. Passing here proves the route responds consistently when unauthenticated; it does not prove functional success.

## Workspace Finding

Workspace is not proven broken by this run. The local route file applies `router.use(authenticate)` before these endpoints:

- `/api/workspace/context`
- `/api/workspace/permissions`
- `/api/workspace/permissions/me`
- `/api/workspace/modules`
- `/api/workspace/navigation`
- `/api/workspace/modules/:moduleKey/access`

Because the environment has an empty `token`, the observed `401 Unauthorized` response is expected. The failing part is the generated status expectation for workspace rows, which came from the inventory and omitted `401` / `403`.

## Real Backend Risk

`GET /api/ops/readyz` is the strongest backend failure signal:

- Expected: `200`
- Actual: `503`
- Duration: about `120.2s`

This suggests the Render service or a dependency checked by readiness is unhealthy, slow, or timing out.

## Recommended Next Steps

1. Check Render logs for `/api/ops/readyz` and dependency readiness failures.
2. Run smoke with a real token to validate Workspace functionality:
   `newman run postman/lexora-api-tests.postman_collection.json -e postman/production-smoke.postman_environment.json --folder Smoke --env-var "token=<JWT>"`
3. Fix inventory/generator status handling for protected routes so unauthenticated smoke accepts `401` / `403` where appropriate.
4. Provide safe production values for `moduleKey`, `clientId`, `caseId`, and `invoiceId`, or exclude parameterized detail routes from production smoke by default.
