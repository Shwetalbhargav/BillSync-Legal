# Lexora Production-Readiness Sprint Plan

**Product:** Lexora legal work-to-payment platform  
**Target customers:** Independent lawyers and small legal firms with 3–5 lawyers  
**Plan duration:** 12 weeks / 6 two-week sprints  
**Planned implementation effort:** 480 hours  
**Delivery model:** One full-stack developer using AI-assisted development  
**Document status:** Implementation baseline  
**Last updated:** 20 June 2026

## 1. Product objective

Prepare Lexora for a controlled commercial launch using one secure workspace model that supports both:

- A solo lawyer operating as the workspace owner.
- A small legal firm with one owner and up to four additional members.

The commercial workflow is:

`Register → Workspace Setup → Client → Matter → Task → Work Capture → Review → Billable → Invoice → Send → Payment → Reports`

For small firms, owner review is configurable:

`Captured Work → Self Review → Optional Owner Review → Ready to Bill`

## 2. Scope principles

### Included

- Secure customer/workspace isolation.
- Solo-lawyer onboarding.
- Small-firm membership and matter assignment.
- Clients, matters and tasks.
- Web timer and manual time entry.
- Gmail and research capture.
- Optional desktop activity capture.
- Work review and billable conversion.
- Rates, fixed fees, expenses and WIP.
- GST-ready invoices and PDF delivery.
- Full and partial payments, write-offs and receipts.
- Income, WIP, collection and outstanding reports.
- Context-aware AI copilot available throughout the application.
- AI-assisted work capture, narrative drafting, matter summarisation, billing and collections.
- Workspace- and matter-scoped RAG assistant with source citations.
- Production deployment, monitoring, backups and support controls.

### Excluded from the commercial MVP

- HR and payroll.
- Attendance and leave management.
- Workforce analytics and employee monitoring.
- Enterprise role matrices.
- Multi-stage partner and billing-manager approvals.
- Trust accounting and general ledger.
- Native mobile applications.
- Deep CRM, ERP and accounting integrations.
- Automatic court feeds and unrestricted open-web legal research during the MVP.

## 3. Simplified roles

| Role | Permitted capability |
|---|---|
| Owner | Full workspace, member, matter, billing, payment, report and settings access |
| Lawyer | Assigned matters, tasks, work capture and self-review |
| Billing assistant | Billables, invoices, payments and reports without legal-work editing |
| Accountant | Read-only financial reports and approved exports |

A solo account automatically receives the `Owner` role. The backend, not the frontend, is authoritative for permissions.

## 4. Delivery rules

1. Production safety takes priority over feature breadth.
2. Every retained entity must be scoped to an authenticated workspace.
3. The API must never trust caller-supplied ownership identifiers.
4. Financial totals must be calculated server-side in integer minor units.
5. Each sprint must deliver a working vertical slice against real APIs.
6. Tests must be committed with the implementation.
7. No excluded module may enter the sprint without replacing work of equal or greater effort.
8. A sprint is not complete while a release-gate defect remains open.
9. AI output is advisory and editable; no AI action may file, send, invoice, pay or alter a final record without explicit user confirmation.
10. Matter AI may use only authorised workspace and matter context, with citations for factual answers.

## 5. Branch strategy

Create an integration branch from `main`:

`codex/production-ready-solo-small-firm`

Use short-lived child branches and merge them sequentially after verification:

| Sprint | Suggested branches |
|---|---|
| Sprint 1 | `codex/workspace-auth-context`, `codex/workspace-data-isolation`, `codex/security-hardening` |
| Sprint 2 | `codex/simple-roles-membership`, `codex/solo-onboarding`, `codex/focused-product-shell` |
| Sprint 3 | `codex/money-and-rates`, `codex/invoice-integrity`, `codex/payment-integrity` |
| Sprint 4 | `codex/workflow-completion`, `codex/expenses-and-documents`, `codex/reports-reconciliation` |
| Sprint 5 | `codex/ci-deployment`, `codex/observability-recovery`, `codex/pilot-release` |
| Sprint 6 | `codex/ai-platform-foundation`, `codex/matter-rag`, `codex/ai-workflow-assist`, `codex/ai-safety-evaluation` |

Do not run overlapping schema migrations on parallel branches.

## 6. Definition of Ready

A backlog item is ready when:

- The user outcome and route are identified.
- Data ownership and workspace rules are explicit.
- Frontend, API and schema impact are known.
- Acceptance criteria are testable.
- Migration and compatibility risks are documented.
- Dependencies are complete or included in the same sprint.
- The exact verification approach is stated.

## 7. Definition of Done

A backlog item is done when:

- The implementation uses real API data.
- Workspace ownership is enforced server-side.
- Validation, loading, empty, error and retry states work.
- Unit and integration tests cover success and boundary cases.
- The frontend production build passes.
- Relevant API, extension or desktop tests pass.
- Financial values reconcile where applicable.
- Audit events are recorded for sensitive changes.
- Documentation and this tracker are updated.
- No P0 or P1 defect remains against the item.

