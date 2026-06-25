# Pilot Go/No-Go Checklist

## Deployment
- API Docker image built from lockfile and deployed to staging.
- Web build deployed to staging.
- Desktop build generated and smoke-tested.
- Extension tests pass and configured extension IDs match staging/production.
- Database migrations show no pending items: `npm run migrate:status`.

## Validation
- API suite green.
- Workspace-isolation suite green.
- Financial-invariant suite green.
- Web build green.
- Desktop build green.
- Extension tests green.
- Dependency audit reports generated and reviewed against `docs/operations/dependency-risk-register.md`.
- End-to-end smoke test completed for solo owner and five-user workspace.

## Operations
- `/healthz` healthy.
- `/api/ops/readyz` healthy.
- `/api/ops/alerts` has no active failed capture, failed delivery, or stale reconciliation alert.
- Backup job completed in the last 24 hours.
- Restore drill completed this month.
- Incident and rollback procedure reviewed.

## Commercial Readiness
- Privacy policy, terms, DPA, product limitations, billing/cancellation policy published.
- Data export/deletion process tested.
- Gmail and desktop capture consent language visible before capture is enabled.

## Decision
- Go: all critical checks pass and no unresolved SEV1/SEV2 issue exists.
- No-go: any data isolation, financial reconciliation, backup/restore, or deployment rollback check fails.
