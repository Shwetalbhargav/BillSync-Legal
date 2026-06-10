# BillSync Legal Frontend Project Structure

This folder is intentionally planning-only right now. Build the frontend branch by branch from a clean base, using:

- UI designs: `docs/stitch_billsync_legal_platform_ui`
- Backend: `apps/api-Lexora`
- Frontend branch tracker: `docs/architecture/BillSync_Frontend_Branch_Tracker.xlsx`
- Hackathon rules: `hackathon rules.txt`

## Answer: Are The Planned Modules Enough?

Almost, but the frontend plan needs four explicit additions before implementation starts.

1. RBAC must be a foundation module.
   - Backend supports five user types: `admin`, `partner`, `lawyer`, `associate`, and `intern`.
   - Frontend needs route permissions, sidebar filtering, action guards, permission-denied screens, and role-specific dashboards.

2. Global AI Assistant must be cross-product.
   - The assistant should live in the app shell and guide users anywhere in the product.
   - It must coach extension setup, work meter usage, matter summaries, billable review, and billing workflows.
   - It should have animated states: thinking, streaming, guided checklist progress, setup coaching, work-meter coaching, and retry.

3. RAG chat needs its own frontend boundary.
   - Keep RAG, Gemini calls, assistant chat, citations, and evidence logging separated from normal UI pages.
   - The assistant must be useful for testers and also generate hackathon evidence that Gemini is used in a real workflow.

4. Frontend API modules must match the backend router.
   - Add modules for document storage, case assignments, invoice lines, integration logs, Zoho auth/sync, KPI snapshots, AR, revenue, admin, and all profile types.

## Hackathon Direction

- Category fit: Professional Services, Small Business Services, Entrepreneurship & Job Creation.
- Gemini requirement: at least one real deployed workflow must call Gemini.
- Google Cloud requirement: at least one production component must run on Google Cloud, with evidence.
- Tester requirement: lawyers and law firm operators should be able to test without technical help.
- Evidence requirement: keep screenshots, product logs, Gemini usage records, Google Cloud proof, tester feedback, costs, revenue, and user evidence.
- New-project requirement: document any boilerplate/framework use and show what was newly built during the hackathon period.

## Git Branch Pipeline

1. `feat/frontend-bootstrap`
   - Vite React + Tailwind app, route map, public/protected layouts, sidebar/topbar, mobile nav, and placeholders.

2. `feat/design-system`
   - Buttons, forms, cards, badges, tables, tabs, dialogs, drawers, toasts, skeletons, fallback states, progress states.

3. `feat/api-client-contracts`
   - API client, service modules, normalizers, friendly errors, pagination helpers, upload helpers, and backend-gap docs.

4. `feat/rbac-route-permissions`
   - Five-role permission model, role-aware routing, action guards, navigation filtering, and tester role switcher for demos.

5. `feat/auth-users-permissions`
   - Login, register/invite, session refresh, logout, current user, profile, role-aware redirects.

6. `feat/fallback-state-system`
   - Loading, empty, error, offline, retry, unavailable, session-expired, permission-denied, and save-failed states.

7. `feat/global-dashboard-common`
   - Lawyer/admin/partner dashboards, global search, notification center, help center, and setup status.

8. `feat/global-rag-ai-assistant`
   - App-wide animated assistant, Gemini/RAG service boundary, extension setup coach, work meter coach, citations, evidence logging.

9. `feat/clients-api`
   - Client list, create/edit, detail, contacts, billing summary.

10. `feat/matters-core-api`
    - Matter list, create/edit, detail, assignments, team, empty states. Use backend `cases` while UI says `matters`.

11. `feat/matter-timeline-docs-billing-audit`
    - Timeline, documents, billing, payments, audit, integration events.

12. `feat/tasks-daily-work`
    - My Tasks, task board, task detail, task create/edit, My Work Today.

13. `feat/work-meter-time-capture`
    - Work meter, work sessions, manual time entry, captured work review, submit-for-approval, offline save recovery.

14. `feat/chrome-extension-setup-status`
    - Guided setup, extension status, troubleshooting, test event states, assistant-guided setup.

15. `feat/billing-finance-reports`
    - Billables, rates, invoices, invoice lines, payments, AR, revenue, KPI, reports, GST/TDS, reconciliation.

