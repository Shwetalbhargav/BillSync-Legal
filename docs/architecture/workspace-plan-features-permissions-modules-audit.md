# Lexora Workspace -> Plan -> Features -> Permissions -> Modules Audit

Branch: `codex/architecture-audit-multitenancy`  
Scope: documentation and migration map only. No production code refactor was performed.

## Executive Summary

Lexora is partway through a Workspace tenant migration. The backend already has `workspaceId`, `Membership`, `Invitation`, `AuditEvent`, a workspace-scoped Mongoose plugin, and commercial roles (`owner`, `lawyer`, `billing_assistant`, `accountant`). However, `Firm` remains the runtime workspace record, `firmId` remains a compatibility/identity field, login still requires role plus firm, and web navigation/permissions are still hardcoded around legacy roles and static modules.

No `companyId` or `organizationId` tenant field was found in source scans. `tenantId` appears only in defensive ownership stripping, not as an active data boundary.

Target migration model:

```text
Workspace
  -> Plan
    -> Features
      -> Permissions
        -> Modules
```

## Current Architecture Inventory

### Tenant Boundary

| Area | Current State | Migration Owner |
| --- | --- | --- |
| Workspace record | `Firm` model stores name, currency, tax settings, onboarding, member limit, invoice sequence, work review, billing preferences. | Platform/API |
| Tenant id | `workspaceId` is added to many models via `workspaceScopedPlugin`; `firmId` remains in `User`, `Client`, `Admin`, auth flows, firm settings routes, and tests. | Platform/API |
| Request context | `authenticate` resolves `workspaceId` from `user.workspaceId || user.firmId`; `workspaceContext` uses async local storage. | Platform/API |
| Payload safety | `rejectOwnershipFields` blocks `workspaceId`, `firmId`, `ownerUserId`, `ownerId`, `tenantId` in mutating client payloads. | Platform/API |
| Membership | Workspace membership exists and is owner-managed, but queries and mutations use the `Firm` collection for limits and workspace metadata. | Platform/API |
| Frontend settings | `settingsWorkspaceApi` calls `/api/firms/:firmId...` and renders "Firm" naming. | Web/App Shell |

### Authorization and Roles

| Area | Current State | Migration Owner |
| --- | --- | --- |
| Commercial roles | `owner`, `lawyer`, `billing_assistant`, `accountant` are defined in `apps/api-Lexora/src/modules/workspace/roles.js`. | Platform/API |
| Legacy roles | `admin`, `partner`, `associate`, `intern`, `lawyer` remain in user schema, route guards, profile routes, tests, docs, and web constants. | Platform/API + Web |
| Role mapping | `admin` and `partner` normalize to `owner`; `associate` and `intern` normalize to `lawyer`. | Platform/API |
| Backend route guards | Many routes still call `authorize('admin', 'partner', ...)`, so feature permission cannot yet be plan-driven. | Module Owners |
| Frontend route guards | `permissions.js`, `routeConfig.js`, `Sidebar`, `BottomNav`, `ProtectedPage`, and `ProtectedRoute` filter with hardcoded role/module lists. | Web/App Shell |

### Product and UX Surfaces That Must Change from Firm to Workspace

| Surface | Current Wording or Behavior | Required Direction | Owner |
| --- | --- | --- | --- |
| Login | Requires name, mobile, password, role, and firm. | Workspace-aware identity flow; do not require static legal role or Firm selection for normal login. | Auth/Web |
| Register/onboarding | Creates a `Firm` and returns it as `workspace`. | Rename backing API contract and UI copy to Workspace. | Auth/Web |
| Settings | Routes and copy use Firm Settings, firm tax settings, firm storage, firm account needed. | Workspace Settings with plan, features, permissions, modules. | Settings |
| Navigation | Static `navigationItems`, `appRoutes`, `excludedProductionPaths`, role groups. | Feature/module navigation from workspace plan and permissions. | Web/App Shell |
| Admin/profile pages | Dedicated Partner/Lawyer/Associate/Intern profile screens. | Permissioned people/member profile surfaces, not static profession-role modules. | People/Auth |
| Billing/tax | Uses `/api/firms/:firmId/settings`, tax defaults, invoice prefixes. | Workspace billing settings with plan/feature entitlement checks. | Billing/Finance |
| Membership | Fixed `memberLimit` max 5 on `Firm`. | Plan-owned member limits and feature availability. | Platform/Billing |
| Fallback states | Permission denied exists; plan/feature denied is not distinct. | Add explicit feature unavailable / plan upgrade / module disabled states later. | Web/App Shell |