## AI product architecture

AI is a product-wide capability, not a standalone chatbot page. Lexora will provide three coordinated AI layers.

### Layer A — Lexora App Copilot

The global copilot helps users operate Lexora itself. It can:

- Explain the current screen and available actions.
- Guide onboarding and the work-to-payment workflow.
- Identify incomplete setup or missing workflow context.
- Navigate to the correct screen after user confirmation.
- Explain validation and recovery errors in plain language.
- Answer role-aware questions about permitted actions.

The app copilot must use a versioned product-help knowledge base generated from actual routes, workflows and product documentation. It must not inspect another workspace or invent unavailable features.

### Layer B — Workflow AI Assistance

Contextual AI actions are embedded in retained modules:

| Module | AI assistance |
|---|---|
| Dashboard | Summarise priorities, unreviewed work, overdue invoices and suggested next actions |
| Clients | Summarise notes and draft professional client communications |
| Matters | Produce matter chronology, issue list, missing-information checklist and status summary |
| Tasks | Suggest tasks and deadlines from authorised matter material, requiring confirmation |
| Work capture | Draft concise billable narratives and suggest client/matter/task mapping |
| Work review | Detect duplicates, weak narratives, unusual durations and missing rates |
| Billing | Explain rate resolution and flag unbilled WIP or possible duplicate billing |
| Invoices | Draft line descriptions, cover emails and payment reminders |
| Payments | Draft reminders and explain outstanding balances without changing records |
| Reports | Provide natural-language summaries grounded in server-calculated report data |

AI suggestions must remain drafts until the lawyer accepts or edits them. Deterministic server logic remains authoritative for money, tax, permissions, dates and status transitions.

### Layer C — Matter RAG Legal Assistant

The matter assistant answers questions only from documents and structured data authorised for the selected matter. It supports:

- Matter-specific questions and answers.
- Source-linked summaries.
- Chronology and event extraction.
- Parties, claims, issues and evidence extraction.
- Contradiction and missing-document identification.
- Draft outlines, correspondence and internal notes.
- Comparison of matter documents.
- Saved research and lawyer-authored notes.

Every factual answer must cite the supporting document and page, paragraph or text span where available. If support is missing, the assistant must say that the indexed matter material does not establish the answer.

### Current AI baseline and required replacement

The existing application already contains an assistant drawer, AI routes, matter-document storage and a basic matter Q&A surface. The current implementation is an early prototype:

- App help is primarily keyword matching over hard-coded guidance.
- Matter retrieval is lexical substring scoring over whole documents.
- Matter answers mainly concatenate document excerpts.
- Billable summaries and generated documents are mostly templates.
- There is no production model-provider abstraction, embedding index, chunk pipeline or grounded-generation evaluation.
- Existing AI queries are not consistently workspace-scoped.

The production implementation must preserve useful UI surfaces while replacing prototype internals with the secured architecture below.

### AI service architecture

Introduce these services behind the API:

1. `AiGateway` — provider-neutral model and embedding interface.
2. `AiPolicyService` — permissions, consent, redaction and action restrictions.
3. `AiContextService` — builds minimum necessary workspace, user, screen and matter context.
4. `DocumentIngestionService` — extracts, normalises, chunks and indexes documents.
5. `MatterRetrievalService` — hybrid vector and keyword retrieval with matter/workspace filters.
6. `GroundedAnswerService` — produces answers constrained to retrieved evidence and citations.
7. `WorkflowAssistService` — typed assistance for narratives, summaries, email and task suggestions.
8. `AiUsageService` — token, latency, provider, cost and outcome telemetry without storing unnecessary privileged content.
9. `AiEvaluationService` — regression fixtures for retrieval, citation, refusal and leakage behavior.

### AI data model

Add workspace-scoped records for:

- AI conversation and message metadata
- AI feedback
- AI usage/cost event
- AI prompt-template version
- Document-ingestion job
- Document chunk
- Embedding/index reference
- Citation
- AI-generated draft and acceptance status

Do not store raw prompts or responses by default when they contain privileged matter content. Make retention configurable and document it clearly.

### AI safety requirements

- Enforce workspace and matter access before retrieval.
- Filter every vector and keyword query by `workspaceId` and `matterId`.
- Treat retrieved documents as untrusted data and resist prompt injection within documents.
- Do not let document content override system policies or request external actions.
- Redact secrets and unnecessary personal data from provider requests.
- Use provider configurations that do not train on customer data.
- Encrypt matter documents, chunks and provider credentials.
- Display citations, model limitations and a lawyer-review warning.
- Require explicit confirmation before saving an AI draft into a matter.
- Require separate confirmation before sending email, finalising an invoice or changing workflow state.
- Never autonomously file court documents, provide a legal conclusion without sources, or execute payments.
- Provide a workspace-level AI disable switch and matter-level exclusion.
- Log who requested, accepted, edited or rejected an AI suggestion.

# Sprint 1 — Workspace Isolation and Security