16. `feat/admin-profiles-operations`
    - Admin dashboard, user management, partner/lawyer/associate/intern profile screens, firm audit logs, security access.

17. `feat/testing-evidence-submission`
    - Tester polish, screenshots, production logs, Gemini evidence, Google Cloud evidence, submission checklist.

## Target Folder Structure

```text
frontend/
|-- public/
|   |-- favicon.svg
|   |-- billsync-logo.png
|   `-- screenshots/
|
|-- src/
|   |-- api/
|   |   |-- client.js
|   |   |-- auth.js
|   |   |-- admin.js
|   |   |-- users.js
|   |   |-- profiles.js
|   |   |-- firms.js
|   |   |-- clients.js
|   |   |-- matters.js
|   |   |-- caseAssignments.js
|   |   |-- tasks.js
|   |   |-- activities.js
|   |   |-- workSessions.js
|   |   |-- timeEntries.js
|   |   |-- emailEntries.js
|   |   |-- capturedWork.js
|   |   |-- billables.js
|   |   |-- rates.js
|   |   |-- invoices.js
|   |   |-- invoiceLines.js
|   |   |-- payments.js
|   |   |-- accountsReceivable.js
|   |   |-- reports.js
|   |   |-- analytics.js
|   |   |-- kpi.js
|   |   |-- revenue.js
|   |   |-- documentStorage.js
|   |   |-- integrations.js
|   |   |-- zoho.js
|   |   |-- assistant.js
|   |   |-- rag.js
|   |   |-- gemini.js
|   |   |-- health.js
|   |   `-- normalizers.js
|   |
|   |-- assets/
|   |   |-- images/
|   |   |-- icons/
|   |   `-- brand/
|   |
|   |-- components/
|   |   |-- layout/
|   |   |   |-- AppShell.jsx
|   |   |   |-- AuthLayout.jsx
|   |   |   |-- Header.jsx
|   |   |   |-- Sidebar.jsx
|   |   |   |-- BottomNav.jsx
|   |   |   |-- PageContainer.jsx
|   |   |   `-- ProtectedRoute.jsx
|   |   |
|   |   |-- common/
|   |   |   |-- Button.jsx
|   |   |   |-- Card.jsx
|   |   |   |-- Dialog.jsx
|   |   |   |-- Drawer.jsx
|   |   |   |-- EmptyState.jsx
|   |   |   |-- ErrorAlert.jsx
|   |   |   |-- HealthBadge.jsx
|   |   |   |-- LoadingSpinner.jsx
|   |   |   |-- Skeleton.jsx
|   |   |   |-- StatusBadge.jsx
|   |   |   |-- Tabs.jsx
|   |   |   |-- Toast.jsx
|   |   |   `-- UnavailableValue.jsx
|   |   |
|   |   |-- forms/
|   |   |   |-- Field.jsx
|   |   |   |-- SelectField.jsx
|   |   |   |-- SearchInput.jsx
|   |   |   |-- DateField.jsx
|   |   |   `-- MoneyField.jsx
|   |   |
|   |   |-- rbac/
|   |   |   |-- RoleGate.jsx
|   |   |   |-- PermissionGate.jsx
|   |   |   |-- RoleSwitcherForTesting.jsx
|   |   |   `-- PermissionExplainer.jsx
|   |   |
|   |   |-- dashboard/
|   |   |   |-- DailySummary.jsx
|   |   |   |-- RoleDashboard.jsx
|   |   |   |-- SetupProgress.jsx
|   |   |   |-- TodayTasks.jsx
|   |   |   |-- RecentMatters.jsx
|   |   |   `-- WorkMeterCard.jsx
|   |   |
|   |   |-- assistant/
|   |   |   |-- GlobalAssistantButton.jsx
|   |   |   |-- AssistantDrawer.jsx
|   |   |   |-- AssistantPanel.jsx
|   |   |   |-- AssistantInput.jsx
|   |   |   |-- AssistantMessage.jsx
|   |   |   |-- SuggestedActions.jsx
|   |   |   |-- GuidedSetupCoach.jsx
|   |   |   |-- WorkMeterCoach.jsx
|   |   |   |-- RagCitationList.jsx
|   |   |   |-- GeminiEvidenceLog.jsx
|   |   |   `-- StreamingIndicator.jsx
|   |   |
|   |   |-- matters/
|   |   |   |-- MatterCard.jsx
|   |   |   |-- MatterFilters.jsx
|   |   |   |-- MatterForm.jsx
|   |   |   |-- MatterHeader.jsx
|   |   |   |-- MatterTimeline.jsx
|   |   |   |-- MatterDocuments.jsx
|   |   |   |-- MatterBillingSummary.jsx
|   |   |   `-- MatterTeam.jsx
|   |   |
|   |   |-- tasks/
|   |   |   |-- TaskCard.jsx
|   |   |   |-- TaskBoard.jsx
|   |   |   |-- TaskForm.jsx
|   |   |   `-- TaskStatusMenu.jsx
|   |   |
|   |   |-- work/
|   |   |   |-- WorkMeter.jsx
|   |   |   |-- TimerDisplay.jsx
|   |   |   |-- ManualTimeEntryForm.jsx
|   |   |   |-- CapturedWorkList.jsx
|   |   |   `-- SubmitForApprovalPanel.jsx
|   |   |
|   |   |-- billing/
|   |   |   |-- BillableTable.jsx
|   |   |   |-- RateCardTable.jsx
|   |   |   |-- InvoiceBuilder.jsx
|   |   |   |-- InvoicePreview.jsx
|   |   |   |-- PaymentStatus.jsx
|   |   |   `-- ReconciliationPanel.jsx
|   |   |
|   |   |-- extension/
|   |   |   |-- ExtensionSetupSteps.jsx
|   |   |   |-- ExtensionHealthCard.jsx
|   |   |   `-- TroubleshootingChecklist.jsx
|   |   |
|   |   `-- evidence/
|   |       |-- UsageEvidenceCard.jsx
|   |       |-- TesterFeedbackForm.jsx
|   |       `-- SubmissionChecklist.jsx
|   |
|   |-- hooks/
|   |   |-- useAuth.js
|   |   |-- useCurrentUser.js
|   |   |-- useRolePermissions.js
|   |   |-- useHealth.js
|   |   |-- useLocalDraft.js
|   |   |-- useMatters.js
|   |   |-- useTasks.js
|   |   |-- useWorkMeter.js
|   |   |-- useBillables.js
|   |   |-- useGlobalAssistant.js
|   |   |-- useRagChat.js
|   |   |-- useGeminiAssistant.js
|   |   `-- useOfflineQueue.js
|   |
|   |-- pages/
|   |   |-- auth/
|   |   |-- dashboard/
|   |   |-- clients/
|   |   |-- matters/
|   |   |-- tasks/
|   |   |-- work/
|   |   |-- billing/
|   |   |-- assistant/
|   |   |-- extension/
|   |   |-- finance/
|   |   |-- admin/
|   |   |-- settings/
|   |   |-- support/
|   |   `-- fallback/
|   |
|   |-- routes/
|   |   |-- AppRoutes.jsx
|   |   |-- routeConfig.js
|   |   `-- permissions.js
|   |
|   |-- utils/
|   |   |-- dates.js
|   |   |-- formatters.js
|   |   |-- money.js
|   |   |-- status.js
|   |   |-- validators.js
|   |   `-- friendlyErrors.js
|   |
|   |-- constants/
|   |   |-- api.js
|   |   |-- roles.js
|   |   |-- statuses.js
|   |   |-- permissions.js
|   |   |-- navigation.js
|   |   `-- assistantPrompts.js
|   |
|   |-- mocks/
|   |   |-- demoUser.js
|   |   |-- demoMatters.js
|   |   |-- demoTasks.js
|   |   |-- demoBillables.js
|   |   |-- demoInvoices.js
|   |   `-- demoAiResponses.js
|   |
|   |-- styles/
|   |   |-- tokens.css
|   |   |-- theme.css
|   |   `-- utilities.css
|   |
|   |-- App.jsx
|   |-- main.jsx
|   `-- index.css
|
|-- docs/
|   |-- screenshots/
|   |-- api-mapping.md
|   |-- backend-gaps.md
|   |-- rbac-matrix.md
|   |-- tester-guide.md
|   |-- google-cloud-evidence.md
|   |-- gemini-usage-evidence.md
|   `-- submission-checklist.md
|
|-- .env.example
|-- index.html
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
|-- vite.config.js
|-- vercel.json
`-- README.md
```

