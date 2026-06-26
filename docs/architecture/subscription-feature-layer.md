# Subscription Feature Layer

Lexora plan decisions are centralized in `subscriptionFeatureService`. Controllers and UI adapters should ask the service for access instead of branching on customer tiers.

## Catalog

Seeded plans:

| Plan | Members | Storage | AI credits | Intended state |
| --- | ---: | ---: | ---: | --- |
| Free | 1 | 1 GB | 0 | Explore core workspace records |
| Solo | 1 | 5 GB | 100 | Solo practice workspace |
| Professional | 5 | 25 GB | 500 | Small legal team |
| Business | 15 | 100 GB | 2,500 | Integrated team operations |
| Enterprise | 100 | 1,000 GB | 25,000 | Sales-led configuration |

Usage concepts are stored on `Plan.limits` and copied into `Subscription.limitsSnapshot`: seats, storage, and AI credits.

## Access Resolution

Use:

- `hasPlanAccess({ workspaceId, featureKey })`
- `hasPlanAccess({ workspaceId, moduleKey })`
- `isFeatureEnabled({ workspaceId, featureKey })`

The service evaluates, in order:

1. Workspace subscription status.
2. Workspace feature override.
3. Plan feature and module mappings.
4. Workspace module status.

Subscription states:

- `active` and `trialing`: full access to included capabilities.
- `past_due`: read-only behavior.
- `canceled` / `cancelled`: read-only behavior.

Feature gate behaviors:

- `hide`: do not show the module or action.
- `disable`: show unavailable state with calm upgrade/setup copy.
- `read_only`: allow review of existing records but block new mutations.

## API Surface

- `GET /api/workspace/plans`
- `GET /api/workspace/features`
- `GET /api/workspace/subscription`
- `GET /api/workspace/features/:featureKey/access`
- `GET /api/workspace/modules/:moduleKey/access`
- `PATCH /api/workspace/features/:featureKey/override`

Only Owners can update workspace feature overrides.

## Compatibility

The legacy signup plan key `small_workspace` is accepted as an alias for `professional`. New code should use `professional`.
