# Incident Response And Escalation

## Severity
- SEV1: data isolation failure, payment corruption, widespread outage, credential exposure.
- SEV2: invoice/payment workflow unavailable, failed capture backlog, degraded login.
- SEV3: single customer issue or non-critical feature degradation.

## Response
1. Acknowledge within 15 minutes for SEV1, 1 hour for SEV2, 1 business day for SEV3.
2. Assign incident lead and communications owner.
3. Preserve logs, request IDs, deployment SHA, and database audit context.
4. Mitigate: disable affected route, roll back image, revoke sessions, or pause integrations.
5. Communicate customer impact and next update time.
6. Write post-incident review within 5 business days.

## Alert Sources
- Availability monitor: `/healthz`.
- Readiness monitor: `/api/ops/readyz`.
- Failed capture, invoice delivery, and payment reconciliation monitor: `/api/ops/alerts`.
- Error tracking: JSON logs shipped to the managed log platform and error tracker.

## Support Escalation
- Support email: `support@lexora.example`.
- Security email: `security@lexora.example`.
- Billing email: `billing@lexora.example`.