**Duration:** Weeks 1–2  
**Sprint goal:** Ensure one customer can never access or mutate another customer’s data.  
**Priority:** Stop-ship foundation  
**Status:** Not started

## Sprint 1 backlog

| ID | Work item | Estimate | Status |
|---|---|---:|---|
| S1-01 | Introduce canonical `workspaceId` and migration strategy | 12 h | Not started |
| S1-02 | Add workspace identity to authenticated request context | 6 h | Not started |
| S1-03 | Scope client, matter, task and member operations | 10 h | Not started |
| S1-04 | Scope activities, sessions, time entries and billables | 10 h | Not started |
| S1-05 | Scope expenses, documents, invoices and payments | 12 h | Not started |
| S1-06 | Scope reports, aggregations, PDFs and exports | 8 h | Not started |
| S1-07 | Add API security middleware and authentication controls | 8 h | Not started |
| S1-08 | Add two-workspace isolation test suite | 10 h | Not started |
| S1-09 | Migration verification and sprint regression | 4 h | Not started |

**Planned effort:** 80 hours

## Implementation requirements

### Data model

Add mandatory `workspaceId` to all retained entities:

- User and membership
- Client and contact
- Matter and assignment
- Task
- Activity and work session
- Time entry and billable
- Expense and stored document
- Rate card
- Invoice and invoice line
- Payment and receipt
- Audit event and persisted report snapshot

Add workspace-aware compound indexes for common lookups and uniqueness rules.

### Backend ownership controls

- Resolve the workspace from the authenticated user or membership.
- Never accept `workspaceId`, `firmId`, `ownerUserId` or equivalent ownership from normal client payloads.
- Replace unrestricted resource lookup with `{ _id, workspaceId }` queries.
- Scope every aggregation pipeline at its first stage.
- Validate related entities belong to the same workspace.
- Return `404` for inaccessible resources to avoid leaking their existence.
- Scope generated documents, download routes and email delivery.

### Security hardening

- Add security headers.
- Add login and API rate limits.
- Set explicit JSON and upload size limits.
- Protect against NoSQL operator injection.
- Add CSRF protection or strict origin verification for cookie-authenticated mutations.
- Add authentication-attempt throttling.
- Add password-reset tokens with expiry and one-time use.
- Add session revocation or token-version support.
- Restrict extension requests to configured extension IDs.
- Disable mock payment completion in production.

## Sprint 1 acceptance criteria

- Workspace A cannot read, update, delete, invoice, pay, export or download Workspace B data.
- Caller-supplied ownership fields are rejected or ignored.
- Cross-workspace relation creation fails.
- Every retained query and aggregation is workspace-scoped.
- Existing records are migrated or quarantined safely.
- No production request uses an unscoped financial-resource lookup.
- Security middleware is enabled in the production configuration.
- No P0/P1 security defect remains.

## Sprint 1 verification

- Run the complete API test suite.
- Run the new two-workspace security suite.
- Test resource IDs from Workspace B using a Workspace A session.
- Verify PDF and document downloads with foreign resource IDs.
- Verify aggregation and CSV results contain only the active workspace.
- Verify rate limiting and authentication failure behavior.

## Sprint 1 review demonstration

Create two separate customers with similar data. Log in as Workspace A and demonstrate that every attempt to access Workspace B data is rejected while Workspace A completes normal CRUD operations.

# Sprint 2 — Solo and Small-Firm Product Model

**Duration:** Weeks 3–4  
**Sprint goal:** Replace the enterprise-oriented account model with focused onboarding and lightweight team support.  
**Status:** Not started

## Sprint 2 backlog

| ID | Work item | Estimate | Status |
|---|---|---:|---|
| S2-01 | Implement Owner, Lawyer, Billing Assistant and Accountant roles | 10 h | Not started |
| S2-02 | Migrate legacy roles and preserve valid users | 8 h | Not started |
| S2-03 | Implement workspace membership and invitation lifecycle | 14 h | Not started |
| S2-04 | Implement solo-owner registration and workspace creation | 10 h | Not started |
| S2-05 | Build guided practice onboarding | 12 h | Not started |
| S2-06 | Add matter assignment and restricted visibility | 10 h | Not started |
| S2-07 | Replace approval workflow with configurable Work Review | 8 h | Not started |
| S2-08 | Remove or feature-gate excluded enterprise modules | 4 h | Not started |
| S2-09 | Add role and onboarding integration tests | 4 h | Not started |

**Planned effort:** 80 hours

## Implementation requirements

### Account and membership

- Registration creates one workspace and one Owner membership atomically.
- Support invite, accept, resend, expire and revoke operations.
- Limit the initial commercial plan to five active members.
- Record membership and permission changes in the audit log.
- Prevent the final Owner from removing or demoting themselves without ownership transfer.

### Onboarding sequence

1. Create account.
2. Enter practice name and contact details.
3. Configure GSTIN, billing address and tax defaults.
4. Configure currency, timezone, invoice prefix and payment instructions.
5. Set the default hourly rate and payment terms.
6. Create the first client.
7. Create the first matter.
8. Start or record the first work entry.

