# Lexora Current-to-New Product Migration Guide

**Purpose:** Convert the current broad legal ERP prototype into a production-ready, AI-assisted work-to-payment platform for solo lawyers and legal firms with 3–5 lawyers.  
**Target plan:** `Lexora_Production_Readiness_Sprint_Plan.md`  
**Migration strategy:** Incremental replacement with controlled cutover  
**Last updated:** 21 June 2026

## 1. Executive decision

Do **not** discard the entire repository and begin an unrelated rewrite. The current project contains useful working foundations for capture, clients, matters, tasks, rates, invoices, payments, documents, the browser extension and desktop tracker.

Do **not** continue adding the new product directly into the existing enterprise workflow either. That would preserve unsafe ownership assumptions, complex roles and duplicate user journeys.

Use a controlled replacement strategy:

1. Create a new integration branch.
2. Freeze the legacy product except for critical fixes.
3. Build a new focused product shell and `/api/v2` contract inside the existing repository.
4. Introduce a canonical workspace and membership model.
5. Migrate reusable modules behind new services and policies.
6. Run legacy and focused paths side by side only during migration.
7. Validate data, financial totals and user workflows.
8. Cut over the focused product.
9. Remove legacy modules only after rollback and migration gates pass.

This is a strangler migration: replace the unsafe or over-broad parts progressively while retaining proven code where it is economical and safe.

## 2. Current-project audit summary

### Repository shape

The current implementation contains approximately:

- 25 backend feature modules.
- 90 frontend page components.
- 144 configured frontend routes.
- Web, API, Chrome extension and Electron desktop applications.
- 152 passing API tests at the last production-readiness audit.
- Working web and desktop production builds.
- A basic global assistant and prototype matter Q&A.

### Current strengths

- Substantial Express/Mongoose backend coverage.
- Working authentication and JWT foundations.
- Client, matter, task and work-capture models.
- Timer, activity, Gmail/research and desktop capture foundations.
- Rate-card and billable foundations.
- Invoice, PDF/email, payment and receivables foundations.
- Some transactional and idempotency behavior.
- Useful validation and backend test patterns.
- Reusable frontend design components and state patterns.
- Browser extension capture tests.
- Existing AI user interface surfaces.

### Current structural problems

- The product is still organised as a broad legal ERP.
- HR, payroll, attendance, workforce analytics and enterprise administration remain exposed.
- The login and user model require legacy firm and role concepts.
- Solo and small-firm workflows are not the canonical product path.
- There is no mandatory canonical `workspaceId` across retained data.
- Many controllers use direct `findById()` or unscoped queries.
- Invoice and payment records do not consistently contain tenant ownership.
- Caller-supplied `firmId` and ownership values are accepted in places.
- Existing roles are Partner/Lawyer/Associate/Intern/Admin rather than focused commercial roles.
- Work submission and approval remain team-oriented.
- Financial records use floating-point values.
- Production operations, CI, backup verification and monitoring are incomplete.
- Frontend route breadth makes regression and product comprehension difficult.
- The repository tracks generated artifacts and dependency trees that should not be source-controlled.

### Current AI reality

The current AI implementation is a useful prototype, not production AI:

- The global assistant drawer is reusable.
- The app guide mainly uses hard-coded keyword matching.
- Matter retrieval uses lexical substring ranking over whole records.
- Matter answers mainly concatenate excerpts.
- Billable summaries and generated documents are template-oriented.
- There is no provider-neutral model gateway.
- There is no embedding/chunk ingestion pipeline.
- There is no vector retrieval or grounded-generation evaluation.
- AI data and retrieval are not consistently workspace-scoped.
- There are no complete leakage, prompt-injection, citation or cost controls.

## 3. Target product architecture

### Product boundary

The new product supports:

`Workspace → Members → Clients → Matters → Tasks → Work → Review → Billables → Invoices → Payments → Reports`

AI is available across this workflow through:

1. Lexora App Copilot.
2. Contextual workflow assistance.
3. Matter-scoped RAG legal assistant.

### Target applications