## Tenant Dependency Inventory

### Active `Firm` / `firmId` Dependencies

Backend source:

- `apps/api-Lexora/src/modules/firms/models/Firm.js` is the current workspace-shaped persistence model and stores plan-like fields (`memberLimit`) plus billing/settings/onboarding fields.
- `apps/api-Lexora/src/modules/firms/controllers/firmController.js`, `routes/firmRoutes.js`, and `validators/firmValidators.js` expose Firm CRUD and settings APIs.
- `apps/api-Lexora/src/modules/auth/controllers/authController.js` imports `Firm`, resolves `firmId`, logs in by `{ mobile, role, firmId }`, registers by creating a `Firm`, and requires `firmId` for password reset.
- `apps/api-Lexora/src/modules/users/models/User.js` keeps `firmId` and allows both commercial and legacy role enums.
- `apps/api-Lexora/src/modules/users/models/admin.js` requires `firmId`.
- `apps/api-Lexora/src/modules/users/controllers/adminController.js` creates, updates, and authenticates admin records by `firmId`.
- `apps/api-Lexora/src/modules/workspace/controllers/onboardingController.js` reads and updates workspace onboarding through `Firm.findById(req.workspaceId)`.
- `apps/api-Lexora/src/modules/workspace/controllers/membershipController.js` reads `Firm.memberLimit` and writes `firmId: invite.workspaceId` on invited users.
- `apps/api-Lexora/src/middleware/auth.js` uses `user.workspaceId || user.firmId` and still returns `firmId`.
- `apps/api-Lexora/src/middleware/workspaceScopedPlugin.js` adds `workspaceId` with `ref: 'Firm'` and backfills from `firmId`.
- `apps/api-Lexora/src/middleware/workspaceContext.js` blocks `firmId` and `tenantId` as ownership fields.
- `apps/api-Lexora/src/models/index.js` exports `Firm`.
- `apps/api-Lexora/src/scripts/migrateWorkspaceIds.js` and `migrateCommercialRoles.js` are compatibility migration scripts.
- `apps/api-Lexora/src/seeds/seedDevData.js`, `seedFirm.js`, and `seedVeereshDemoData.js` seed firm-shaped data.

Backend models with workspace or legacy tenant references:

- `activities`, `activitySamples`, `appUsageEvents`, `attendance`, `billables`, `cases`, `clients`, `courtSync`, `documentStorage`, `emailEntries`, `idleIntervals`, `integrations`, `invoices`, `kpi`, `payments`, `rates`, `reports`, `tasks`, `timeEntries`, `workSessions`, `users`, and `workspace` modules contain `workspaceId`, related IDs, or legacy `firmId` usage according to source scans.
- High-risk relational models: `Client`, `Case`, `CaseAssignment`, `Billable`, `Invoice`, `Payment`, `RateCard`, `MatterDocument`, `StoredDocument`, `TimeEntry`, `WorkSession`, `Activity`, `EmailEntry`, `KpiSnapshot`.

Frontend source:

- `apps/web-Laxora/src/api/firms.js` exposes all `/api/firms` calls.
- `apps/web-Laxora/src/api/settingsWorkspace.js` normalizes firm settings and issues firm-specific error copy.
- `apps/web-Laxora/src/api/taxWorkspace.js` loads tax settings through firm routes.
- `apps/web-Laxora/src/pages/LoginPage.jsx` still includes firm and role-oriented login state.
- `apps/web-Laxora/src/pages/settings/SettingsAdminPage.jsx` consumes workspace settings backed by firm APIs.
- `apps/web-Laxora/src/pages/tax/GstDashboardPage.jsx` depends on firm tax settings.
- `apps/web-Laxora/src/api/normalizers.js` carries normalized firm/workspace identifiers.

Desktop and extension:

- `apps/desktop-Lexora/src/renderer/App.jsx` references firm/workspace identity in desktop session UI.
- `apps/extension` does not own tenant persistence, but README and QA mention workspace linking and must align to Workspace terminology.

Docs and API references:

- `apps/api-Lexora/docs/database-schema.md` still describes `Firm` as owner and static profile collections.
- `apps/api-Lexora/docs/route-inventory.md` lists `/firms`, `/admin`, `/partner-profiles`, `/lawyer-profiles`, `/associate-profiles`, `/intern-profiles`.
- `apps/web-Laxora/docs/api-mapping.md`, `backend-gaps.md`, `auth-users-permissions.md`, `gst-tds-tax.md`, `rbac-matrix.md`, `aws-google-integrations.md`, and `court-daily-sync.md` contain firm-based API or UX references.

### `companyId`, `organizationId`, `tenantId`

- `companyId`: no active source match found.
- `organizationId`: no active source match found.
- `tenantId`: no active tenant model found; only defensive blocking in `workspaceContext` and architecture/planning language should be retained only if it describes anti-patterns.

## Static Role Dependency Inventory

Backend:

- `apps/api-Lexora/src/modules/workspace/roles.js`: maps legacy roles to commercial roles.
- `apps/api-Lexora/src/modules/users/models/User.js`: enum includes `partner`, `associate`, `intern`, `admin`.
- `apps/api-Lexora/src/modules/users/controllers/*ProfileController.js`: static Partner/Lawyer/Associate/Intern profile controllers.
- `apps/api-Lexora/src/modules/users/routes/*ProfileRoutes.js`: static profile routes.
- `apps/api-Lexora/src/modules/cases/routes/caseRoutes.js` and `caseAssignmentRoutes.js`: static role authorization.
- `apps/api-Lexora/src/modules/billables/routes/billableRoutes.js`, `emailEntries/routes`, `rates/routes`, and multiple controllers use `admin`/`partner` style checks.
- `apps/api-Lexora/src/modules/attendance/controllers/attendanceController.js`, `documentStorage/controllers/documentStorageController.js`, `ai/routes/aiRoutes.js`, `clients/controllers/clientController.js`, and `cases/controllers/caseController.js` contain direct role conditionals.
- `apps/api-Lexora/src/modules/cases/models/CaseAssignment.js` and validators use assignment roles `partner`, `associate`, `admin`, `primary`.
- Tests under `apps/api-Lexora/src/__tests__` use both legacy and commercial roles; `commercialRoles.test.js` is the anchor for the new model.

Frontend:

- `apps/web-Laxora/src/constants/roles.js`: only legacy roles.
- `apps/web-Laxora/src/constants/permissions.js`: hardcoded role-to-module matrix with both old and new roles.
- `apps/web-Laxora/src/routes/routeConfig.js`: roleGroup text uses `Admin`, `Partner`, `Lawyer`, `Associate`, `Intern`, and `Owner`.
- `apps/web-Laxora/src/components/layout/Sidebar.jsx`, `BottomNav.jsx`, `ProtectedRoute.jsx`, and `apps/web-Laxora/src/App.jsx` depend on `canAccess(role, moduleKey)`.
- User-facing pages with static role assumptions include `UserManagementPage`, `RegisterInvitePage`, `ProfilePage`, `DashboardPage`, `MatterAssignmentsPage`, `BillableApprovalPage`, `RateCardsPage`, `Invoice*`, `SettingsAdminPage`, and work approval pages.

## Hardcoded Plan, Feature, and Module Checks

| Dependency | Current Implementation | Risk | Owner |
| --- | --- | --- | --- |
| Member limit | `Firm.memberLimit` defaults to 5 and has max 5; membership controller rejects with "Member limit reached for this plan". | Plan logic is embedded in workspace record and API controller. | Platform/Billing |
| Enterprise modules | `VITE_ENABLE_ENTERPRISE_MODULES` and `excludedProductionPaths` hide People/Payroll/Admin screens. | Module availability is build-time/static, not workspace-plan runtime. | Web/App Shell |
| Module grants | `permissions.js` maps role strings to module keys. | No feature-level permission model or per-workspace overrides. | Web/App Shell |
| Route groups | `routeConfig.js` stores role copy and module keys manually. | Navigation and route availability can drift from backend permission rules. | Web/App Shell |
| Backend permissions | Route-level `authorize(...)` and ad hoc role checks. | Backend cannot express plan feature access, module enablement, or granular permissions. | Platform/API |
| Settings gaps | `backendGapAdapters.permissionMatrix` is read-only/not configured. | Product has no API to manage permissions or module availability. | Platform/API + Settings |