### Focused frontend

Use the commercial navigation:

- Dashboard
- Clients
- Matters
- Tasks
- Work
- Billing
- Invoices
- Payments
- Reports
- Settings

Remove or feature-gate:

- HR
- Payroll
- Attendance
- Leave
- Workforce analytics
- Enterprise user administration
- Partner/associate/intern language

Rename:

- `Submit Work` → `Review Work`
- `Time Approval` → `Work Review`
- `Approved` → `Ready to Bill` where approval is not configured

## Sprint 2 acceptance criteria

- A solo lawyer registers without selecting a role or existing firm.
- A solo workspace can operate with one Owner.
- An Owner can invite up to four members.
- A Lawyer sees assigned matters when restricted mode is enabled.
- A Billing Assistant can invoice and record payments without changing legal work.
- An Accountant cannot mutate financial records.
- Owner review is configurable and not mandatory for a solo lawyer.
- Excluded modules are absent from the production navigation and protected routes.

## Sprint 2 verification

- Test registration and onboarding from an empty database.
- Test invitation expiry, resend and revocation.
- Test every retained role against protected routes.
- Test solo work review and optional owner review.
- Run desktop and mobile navigation checks.
- Verify removed modules cannot be reached through direct URLs.

## Sprint 2 review demonstration

Complete onboarding as a solo lawyer, then create a five-member workspace and demonstrate matter assignment, restricted lawyer visibility, billing access and accountant read-only behavior.

# Sprint 3 — Financial Integrity

**Duration:** Weeks 5–6  
**Sprint goal:** Make rates, billables, invoices and payments commercially trustworthy.  
**Priority:** Stop-ship financial foundation  
**Status:** Not started

## Sprint 3 backlog

| ID | Work item | Estimate | Status |
|---|---|---:|---|
| S3-01 | Introduce integer minor-unit money representation | 10 h | Not started |
| S3-02 | Implement rate precedence and rate snapshots | 10 h | Not started |
| S3-03 | Harden billable conversion and duplicate prevention | 8 h | Not started |
| S3-04 | Add atomic workspace invoice numbering | 8 h | Not started |
| S3-05 | Add GST, discount and total calculation service | 10 h | Not started |
| S3-06 | Implement finalise, lock, void and revision controls | 10 h | Not started |
| S3-07 | Harden payments, write-offs, refunds and receipts | 12 h | Not started |
| S3-08 | Add financial concurrency and reconciliation tests | 12 h | Not started |

**Planned effort:** 80 hours

## Implementation requirements

### Money and tax

- Store monetary values in integer paise.
- Use one shared server-side calculation service.
- Define explicit rounding rules.
- Support GST-exclusive, GST-inclusive and no-GST invoices.
- Snapshot tax settings when an invoice is finalised.
- Prevent current settings from changing historical invoices.

### Rate resolution

Apply rates in this order:

`Matter → Client → Lawyer → Workspace default`

Support:

- Hourly matters
- Fixed-fee matters
- Client and matter overrides
- Billable and non-billable work
- Write-up/write-down with reason
- Unbilled WIP

### Invoice controls

- Generate invoice numbers atomically per workspace.
- Enforce a unique `{ workspaceId, invoiceNumber }` index.
- Calculate totals only on the server.
- Prevent one billable or expense from being invoiced twice.
- Support draft, finalised, sent, partial, paid, overdue, void and revised states.
- Lock finalised invoices.
- Use revision or credit records instead of silently changing financial history.
- Persist delivery events and failure details.

### Payment controls

- Support full and partial payments.
- Reject overpayment unless explicitly recorded as client credit.
- Cap write-offs at the outstanding balance.
- Model refunds explicitly.
- Require references for UPI and bank transfers.
- Make payment creation idempotent.
- Recompute invoice balance and status within the same transaction.
- Preserve immutable payment audit history.
- Generate numbered payment receipts.

## Sprint 3 acceptance criteria

- Invoice totals reconcile exactly from immutable line snapshots.
- Concurrent invoice creation does not duplicate numbers.
- Concurrent conversion cannot bill work twice.
- Finalised invoices cannot be edited directly.
- Partial payments update status and outstanding balance correctly.
- Overpayments and excessive write-offs are rejected.
- Refunds and voids preserve the audit history.
- Reports use the same financial source of truth.

## Sprint 3 verification

- Run golden GST and rounding fixtures.
- Run concurrent invoice-number tests.
- Run duplicate billable and expense conversion tests.
- Run partial-payment, overpayment, write-off and refund tests.
- Compare invoice PDF totals with stored invoice totals.
- Reconcile WIP, billed, paid and outstanding values across reports.

## Sprint 3 review demonstration

Review time, apply a matter-specific rate, add an expense, generate and finalise a GST invoice, send it, record a partial payment, issue a receipt and verify the remaining balance in reports.

# Sprint 4 — Complete Commercial Workflow

**Duration:** Weeks 7–8  
**Sprint goal:** Complete and polish the daily work-to-payment workflow for solo and small-firm users.  
**Status:** Not started