| Application | Target responsibility |
|---|---|
| `apps/web-Laxora` | Focused responsive product and AI interfaces |
| `apps/api-Lexora` | Canonical API, authorization, billing logic, RAG and integrations |
| `apps/extension` | Gmail/research capture with workspace-safe token and retry behavior |
| `apps/desktop-Lexora` | Optional local activity capture with explicit privacy controls |

Do not create separate products for solo lawyers and small firms. Both use the same workspace model. A solo workspace has one Owner; a small firm adds up to four memberships.

### Target backend layers

```text
HTTP routes
  → authentication
  → workspace context
  → authorization policy
  → validation
  → application service
  → domain rules
  → workspace-scoped repository
  → MongoDB / object storage / AI provider
```

Controllers should orchestrate requests only. They must not contain independent ownership, financial or AI policy logic.

### Target frontend layers

```text
Product shell
  → route guard
  → focused feature page
  → typed API client
  → reusable feature components
  → shared loading/empty/error/retry states
```

### Target AI layers

```text
AI UI action
  → typed AI operation
  → AI policy and access check
  → minimum necessary context builder
  → retrieval or deterministic data service
  → provider-neutral AI gateway
  → structured result validation
  → citations / warning / confirmation
  → optional user-approved save
```

## 4. Keep, adapt, replace and retire decisions

### Backend modules

| Current module | Decision | Guideline |
|---|---|---|
| `auth` | Replace core flow | Keep hashing/JWT utilities; replace firm-and-role login with account/workspace membership authentication |
| `firms` | Replace concept | Migrate to `workspaces`; preserve practice, GST, currency and billing settings |
| `users` | Replace role/profile model | Keep user identity; replace Partner/Associate/Intern profiles with memberships and optional professional profile |
| `clients` | Adapt | Add mandatory workspace ownership, server-assigned ownership and focused client fields |
| `cases` | Rename and adapt | Expose as matters; add workspace scope, member assignment and focused billing metadata |
| `tasks` | Adapt | Keep CRUD/checklists; replace employee assignment assumptions with matter membership |
| `activities` | Adapt | Keep source/idempotency concepts; enforce workspace and matter policies |
| `workSessions` | Adapt | Keep timer lifecycle and recovery; change stop result to Draft work review by default |
| `timeEntries` | Replace workflow | Migrate approval states to Draft/Ready to Bill/Excluded/Billed with optional owner review |
| `idleIntervals` | Keep optional | Retain only for timer recovery and lawyer-controlled adjustment, not employee monitoring |
| `activitySamples` | Retire by default | Exclude from focused MVP unless required for private local recovery |
| `appUsageEvents` | Retire by default | Do not ship workforce-style monitoring; retain only explicit opt-in capture metadata if justified |
| `billables` | Adapt deeply | Add workspace scope, immutable source references and duplicate-conversion controls |
| `rates` | Adapt deeply | Add workspace scope, rate precedence, minor-unit money and snapshots |
| `invoices` | Adapt deeply | Add workspace numbering, immutable finalisation, revisions, minor-unit totals and access policy |
| `payments` | Adapt deeply | Add ownership, outstanding limits, idempotency, refunds, write-offs and receipt numbering |
| `reports` | Replace query layer | Build from canonical scoped financial services; retain useful response shapes only |
| `documentStorage` | Adapt deeply | Add object authorization, workspace/matter scope, malware/type validation and AI ingestion hooks |
| `emailEntries` | Adapt | Keep source metadata and idempotency; integrate focused mapping and AI narrative suggestions |
| `ai` | Replace internals | Keep UI contracts selectively; introduce gateway, policy, ingestion, retrieval, grounding and evaluation services |
| `analytics` | Split | Retain revenue/work reporting; retire workforce analytics |
| `kpi` | Simplify | Retain focused dashboard metrics; remove enterprise snapshots not needed by the product |
| `attendance` | Retire | Do not mount in focused product |
| `courtSync` | Defer | Keep outside focused MVP and disable by default |
| `integrations` | Defer/adapt later | Keep Zoho code isolated; do not allow it to delay the core product |

### Frontend areas

