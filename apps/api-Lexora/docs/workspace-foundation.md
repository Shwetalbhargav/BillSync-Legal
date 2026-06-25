# Workspace Foundation

This branch adds the database foundation for Lexora's Workspace-first multi-tenant platform. It does not remove legacy Firm fields or rewrite public APIs yet.

## Canonical Collections

| Collection | Purpose |
| --- | --- |
| `workspaces` | Canonical tenant boundary. Existing Firm-owned data is represented as a Workspace with the same `_id` where possible. |
| `memberships` | User membership in a Workspace, with a product role and optional direct permissions. |
| `subscriptions` | Active Workspace plan assignment and snapshots of limits, features, and modules. |
| `plans` | Plan catalog such as Solo and Small Workspace. |
| `features` | Feature catalog used by plans and modules. |
| `permissions` | Permission catalog using product resources and actions. |
| `roles` | Role catalog mapping product roles to permission keys. |
| `policies` | Workspace-scoped allow/deny overrides for role-permission behavior. |
| `moduleregistries` | Product module catalog and route/module metadata. |
| `workspacemodules` | Workspace-scoped module enablement state. |

## Backfill Rules

The migration keeps rollback safe by preserving legacy fields.

- Existing `firms` are copied into `workspaces`.
- `workspaces._id` is set to the legacy Firm `_id` where possible because existing `workspaceId` values already point there.
- Existing `firmId` fields are copied to `workspaceId`.
- Child records derive `workspaceId` from their parent Client, Matter, Invoice, Work Session, or User when needed.
- Existing `workspaceId` values without a matching Firm create a placeholder Workspace so validation does not leave orphaned tenant data.
- Legacy columns are not removed.

## Validation

Run:

```powershell
npm.cmd run validate:workspace-foundation
```

The validation fails if:

- Required foundation collections are missing.
- Any known tenant-owned collection has records without `workspaceId`.
- Any `workspaceId` points to a missing Workspace.
- Core platform catalog collections are empty.

## Migration

Run:

```powershell
npm.cmd run migrate
npm.cmd run migrate:down
```

`migrate:down` rolls back the most recently applied migration if it exposes a `down` function. The Workspace foundation rollback drops only the new foundation collections and intentionally preserves backfilled `workspaceId` fields for safety.

## Seed

Run:

```powershell
npm.cmd run seed:workspace-foundation
```

This seeds Plans, Features, Permissions, Roles, and Module registry records, then runs validation.

## Known Compatibility Notes

- Existing `/api/firms` routes remain as compatibility APIs until later branches introduce Workspace settings APIs.
- Existing auth still accepts legacy role plus Firm identity.
- Static Partner/Lawyer/Associate/Intern profile routes remain until the member profile migration.
- Plan and module checks are seeded in data, but existing API and frontend guards are not yet wired to them.
