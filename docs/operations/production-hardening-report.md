# Production Hardening Report

## Scope

This release check covers Lexora as one multi-tenant Legal ERP codebase serving Free, Solo, Professional, Business, Enterprise, and Corporate Legal workspaces.

## Release-Critical Checks

- Workspace is the canonical tenant boundary for new platform services.
- Caller-supplied ownership fields are rejected or sanitized before protected mutations reach controllers.
- Workspace isolation, permission matrix, plan/feature, module dependency, migration rollback, rate limit, and production environment contracts are covered by automated tests.
- Enterprise-only routes remain behind `ENABLE_ENTERPRISE_MODULES` in production.
- Enterprise settings are modeled as feature-gated workspace controls, not a separate enterprise app.
- Protected workspace mutations route through centralized `requirePermission`.
- Browser hardening headers and request IDs are emitted by middleware.
- `/healthz`, `/version`, `/api/ops/readyz`, and `/api/ops/alerts` provide production observability entry points.
- Backup and restore drill expectations are documented in `docs/operations/backup-recovery.md`.
- CI runs dependency audit reports and terminology scan artifacts.

## Commands

Run before release:

```powershell
npm run scan:terminology
npm run load:smoke
npm --prefix apps/api-Lexora run test:release-hardening
npm --prefix apps/api-Lexora test
npm --prefix apps/web-Laxora run build
```

## Remaining Risks

- Existing legacy UI copy still contains Firm terminology in older settings and documentation surfaces. The terminology scan records this while the product migration continues.
- Backup and restore scripts are present, but successful restore drills require environment-specific MongoDB and storage credentials.
- Load smoke testing is available through `LOAD_TEST_TARGET_URL=https://staging.example npm run load:smoke`; full traffic simulation should run against staging before launch approval.