| Current area | Decision | Guideline |
|---|---|---|
| Shared visual components | Keep | Reuse buttons, forms, cards, state components and responsive tokens |
| Current global layout | Replace navigation | Build focused navigation and remove legacy module exposure |
| Login and registration | Replace | Use owner registration, normal login and workspace invitation acceptance |
| Clients | Adapt | Retain useful screens; simplify ownership and complete contacts/billing fields |
| Matters/cases | Adapt | Rename consistently to Matter and rebuild tabs around solo/small-firm needs |
| Tasks | Adapt | Retain task UI with simple assignment and timer handoff |
| Work meter | Keep and harden | Preserve strong timer functionality and recovery states |
| Submit Work / Time Approval | Replace | Create one Work Review surface with optional owner review |
| Billables/rates | Adapt | Rebuild around focused rate precedence and WIP |
| Invoices | Adapt deeply | Preserve useful list/detail components; replace financial state logic |
| Payments | Adapt deeply | Preserve useful interface patterns; replace unsafe payment mutations |
| Reports | Simplify | Keep income, WIP, collection, aging and activity reports only |
| HR/payroll/attendance/workforce | Retire | Remove imports, routes and production navigation after cutover |
| User management | Replace | Build lightweight Members and Invitations settings |
| Global assistant drawer | Keep UI, replace service | Use the new app copilot contract and citations/action intents |
| Matter AI screens | Adapt deeply | Replace lexical prototype with ingestion, hybrid retrieval and grounded responses |
| Fallback galleries/demo pages | Development only | Exclude from production routing and bundle where possible |

### Extension and desktop

| Component | Decision | Guideline |
|---|---|---|
| Gmail adapter | Keep and harden | Preserve stable source references and add workspace-safe token exchange |
| Research capture | Keep and harden | Capture metadata/narrative with consent; never capture privileged content silently |
| Offline queue | Adapt | Add idempotency, expiry, retry visibility and dead-letter recovery |
| Desktop activity tracker | Optional | Ship only as explicit opt-in; default to minimal metadata and user review |
| Counts/usage monitoring | Retire from focused default | Do not present employee-surveillance behavior |

## 5. New canonical data model

### Identity and tenancy

```text
User
  _id
  email/mobile
  passwordHash/auth identity
  status
  tokenVersion

Workspace
  _id
  name
  type: solo | small_firm
  timezone/currency
  tax and invoice settings
  AI settings

Membership
  workspaceId
  userId
  role: owner | lawyer | billing_assistant | accountant
  status: invited | active | revoked
  matterVisibility: all | assigned
```

### Retained business data

Every retained record must include `workspaceId`:

- Client
- Matter
- Task
- WorkSession
- Activity/CaptureSource
- WorkEntry
- Billable
- Expense
- RateCard
- Document
- Invoice
- InvoiceLine
- Payment
- Receipt
- AuditEvent
- AI conversation/document/chunk/usage records

The API derives `workspaceId` from the authenticated membership. Normal client requests cannot supply or change it.

### Work states

Use one canonical state model:

```text
draft
  → ready_to_bill
  → billed

draft
  → excluded

draft
  → pending_owner_review   (only when configured)
  → ready_to_bill
```

Legacy `submitted`, `approved` and `rejected` values are mapped during migration; they are not retained as parallel product workflows.

### Money

- Store all money in integer minor units.
- Store currency with financial records.
- Snapshot rates, tax, descriptions and quantities at finalisation.
- Use unique idempotency and source keys.
- Never use AI output as the authoritative calculation.

## 6. Source-code structure for the new implementation

Do not create a second uncontrolled set of generic folders. Introduce clear v2 platform boundaries.

### Backend

```text
apps/api-Lexora/src/
  platform/
    auth/
    workspace/
    authorization/
    database/
    money/
    audit/
    observability/
  v2/
    routes/
    clients/
    matters/
    tasks/
    work/
    billing/
    invoices/
    payments/
    reports/
    documents/
    ai/
  legacy/
    adapters/
```

Each v2 module should normally contain:

```text
routes
controller
validators
service
policy
repository
model or schema
tests
```

### Frontend

```text
apps/web-Laxora/src/
  product/
    shell/
    routes/
    permissions/
  features/
    onboarding/
    members/
    clients/
    matters/
    tasks/
    work/
    billing/
    invoices/
    payments/
    reports/
    assistant/
  api/v2/
  shared/
```