## Backend API Alignment

Current backend router mounts these frontend-facing resource areas:

- Activities: `/api/activities`
- Analytics: `/api/analytics`
- AR: `/api/ar`
- Billables: `/api/billables`
- Case assignments: `/api/case-assignments`
- Matters/Cases: `/api/cases`
- Clients: `/api/clients`
- Document storage: `/api/document-storage`
- Email entries: `/api/email-entries`
- Firms: `/api/firms`
- Integration logs: `/api/integration-logs`
- Invoices: `/api/invoices`
- Invoice lines: `/api/invoices/:invoiceId/lines`
- KPI snapshots: `/api/kpi-snapshots`
- KPI: `/api/kpi`
- Payments: `/api/payments`
- Rate cards: `/api/rate-cards`
- Reports: `/api/reports`
- Tasks: `/api/tasks`
- Revenue: `/api/revenue`
- Time entries: `/api/time-entries`
- Work sessions: `/api/work-sessions`
- Users: `/api/users`
- Auth: `/api/auth`
- Admin: `/api/admin`
- AI: `/api/ai`
- Partner profiles: `/api/partner-profiles`
- Lawyer profiles: `/api/lawyer-profiles`
- Intern profiles: `/api/intern-profiles`
- Associate profiles: `/api/associate-profiles`
- Zoho auth: `/api/integrations/zoho`
- Zoho sync: `/api/integrations/zoho-sync`