## API Gaps for the Target Model

Do not add these in this audit branch; use this as backlog input.

- `GET /api/workspace` and `PATCH /api/workspace`: canonical workspace profile/settings replacement for `/api/firms/:firmId`.
- `GET /api/workspace/plan`: active plan, limits, billing state, trial state, effective feature bundles.
- `GET /api/workspace/features`: enabled features, disabled features, module visibility, feature denial reasons.
- `GET /api/workspace/permissions`: effective current-user permissions.
- `PATCH /api/workspace/permissions`: owner-managed permission policy once product rules are defined.
- `GET /api/workspace/modules`: runtime navigation contract for web/desktop.
- `GET /api/workspace/onboarding` and `PATCH /api/workspace/onboarding`: already exist conceptually, but backed by `Firm`.
- Compatibility aliases for existing `/api/firms` routes until frontend, docs, tests, and seeds migrate.

## Risk-Ranked Migration Backlog

| Rank | Risk | Why It Matters | First Owner | Sequencing Blocker |
| --- | --- | --- | --- | --- |
| P0 | Workspace record is still `Firm` | Tenant source of truth conflicts with target language and API direction. | Platform/API | Create Workspace model/alias strategy before deleting `/api/firms`. |
| P0 | Login is tied to role plus firm | Users cannot authenticate independently of static roles or firm selection. | Auth | Need canonical workspace membership lookup and migration path for existing users. |
| P0 | Mixed permission systems | Backend route guards and frontend navigation can disagree. | Platform/API + Web | Need effective permission contract before wiring route guards. |
| P0 | Cross-workspace relation validation is incomplete in some controllers | Workspace plugin scopes base queries, but relation IDs still need explicit same-workspace validation. | Module Owners | Inventory controller-by-controller before refactor. |
| P1 | Firm settings own plan-like fields | `memberLimit` and review defaults live on tenant document rather than Plan/Features. | Billing/Settings | Need Plan schema and feature catalog. |
| P1 | Static profile modules | Partner/Lawyer/Associate/Intern controllers and routes encode legacy org design. | People/Auth | Decide replacement member profile model. |
| P1 | Hardcoded navigation | Build-time and role-driven filtering prevents per-workspace modules. | Web/App Shell | Need modules API or local adapter fed by feature catalog. |
| P1 | KPI scope uses `firm` | Analytics APIs expose `scope=firm`. | Analytics/Finance | Define `workspace` scope compatibility and report migration. |
| P2 | Docs and tests teach legacy concepts | API mapping and database docs still use Firm as owner. | Docs/QA | Update after backend compatibility layer lands. |
| P2 | Demo/stitch assets mention BillSync/Firm | Not runtime critical but confusing for product QA. | Product/Web | Clean during UX copy pass. |

## Branch-by-Branch Dependency Map

| Branch | Goal | Depends On | Output |
| --- | --- | --- | --- |
| `codex/architecture-audit-multitenancy` | Current audit and migration map. | None. | This document. |
| `codex/workspace-core-model` | Introduce canonical Workspace service/model naming while preserving existing data. | Audit. | Workspace repository/service, compatibility with Firm collection or migration. |
| `codex/workspace-auth-membership` | Remove normal login dependency on role plus firm; authenticate through user + workspace membership. | Workspace core model. | Auth/session contract with active workspace and memberships. |
| `codex/plan-feature-catalog` | Add Plan, Feature, Permission, Module definitions. | Workspace core model. | Seeded catalog and effective entitlement service. |
| `codex/backend-permission-gates` | Replace static role checks with feature/permission guards. | Plan feature catalog + auth membership. | Shared backend authorization helpers. |
| `codex/frontend-module-navigation` | Drive navigation and route gates from effective modules/permissions. | Plan feature catalog + backend permission contract. | Runtime app shell navigation. |
| `codex/settings-workspace-rename` | Move Firm Settings UX/API adapters to Workspace Settings. | Workspace core model + frontend module navigation. | Workspace settings screens and compatibility adapters. |
| `codex/legacy-role-profile-retirement` | Retire static Partner/Lawyer/Associate/Intern profile routes or map them to member profiles. | Auth membership + backend permission gates. | Member profile model and route migration. |
| `codex/workspace-isolation-hardening` | Add/expand two-workspace relation tests across all retained modules. | Backend permission gates. | Security regression suite. |
| `codex/docs-api-contract-refresh` | Update schema, route, API mapping, and tester docs. | All API compatibility decisions. | Workspace-first docs. |