Keep legacy pages in place until their focused replacement passes acceptance. Do not mix legacy role logic into new feature components.

## 7. API replacement guidelines

### Namespace

Introduce `/api/v2` for the focused contract. Keep `/api` legacy routes mounted only during migration.

Example target endpoints:

```text
POST   /api/v2/auth/register-owner
POST   /api/v2/auth/login
GET    /api/v2/session

GET    /api/v2/workspace
PATCH  /api/v2/workspace/settings
GET    /api/v2/members
POST   /api/v2/invitations

GET    /api/v2/clients
POST   /api/v2/clients
GET    /api/v2/matters
POST   /api/v2/matters
GET    /api/v2/tasks

POST   /api/v2/work-sessions/start
POST   /api/v2/work-sessions/:id/stop
GET    /api/v2/work-entries
PATCH  /api/v2/work-entries/:id
POST   /api/v2/work-entries/:id/ready-to-bill

GET    /api/v2/billing/wip
POST   /api/v2/invoices
POST   /api/v2/invoices/:id/finalise
POST   /api/v2/invoices/:id/send
POST   /api/v2/payments

GET    /api/v2/reports/income
GET    /api/v2/reports/outstanding

POST   /api/v2/ai/assist
POST   /api/v2/ai/matters/:matterId/chat
POST   /api/v2/ai/matters/:matterId/ingestion
```

### Standard request context

```js
req.auth = {
  userId,
  workspaceId,
  membershipId,
  role,
  permissions,
};
```

### Standard resource query

```js
repository.findOne({
  _id: resourceId,
  workspaceId: req.auth.workspaceId,
});
```

### Standard response envelope

```json
{
  "ok": true,
  "data": {},
  "meta": {}
}
```

Errors should return a stable `code`, safe `message`, optional field errors and a correlation ID.

## 8. Product-shell override

### Configuration

Use explicit configuration during migration:

```text
LEXORA_PRODUCT_MODE=focused
LEXORA_API_VERSION=v2
LEXORA_ENABLE_LEGACY_ROUTES=false
LEXORA_ENABLE_AI=true
LEXORA_ENABLE_DESKTOP_CAPTURE=false
```

Production must use `focused`. Do not allow a query string, browser storage or user-supplied value to enable legacy modules.

### Focused navigation

```text
Dashboard
Clients
Matters
Tasks
Work
Billing
Invoices
Payments
Reports
Assistant
Settings
```

### Route cutover

1. Build focused routes under the new route registry.
2. Map each focused route to a v2 API client.
3. Add route-level role and workspace guards.
4. Add redirects from retained legacy URLs.
5. Return not found for retired production routes.
6. Remove legacy imports from the production bundle after acceptance.

## 9. AI replacement guidelines

### Retain

- Global assistant drawer presentation.
- Matter Q&A screen concepts.
- AI API client error/retry patterns.
- Existing document metadata where it can be migrated safely.

### Replace

- Hard-coded keyword answers with a versioned app knowledge base and contextual copilot.
- Whole-document lexical matching with chunked hybrid retrieval.
- Excerpt concatenation with grounded model answers and citations.
- Template-only generation with typed AI operations and structured output validation.
- Role-specific enterprise help text with the focused membership model.

### New AI services

- `AiGateway`
- `AiPolicyService`
- `AiContextService`
- `DocumentIngestionService`
- `MatterRetrievalService`
- `GroundedAnswerService`
- `WorkflowAssistService`
- `AiUsageService`
- `AiEvaluationService`

### AI cutover order

1. Add workspace ownership to all existing AI records and routes.
2. Disable prototype matter Q&A for data that has not been migrated.
3. Implement provider gateway and policy service.
4. Implement extraction, chunking and embedding jobs.
5. Backfill authorised matter documents.
6. Implement hybrid retrieval and citations.
7. Replace matter-chat response generation.
8. Replace global assistant service.
9. Add typed assistance throughout product modules.
10. Pass leakage, grounding and prompt-injection evaluations.

## 10. Database migration strategy