## Sprint 4 backlog

| ID | Work item | Estimate | Status |
|---|---|---:|---|
| S4-01 | Complete client records, contacts and balances | 8 h | Not started |
| S4-02 | Complete matter details, assignments and summaries | 10 h | Not started |
| S4-03 | Harden tasks and task-to-timer handoff | 6 h | Not started |
| S4-04 | Harden web timer and manual entry recovery | 10 h | Not started |
| S4-05 | Harden Gmail, research and desktop capture | 10 h | Not started |
| S4-06 | Complete expenses and receipt attachments | 10 h | Not started |
| S4-07 | Complete invoice PDF and email delivery | 8 h | Not started |
| S4-08 | Complete dashboard, reports and CSV exports | 10 h | Not started |
| S4-09 | Add end-to-end workflow tests and responsive polish | 8 h | Not started |

**Planned effort:** 80 hours

## Implementation requirements

### Clients and matters

- Multiple client contacts
- Billing address and GST details
- Payment terms and notes
- Client archive/reopen lifecycle
- Matter number, title and type
- Court and case details
- Important dates and assigned lawyers
- Billing method and rate override
- Matter documents and tasks
- WIP, billed, collected and outstanding summaries

### Work capture

- Web timer lifecycle
- Manual time entry
- Task-to-timer context
- Client/matter/task mapping
- Gmail capture
- Research capture
- Optional desktop capture
- Offline queue and retry
- Duplicate-source protection
- Idle recovery
- Billable/non-billable classification
- Visible capture-health state

### Expenses and documents

- Expense categories
- Matter mapping
- Billable/non-billable classification
- GST treatment
- Receipt attachment
- Optional owner review
- Invoice conversion
- Duplicate-invoice prevention
- Workspace-scoped document authorization

### Reports

- Work recorded today
- Unreviewed work
- Unbilled WIP
- Monthly billing
- Monthly collections
- Outstanding invoices
- Receivables aging
- Revenue by client
- Revenue by matter
- Time by lawyer and activity
- CSV export
- Workspace, lawyer, client, matter and date filters

Remove unfinished report actions from the production interface unless implemented completely.

## Sprint 4 acceptance criteria

- Every capture source creates no more than one work item.
- Offline capture retries without losing or duplicating work.
- Work review converts valid entries to billables exactly once.
- An expense can be invoiced exactly once.
- Invoice email attempts have visible delivery history and retry behavior.
- Dashboard and reports reconcile with source records.
- The retained workflow works on supported desktop and mobile web widths.

## Sprint 4 verification

- Run timer lifecycle and crash-recovery tests.
- Run Gmail/research duplicate-capture tests.
- Run expense attachment authorization tests.
- Run complete workflow tests for one solo and one five-member workspace.
- Verify all important loading, empty, validation, error and retry states.
- Verify exported CSV values against API/report totals.

## Sprint 4 review demonstration

Demonstrate the complete workflow from client creation through payment and reports using a solo account, then repeat capture and review using an assigned lawyer in a small-firm workspace.

# Sprint 5 — Production Operations and Release Foundation

**Duration:** Weeks 9–10  
**Sprint goal:** Establish repeatable deployment, monitoring and recovery before final AI integration and pilot launch.  
**Status:** Not started

## Sprint 5 backlog

| ID | Work item | Estimate | Status |
|---|---|---:|---|
| S5-01 | Clean repository and establish ignore policy | 6 h | Not started |
| S5-02 | Resolve production dependency vulnerabilities | 10 h | Not started |
| S5-03 | Add API container and environment validation | 8 h | Not started |
| S5-04 | Implement CI quality and security pipeline | 10 h | Not started |
| S5-05 | Configure staging and production deployment | 10 h | Not started |
| S5-06 | Add logging, monitoring and alerting | 10 h | Not started |
| S5-07 | Implement and test backup restoration | 8 h | Not started |
| S5-08 | Complete privacy, support and incident controls | 6 h | Not started |
| S5-09 | Run full regression, accessibility and load smoke tests | 8 h | Not started |
| S5-10 | Prepare pilot environments, accounts and operating checklist | 4 h | Not started |

**Planned effort:** 80 hours

## Implementation requirements

### Repository and dependencies

- Add a comprehensive root `.gitignore`.
- Stop tracking `node_modules`, generated builds and local environment files.
- Preserve required extension release artifacts outside normal source tracking where practical.
- Recreate installations from lockfiles.
- Upgrade vulnerable API and desktop dependencies safely.
- Require zero unresolved critical or high production vulnerabilities.

### Deployment

- Add an API Dockerfile.
- Define local, test, staging and production environments.
- Validate required environment variables at startup.
- Use managed secrets instead of repository files.
- Pin supported Node.js versions.
- Add database migration/version tooling.
- Document deployment, rollback and emergency-disable procedures.

### CI pipeline

Every pull request must run:

1. Clean dependency installation from lockfiles.
2. API unit and integration tests.
3. Workspace-isolation tests.
4. Financial-invariant tests.
5. Web production build.
6. Desktop production build.
7. Extension tests.
8. Lint and static checks.
9. Dependency audit.
10. End-to-end smoke test.

### Observability

- Structured JSON logging
- Correlation/request IDs
- Central error tracking
- Availability monitoring
- Database-aware health checks
- Email-provider health checks
- Failed capture alerts
- Failed invoice-delivery alerts
- Payment reconciliation alerts
- Audit-log retention

### Backup and recovery

- Automated encrypted database backups
- Document-storage backups
- Defined backup retention
- Restoration runbook
- Successful restoration drill
- Pilot RPO target: 24 hours
- Pilot RTO target: 4 hours

### Commercial controls

- Privacy policy
- Terms of service
- Data-processing terms
- User data export
- Account and workspace deletion process
- Gmail and desktop-capture consent
- Support channel and escalation levels
- Incident-response procedure
- Known-product-limitations document

## Sprint 5 acceptance criteria

- A clean clone installs, tests and builds without manual repository artifacts.
- CI rejects isolation, financial, build or high-severity security failures.
- Staging and production deployment are repeatable.
- Production health checks verify critical dependencies.
- Monitoring produces actionable alerts.
- Backup restoration succeeds using written instructions.
- Rollback is demonstrated.
- No P0/P1 defect remains.
- Pilot environments and accounts are prepared for final AI integration and release validation.

## Sprint 5 verification

- Run the complete CI pipeline from a clean clone.
- Deploy to staging using production-like configuration.
- Run load smoke tests against critical routes.
- Trigger and verify representative alerts.
- Restore a backup into an isolated environment and reconcile record counts.
- Execute rollback.
- Complete accessibility and responsive checks.
- Run the full end-to-end workflow for every pilot workspace.

## Sprint 5 review demonstration

Deploy a staging candidate, demonstrate monitoring and health checks, restore a backup, execute the complete work-to-payment flow and confirm the platform is ready for final AI integration.

# Sprint 6 — AI Copilot, Matter RAG and Pilot Launch

**Duration:** Weeks 11–12  
**Sprint goal:** Replace prototype AI behavior with a secure, grounded and measurable AI layer throughout Lexora.  
**Priority:** Required for the AI-supported commercial product  
**Status:** Not started

## Sprint 6 backlog

| ID | Work item | Estimate | Status |
|---|---|---:|---|
| S6-01 | Implement provider-neutral AI gateway and environment controls | 8 h | Not started |
| S6-02 | Implement AI policy, consent, redaction and workspace isolation | 10 h | Not started |
| S6-03 | Build document extraction, chunking and ingestion pipeline | 12 h | Not started |
| S6-04 | Implement hybrid matter retrieval and citation mapping | 12 h | Not started |
| S6-05 | Implement grounded matter chatbot and conversation UI | 12 h | Not started |
| S6-06 | Upgrade global app copilot to route- and context-aware assistance | 8 h | Not started |
| S6-07 | Add contextual AI actions across work, matters, billing and collections | 8 h | Not started |
| S6-08 | Add AI usage, cost, latency, feedback and failure monitoring | 4 h | Not started |
| S6-09 | Add retrieval, citation, leakage and prompt-injection evaluations | 6 h | Not started |

**Planned effort:** 80 hours

## Implementation requirements

### AI gateway

- Use a provider-neutral interface for chat completion, structured output and embeddings.
- Keep model names and provider credentials in validated environment configuration.
- Support request timeouts, bounded retries and circuit breaking.
- Set maximum context and output budgets per operation.
- Return stable error codes for unavailable, rate-limited, rejected and malformed AI results.
- Provide a non-AI fallback for critical workflow operations.
- Never expose provider keys to web, desktop or extension clients.

### App copilot

- Supply current route, user role, workspace configuration and safe screen state.
- Index versioned product help generated from retained routes and documentation.
- Return suggested actions as typed UI intents rather than executable free text.
- Require the user to click or confirm navigation and mutations.
- Exclude HR, payroll, attendance and other removed modules from answers.
- Update existing BillSync/enterprise terminology to Lexora solo/small-firm terminology.

### Document ingestion

- Support PDF, DOCX, TXT and authorised email/note sources for the MVP.
- Scan and validate file type and size before parsing.
- Preserve source document, page and paragraph metadata.
- Normalise text without losing citation offsets.
- Split text into bounded overlapping chunks.
- Generate embeddings through the AI gateway.
- Store ingestion status, parser version and embedding version.
- Re-index safely when a document changes.
- Delete chunks when the source is deleted or AI access is revoked.
- Ensure the entire pipeline is workspace- and matter-scoped.

### Matter retrieval and grounded answers

- Apply mandatory `{ workspaceId, matterId }` filters before retrieval.
- Combine vector similarity with keyword search and metadata filters.
- Retrieve only the minimum evidence needed for the question.
- Include structured matter data only after permission checks.
- Ask the model to answer only from supplied evidence.
- Return an uncertainty/refusal response when evidence is insufficient.
- Attach source document, page/section and excerpt to each citation.
- Allow the lawyer to open the cited source from the answer.
- Distinguish matter facts from AI-generated analysis or draft language.