## Module Migration Owners

| Module | Impact | Owner |
| --- | --- | --- |
| Auth | Login, registration, password reset, token payloads, extension/desktop tokens. | Auth |
| Workspace/Membership | Tenant metadata, membership, invitations, audit events, onboarding, member limits. | Platform/API |
| Users/People | User schema, admin model, static profile controllers, user management. | People/Auth |
| Clients | `firmId`, owner mapping, workspace relation validation, navigation grants. | Client/Matter |
| Matters/Cases | Matter ownership, assignment roles, restricted visibility, relation validation. | Client/Matter |
| Tasks/Work Capture | Work sessions, activities, samples, time entries, approval rules. | Work Capture |
| Billing | Billables, rate cards, invoice lines, approval queues. | Billing |
| Finance/Payments | Payments, AR, reports, KPI, invoice sequence, tax summaries. | Finance |
| Settings/Tax/Storage | Firm settings APIs, GST defaults, storage defaults, permission matrix gaps. | Settings |
| AI/Documents | Matter documents, assistant context, app guide copy, cross-workspace retrieval checks. | AI/Documents |
| Integrations | Zoho, Google/AWS storage docs and settings, extension/desktop handoffs. | Integrations |
| Web App Shell | Route config, sidebar, bottom nav, protected pages, fallback states. | Web/App Shell |
| Desktop/Extension | Session identity copy and workspace link terminology. | Desktop/Extension |
| QA/Docs | Route inventory, database schema, API mapping, RBAC docs, seed/test fixtures. | QA/Docs |

## Acceptance Criteria Trace

- Every tenant and role dependency is listed: yes, by category and file/module above, with verification commands below.
- Every impacted module has a migration owner: yes, see Module Migration Owners.
- Risks and sequencing blockers are documented: yes, see Risk-Ranked Migration Backlog and Branch-by-Branch Dependency Map.
- Do not redesign yet: this branch identifies product and UX surfaces only.
- Do not refactor production code: no production code was changed.

## Verification Commands

Use these commands to re-run the inventory:

```powershell
rg -n -i "\b(firmId|companyId|organizationId|tenantId|workspaceId)\b" apps\api-Lexora\src apps\web-Laxora\src apps\desktop-Lexora\src apps\extension docs\architecture docs\operations README.md SUBMISSION.md
rg -n -i "\b(admin|partner|lawyer|associate|intern|owner|billing_assistant|accountant)\b" apps\api-Lexora\src apps\web-Laxora\src apps\desktop-Lexora\src apps\extension docs\architecture docs\operations README.md SUBMISSION.md
rg -n -i "\b(plan|tier|subscription|memberLimit|VITE_ENABLE_ENTERPRISE_MODULES|feature flag|featureFlag|moduleKey|excludedProductionPaths)\b" apps\api-Lexora\src apps\web-Laxora\src apps\desktop-Lexora\src apps\extension docs\architecture docs\operations README.md SUBMISSION.md
```

## PR Template

```markdown
## Summary
- Adds the Workspace -> Plan -> Features -> Permissions -> Modules migration audit.

## Screens / States Implemented
- [x] Audit report structure
- [x] Current architecture inventory
- [x] Risk-ranked migration backlog
- [x] Branch-by-branch dependency map

## API Mapping
- APIs connected:
  - None; documentation-only audit branch.
- Frontend/service adapters added:
  - None.
- Backend gaps found:
  - Workspace profile/settings API
  - Workspace plan API
  - Workspace features API
  - Effective permissions API
  - Workspace modules/navigation API
  - Firm route compatibility/retirement plan

## UX / Product States Covered
- [x] Loading
- [x] Empty
- [x] Error
- [x] Offline
- [x] Permission denied
- [x] Retry action
- [x] Validation
- [x] Success confirmation

## Verification
- [ ] App builds / tests pass
- [x] Key routes or APIs checked
- [x] Migration or seed checks completed where relevant
- [x] Success path checked
- [x] Failure/fallback path checked
- [x] Responsive or API contract check completed where relevant

## Notes for Tester
- Documentation-only branch. Validate the inventory by re-running the `rg` commands in this report and reviewing route/schema docs for Firm/role references.
```