### Rules

- All migrations are additive before cutover.
- Every migration is repeatable or records its completion version.
- Never delete the legacy field in the same release that introduces its replacement.
- Record source IDs and mapping results.
- Generate before/after counts and financial reconciliation reports.
- Back up and test restoration before production migration.

### Recommended migration phases

#### Phase A — Inventory

- Count every collection and identify orphaned records.
- Identify users without valid firms/workspaces.
- Identify records with ambiguous ownership.
- Identify duplicate clients, matters, billables, invoices and payments.
- Record invoice/payment totals before transformation.

#### Phase B — Workspace backfill

- Create one Workspace for every valid legacy Firm.
- Create Membership records from legacy users.
- Map legacy roles to focused roles.
- Backfill `workspaceId` from trusted parent relationships.
- Quarantine records whose ownership cannot be proved.

Suggested role mapping:

| Legacy role | Focused role |
|---|---|
| Admin | Owner, subject to ownership review |
| Partner | Owner or Lawyer, chosen during migration |
| Lawyer | Lawyer |
| Associate | Lawyer |
| Intern | Lawyer only when authorised; otherwise deactivate or invite later |

#### Phase C — Workflow conversion

- Map case to matter naming at the API/UI layer.
- Map time-entry states to the new work-review states.
- Add immutable source references to billables.
- Convert rate and money values to minor units.
- Add workspace invoice sequence records.

#### Phase D — Dual verification

- Run legacy and v2 read calculations against the same migrated data.
- Compare client, matter, WIP, invoice, payment and outstanding totals.
- Resolve differences before enabling writes.

#### Phase E — Focused writes

- Enable v2 writes for internal/staging users.
- Stop normal writes through the equivalent legacy endpoint.
- Monitor reconciliation and audit events.

#### Phase F — Cutover

- Take a final backup.
- Run the final migration and reconciliation.
- Enable the focused shell and `/api/v2`.
- Disable legacy production routes.
- Monitor errors, balances and data-access denials.

#### Phase G — Retirement

- Retain rollback capability for the agreed window.
- Remove unused code only after the rollback window closes.
- Archive legacy migration reports and mappings.

## 11. Implementation waves

### Wave 0 — Repository and branch safety

1. Create `codex/production-ready-solo-small-firm` from a reviewed clean baseline.
2. Do not include unrelated generated `node_modules` or output changes.
3. Add ignore rules on a dedicated repository-hygiene branch.
4. Confirm clean installs, tests and builds.
5. Tag the legacy baseline for rollback.

### Wave 1 — Platform foundation

- Workspace and Membership models
- Authentication context
- Authorization policy service
- Workspace-scoped repository helpers
- Audit and correlation IDs
- Migration framework
- Two-workspace security fixtures

Do not start new AI retrieval or financial features before this wave passes.

### Wave 2 — Focused identity and shell

- Owner registration
- Invitations and memberships
- Simplified roles
- Focused route registry and navigation
- Legacy module feature gating
- Onboarding

### Wave 3 — Core practice workflow

- Clients
- Matters
- Tasks
- Timer/manual/Gmail/research capture
- Work Review
- Optional owner review

### Wave 4 — Financial workflow

- Minor-unit money
- Rates and WIP
- Expenses
- Invoice finalisation and numbering
- Email/PDF delivery
- Payments, receipts and reports

### Wave 5 — AI-first workflow

- AI gateway and policy
- App copilot
- Document ingestion
- Matter RAG
- Citations
- Workflow assistance
- AI telemetry/evaluations

### Wave 6 — Operations and cutover

- CI/CD
- Dependency remediation
- Staging/production
- Monitoring
- Backup restoration
- End-to-end tests
- Pilot
- Go/no-go

## 12. First implementation branches

Use this exact order unless a blocking discovery changes the dependency graph:

1. `codex/repo-hygiene-baseline`
2. `codex/workspace-schema-migration`
3. `codex/workspace-auth-context`
4. `codex/workspace-repository-policy`
5. `codex/cross-workspace-security-tests`
6. `codex/focused-auth-membership`
7. `codex/focused-product-shell`
8. `codex/clients-matters-v2`
9. `codex/tasks-work-review-v2`
10. `codex/capture-v2`
11. `codex/money-rates-billables-v2`
12. `codex/invoices-payments-v2`
13. `codex/reports-v2`
14. `codex/ai-platform-foundation`
15. `codex/matter-rag-v2`
16. `codex/ai-workflow-assist`
17. `codex/production-operations`
18. `codex/pilot-release`

## 13. Coding guidelines

### Required

- All v2 queries include workspace scope.
- All mutations enforce a policy before service execution.
- All external IDs and related records are validated.
- All financial operations use minor units and transactions.
- All conversions use idempotency keys or unique source constraints.
- All final financial records are immutable or revision-based.
- All AI operations use typed schemas and human confirmation rules.
- All AI retrieval is filtered by workspace and matter.
- All user-visible background operations expose status and retry behavior.
- All critical actions write audit events.

### Forbidden

- `findById()` for a workspace-owned resource without an enclosing scoped repository.
- Accepting `workspaceId` from a normal browser payload.
- Frontend-only permission enforcement.
- Parallel old and new status models after cutover.
- AI-generated financial totals.
- AI-driven sending, filing, invoicing or payment without confirmation.
- Silent capture of document/body content by desktop or extension tools.
- New imports from retired HR/payroll/attendance modules into focused features.
- Large cross-module controllers containing business rules.

## 14. Testing guidelines

### Every retained resource

Test:

- Workspace A owner access.
- Workspace A member permission.
- Workspace B denial using a copied ID.
- Invalid relation across workspaces.
- List, detail, create, update, archive/delete and export behavior.

### Every financial feature

Test:

- Rounding.
- Duplicate prevention.
- Concurrent submission.
- Partial allocation.
- Overpayment and write-off limits.
- Finalisation locks.
- Void/revision behavior.
- Report reconciliation.

### Every AI feature

Test:

- Authorised context only.
- Cross-workspace leakage resistance.
- Insufficient-evidence refusal.
- Citation correctness.
- Prompt injection in documents.
- Structured-output validation.
- Human confirmation.
- Provider failure fallback.
- Token/cost limits.

## 15. Cutover gates

Do not switch production to the new product until:

- Every retained entity has verified workspace ownership.
- Cross-workspace tests pass for all retained APIs and AI retrieval.
- Migrated record counts reconcile.
- WIP, invoice, payment and outstanding totals reconcile.
- The focused navigation exposes no retired module.
- Solo registration and five-member onboarding pass.
- The complete work-to-payment workflow passes.
- AI citations and refusal behavior pass evaluation.
- No critical/high production dependency finding remains.
- CI/CD passes from a clean clone.
- Backup restoration and rollback have succeeded.
- No P0/P1 defect remains.

## 16. Rollback plan

- Tag the pre-migration release.
- Back up database and object storage immediately before cutover.
- Keep reversible field mappings and migration logs.
- Do not drop legacy fields during the first focused release.
- Keep legacy reads available to administrators in a non-public diagnostic environment.
- If reconciliation, isolation or financial defects appear, disable focused writes, restore the prior release and investigate using correlation/audit IDs.
- Never resolve a failed migration by manually editing production financial records without an auditable correction process.

## 17. Definition of migration complete

The override is complete when:

- Production runs the focused product shell and `/api/v2` contract.
- Solo and small-firm users share one secure workspace model.
- Legacy roles and approval workflows are absent from normal operation.
- HR, payroll, attendance and workforce modules are not mounted in production.
- Clients, matters, tasks, capture, review, billing, invoices, payments and reports use the canonical v2 model.
- The app copilot and matter RAG use secured production AI services.
- All data, financial, AI and operational release gates pass.
- Pilot users complete real controlled work-to-payment cycles.
- The rollback window closes without unresolved P0/P1 defects.

## 18. Immediate next action

Do not begin by redesigning screens or expanding AI prompts.

Begin with `codex/repo-hygiene-baseline`, then implement `codex/workspace-schema-migration` and `codex/workspace-auth-context`. The new product becomes safe and coherent only after workspace ownership is canonical. All subsequent frontend, financial and AI work depends on that foundation.