### Contextual workflow assistance

Implement typed operations such as:

- `suggest_billable_narrative`
- `summarize_matter`
- `build_matter_chronology`
- `extract_parties_and_issues`
- `suggest_tasks`
- `identify_missing_documents`
- `review_work_entry`
- `explain_rate_resolution`
- `draft_invoice_email`
- `draft_payment_reminder`
- `summarize_report`

Each operation must define:

- Allowed input fields
- Required permission
- Maximum context
- Structured output schema
- Human confirmation rule
- Audit event
- Safe fallback

### AI administration and controls

- Workspace AI enable/disable setting
- Matter-level AI exclusion
- Allowed provider/model configuration controlled by the platform
- Usage and cost limits per workspace
- Daily and monthly cost reporting
- User feedback: helpful, incorrect, unsupported or unsafe
- Provider failure and latency monitoring
- Prompt-template and model-version audit metadata

## Sprint 6 acceptance criteria

- Workspace A AI requests cannot retrieve Workspace B documents, chunks, conversations or structured records.
- A user cannot ask AI about a matter they cannot open normally.
- Matter answers contain valid citations or explicitly state that evidence is insufficient.
- Every citation opens the correct authorised source location.
- Documents containing hostile instructions cannot override system or workspace policies.
- AI suggestions do not mutate data until the user confirms them.
- Financial calculations remain deterministic and are never delegated to the model.
- Provider outages do not block normal client, matter, work, invoice or payment operations.
- AI usage, cost, latency, failure and feedback events are measurable.
- The global copilot accurately explains the retained solo/small-firm workflow.
- Saved AI drafts record requester, model/template version and acceptance/edit status.
- Three solo lawyers and one small firm can enter the controlled pilot after the final go/no-go review.

## Sprint 6 verification

- Run cross-workspace AI retrieval and conversation tests.
- Run unauthorised-matter access tests.
- Evaluate a fixed set of matter questions with expected source documents.
- Measure retrieval recall and citation correctness.
- Test insufficient-evidence refusal behavior.
- Test prompt injection embedded in uploaded documents.
- Test document deletion and re-indexing.
- Test provider timeout, rate limit and outage fallback.
- Verify AI-disabled workspace and excluded-matter behavior.
- Compare generated billable narratives and emails before and after lawyer edits.
- Run cost and token-budget limit tests.

## Sprint 6 review demonstration

Upload a multi-document matter, complete ingestion, ask a factual question, open the cited page, create a chronology, draft a client email and save it only after review. Demonstrate that another workspace and an unassigned lawyer cannot retrieve the matter, and that normal Lexora workflows continue while the model provider is unavailable. Finish with the production go/no-go review and controlled-pilot onboarding.

# 8. Cross-sprint release gates

The release candidate must satisfy all gates:

| Gate | Required result | Status |
|---|---|---|
| Workspace isolation | No customer can access another customer’s data | Not verified |
| Authorization | Retained roles pass the permission matrix | Not verified |
| Capture integrity | One source event creates at most one work entry | Not verified |
| Billing integrity | One work item or expense is invoiced at most once | Not verified |
| Financial reconciliation | Invoice, payment and report totals reconcile | Not verified |
| Invoice immutability | Finalised invoices cannot be silently changed | Not verified |
| Dependency security | No unresolved critical/high production findings | Not verified |
| CI/CD | Clean automated pipeline passes | Not verified |
| Recovery | Backup restoration succeeds | Not verified |
| Observability | Errors and critical failures generate alerts | Not verified |
| End-to-end workflow | Solo and five-member workflows pass | Not verified |
| AI isolation | AI retrieval and conversations cannot cross workspace or matter permissions | Not verified |
| RAG grounding | Factual matter answers contain valid citations or refuse for insufficient evidence | Not verified |
| AI action safety | AI cannot send, file, finalise, pay or mutate records without confirmation | Not verified |
| AI resilience | Core workflows remain available during provider failure | Not verified |
| AI evaluation | Leakage, citation and prompt-injection regression suite passes | Not verified |
| Defect threshold | No open P0/P1 defects | Not verified |

# 9. Required end-to-end scenarios

1. A solo lawyer registers, configures the practice and creates the first client and matter.
2. A solo lawyer captures, reviews and invoices work without team approval.
3. An Owner invites a Lawyer and assigns a matter.
4. A Lawyer records work and cannot access unassigned restricted matters.
5. An Owner or Billing Assistant invoices reviewed work.
6. A partial payment updates invoice status, outstanding balance and aging.
7. An Accountant reads reports but cannot mutate financial records.
8. Workspace A cannot access Workspace B using guessed or copied resource IDs.
9. Offline capture retries without duplication.
10. A finalised invoice rejects direct edits and uses a revision process.
11. An excessive payment or write-off is rejected.
12. Data export includes only the authenticated workspace.
13. The app copilot explains the current screen and suggests a valid next action.
14. A lawyer asks a matter question and opens the cited source location.
15. A matter question with insufficient evidence produces an explicit grounded refusal.
16. A hostile instruction inside a matter document cannot change AI policy or execute an action.
17. AI drafts a billable narrative, client email and payment reminder that remain editable drafts.
18. Workspace A cannot retrieve Workspace B content through prompts, conversations or citations.
19. Core work, invoice and payment operations continue when the AI provider is unavailable.