Frontend wording rule: UI should say `Matters`, but the API client can use `cases` internally.

## RBAC Matrix Starter

```text
Role       Dashboard   Matters   Tasks   Billing   Finance   Admin   Settings
admin      all         all       all     all       all       all     all
partner    firm        all       team    approve   reports   no      firm
lawyer     own/team    assigned  own     submit    own       no      own
associate  own/team    assigned  own     submit    own       no      own
intern     own         assigned  own     limited   no        no      own
```

This matrix should become `src/constants/permissions.js` and `docs/rbac-matrix.md` during `feat/rbac-route-permissions`.

## Global AI Assistant Scope

The assistant is not only a chat page. It should be an app-shell assistant with these modes:

- Setup guide: explains extension setup and checks progress.
- Work meter guide: helps start, pause, stop, save, and recover work sessions.
- Matter guide: summarizes timeline, documents, tasks, and billing state.
- Billing guide: explains billables, invoice readiness, missing information, and approvals.
- Help guide: answers product questions using RAG over guides and internal docs.
- Evidence mode: records Gemini usage proof for hackathon submission.

Frontend files for this:

- `src/api/assistant.js`
- `src/api/rag.js`
- `src/api/gemini.js`
- `src/components/assistant/*`
- `src/hooks/useGlobalAssistant.js`
- `src/hooks/useRagChat.js`
- `src/pages/assistant/*`
- `docs/gemini-usage-evidence.md`

## Design Rules For Implementation

- Use BillSync palette: background `#F8F5EF`, panels `#FFFFFF`, navigation `#0B1F3A`, primary `#123B63`, accent gold `#C9A227`, text `#1F2933`, muted `#6B7280`, border `#E5E7EB`, success `#15803D`, warning `#D97706`, error `#B91C1C`.
- Keep cards at `8px` radius or less.
- Build actual app screens first, not a marketing landing page.
- Use responsive layouts from the first branch: desktop, tablet, and 360px mobile.
- Never show raw technical words to lawyers or testers: avoid `API`, `backend`, `payload`, `token`, `401`, `CORS`, `endpoint`, `database`, `stack trace`, and `server exception` in user-facing copy.
- Every data screen needs loading, empty, error, retry, offline, and permission states.
- Use honest not-configured states when backend routes are missing.

## First Branch Acceptance Criteria

For `feat/frontend-bootstrap`, do only this:

- Create the frontend app scaffold.
- Add route config for all planned screens.
- Add public and protected layout shells.
- Add placeholder pages for all planned routes.
- Add sidebar and mobile bottom navigation.
- Add role-aware navigation placeholders.
- Add global assistant placeholder in the app shell.
- Add docs for API mapping, backend gaps, and RBAC matrix.
- Run build successfully.
- Capture at least one desktop and one mobile screenshot.

Do not build feature screens before this branch is complete and committed.
