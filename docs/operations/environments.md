# Environments

## Development
- Purpose: local feature work and automated tests.
- API: `APP_ENV=development`, local MongoDB, local `.env`.
- Secrets: local `.env` only. Never commit real credentials.
- Payment gateway: mock gateway may be enabled locally only.

## Staging
- Purpose: release candidate validation and pilot rehearsals.
- API: `APP_ENV=staging`, production-like managed MongoDB, managed object storage, managed SMTP.
- Secrets: managed secret service only. Required: `JWT_SECRET`, `MONGODB_URI`, `FRONTEND_URL`, `CORS_ORIGINS`, `ALLOWED_EXTENSION_IDS`.
- Deployment: image built from `apps/api-Lexora/Dockerfile`, deployed by `.github/workflows/deploy-staging.yml`.
- Gate: migrations applied, `/healthz` and `/api/ops/readyz` healthy, smoke test passed.

## Production
- Purpose: customer traffic.
- API: `APP_ENV=production`, `NODE_ENV=production`.
- Secrets: managed secret service only; local `.env` is forbidden.
- Required extra controls: `SECRET_SERVICE_PROVIDER`, `BACKUP_ENCRYPTION_KEY_REF`, `AUTH_COOKIE_SECURE=true`, `PAYMENT_MOCK_GATEWAY_ENABLED=false`.
- Release method: promote a staging-validated image tag. Do not build directly on production hosts.

## Supported Runtime
- Node.js: `22.16.x`
- npm: `>=10`
- MongoDB: managed MongoDB 6+ compatible service.