# 10. Pilot plan

## Pilot cohort

- Three independent lawyers.
- One small legal firm with 3–5 users.
- Separate production-like workspaces.
- Realistic or consented client/matter data.
- At least one complete invoice cycle per participant.

## Pilot success measures

- At least 80% of pilot work is captured on the day performed.
- Median Ready-to-Bill-to-Sent-Invoice time is under 10 minutes.
- Every invoice has an accurate outstanding balance.
- No cross-workspace access defect occurs.
- No duplicate billing defect occurs.
- At least three solo lawyers complete the workflow.
- The small firm completes capture, owner review, invoice and payment reporting.
- At least 80% of tested matter answers have correct supporting citations.
- No AI response leaks another workspace or unauthorised matter content.
- At least 60% of pilot AI suggestions are accepted or edited instead of discarded.
- AI provider cost per active workspace remains within the approved pilot budget.
- No P0/P1 defect remains unresolved at pilot completion.

# 11. Risk register

| ID | Risk | Severity | Mitigation | Owner | Status |
|---|---|---|---|---|---|
| R1 | Cross-workspace data access | Critical | Mandatory workspace scope and two-workspace tests | Engineering | Open |
| R2 | Duplicate billable or invoice conversion | Critical | Unique indexes, idempotency and transactions | Engineering | Open |
| R3 | Incorrect GST or money rounding | High | Integer paise and golden fixtures | Engineering | Open |
| R4 | Enterprise scope distracts from commercial MVP | High | Feature-gate excluded modules and freeze scope | Product | Open |
| R5 | Dependency vulnerabilities | High | Controlled upgrades and CI audit gate | Engineering | Open |
| R6 | Solo-developer capacity | High | Vertical slices, sprint buffer and strict change control | Product | Open |
| R7 | Capture extension or desktop instability | Medium | Health state, retry queue and manual fallback | Engineering | Open |
| R8 | Email/PDF provider failure | Medium | Delivery events, retry and download fallback | Engineering | Open |
| R9 | Data loss or failed deployment | Critical | Automated backup, restore drill and rollback | Engineering | Open |
| R10 | Insufficient pilot feedback | Medium | Weekly interviews and measurable workflow events | Product | Open |
| R11 | AI leaks privileged or cross-workspace material | Critical | Mandatory retrieval filters, redaction and adversarial isolation tests | Engineering | Open |
| R12 | Hallucinated legal answer is relied upon | Critical | Grounded prompts, citations, refusals and mandatory lawyer review | Product/Engineering | Open |
| R13 | Prompt injection inside matter documents | High | Treat documents as untrusted data and run injection evaluations | Engineering | Open |
| R14 | AI cost or latency becomes commercially unsustainable | High | Budgets, caching, model routing and usage monitoring | Engineering | Open |
| R15 | AI provider outage blocks normal legal work | High | Provider abstraction, timeouts and non-AI workflow fallback | Engineering | Open |

# 12. Daily implementation record

Update this table at the end of each working day.

| Date | Sprint | Item | Work completed | Verification | Blocker/decision | Hours remaining |
|---|---|---|---|---|---|---:|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

# 13. Sprint review record

| Sprint | Goal achieved? | Demo result | Tests/builds | Open defects | Scope moved | Decision |
|---|---|---|---|---|---|---|
| Sprint 1 |  |  |  |  |  |  |
| Sprint 2 |  |  |  |  |  |  |
| Sprint 3 |  |  |  |  |  |  |
| Sprint 4 |  |  |  |  |  |  |
| Sprint 5 |  |  |  |  |  |  |
| Sprint 6 |  |  |  |  |  |  |

# 14. Production go/no-go record

**Planned decision date:** To be scheduled  
**Release candidate:**  
**Decision:** Pending

Proceed to paying customers only when:

- All cross-sprint release gates pass.
- No P0/P1 defect remains.
- Backup restoration and rollback have succeeded.
- The controlled pilot has completed at least one invoice cycle per workspace.
- Legal, privacy and support documents are published.
- AI isolation, citation, refusal and prompt-injection evaluations pass.
- AI retention, consent, provider usage and lawyer-review disclosures are published.
- The Product Owner and engineering owner record an explicit go decision.

## Final sign-off

| Responsibility | Name | Decision | Date | Notes |
|---|---|---|---|---|
| Product owner |  |  |  |  |
| Engineering owner |  |  |  |  |
| Security review |  |  |  |  |
| AI safety review |  |  |  |  |
| Pilot owner |  |  |  |  |
