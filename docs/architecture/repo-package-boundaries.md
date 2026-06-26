# Lexora Package Boundaries

This branch starts the incremental move from app-local shared services toward independently testable packages. Runtime behavior stays in the existing API and web apps while pure platform logic is extracted first.

## Current Extracted Logic

- `@lexora/shared`: id/key normalization, array normalization, uniqueness, package boundary metadata.
- `@lexora/subscription`: plan aliases, public plan/feature/subscription mapping, subscription status behavior, plan/feature/module access resolution.
- `@lexora/rbac`: permission key normalization and policy scope evaluation.
- `@lexora/module-registry`: module public shape, dependency validation, module state, and navigation model generation.
- `@lexora/navigation`: navigation-facing re-export of module-registry navigation contracts.

## Package Boundaries

Each package declares Workspace as the tenant boundary and has a package-level test.

- `@lexora/auth`: sessions, cookies, identity.
- `@lexora/workspace`: workspace context, catalog, isolation.
- `@lexora/membership`: members, invitations, workspace switching.
- `@lexora/subscription`: plans, features, subscriptions, overrides.
- `@lexora/rbac`: roles, permissions, policies.
- `@lexora/module-registry`: module manifests, dependencies, state.
- `@lexora/navigation`: sidebar, topbar, route guards.
- `@lexora/billing`: legal billing, platform billing, invoice gates.
- `@lexora/payments`: client payments, platform payments, payment state.
- `@lexora/clients`: client records, search, permissions.
- `@lexora/matters`: matter records, policy scopes, assignments.
- `@lexora/tasks`: task records, assignments, views.
- `@lexora/documents`: document records, storage access, sharing.
- `@lexora/reports`: report catalog, exports, permissions.
- `@lexora/notifications`: preferences, delivery events, digests.
- `@lexora/audit`: audit events, sensitive actions, retention.
- `@lexora/ai`: usage, credits, module adapters.
- `@lexora/integrations`: provider connections, sync logs, webhooks.
- `@lexora/shared`: shared primitives used by all packages.

## Next Extraction Order

1. Move catalog constants into `@lexora/workspace` after seed/migration consumers are covered.
2. Move database-free billing and AI policy helpers into `@lexora/billing` and `@lexora/ai`.
3. Move frontend route/navigation adapters into `@lexora/navigation` once app aliases or workspace linking are installed.
4. Move module-specific pure mappers for clients, matters, documents, and reports after cross-workspace isolation tests cover each module.

## Guardrails

- Keep Mongoose models and Express controllers in the API app until package database boundaries are explicit.
- Keep React screens in the web app unless a component is shared across multiple apps.
- Do not introduce Firm, Company, or Organization as tenant boundaries.
- Prefer package tests for pure logic and app tests for API/database behavior.
