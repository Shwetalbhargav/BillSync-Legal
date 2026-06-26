# Dependency Risk Register

## Current Audit Snapshot

Generated with:

```powershell
node scripts/audit-workspace.mjs
```

## Findings

| Workspace | Critical | High | Moderate | Low | Release Position |
| --- | ---: | ---: | ---: | ---: | --- |
| API | 0 | 0 | 0 | 0 | Clear |
| Web | 0 | 0 | 0 | 1 | Accept for pilot; dev-server-only advisory |
| Desktop | 0 | 6 | 0 | 1 | Review before production desktop rollout |
| Extension | 0 | 0 | 0 | 0 | Clear |

## Desktop Advisory Notes

The desktop findings flow through `active-win@9` native build dependencies, including `node-gyp`, `make-fetch-happen`, `cacache`, `@mapbox/node-pre-gyp`, and `tar`. `npm audit` reports a fix path that moves `active-win` to `7.7.2`, which is a semver-major downgrade from the current `9.x` line.

Release decision:

- API, web, and extension can continue through staging validation.
- Desktop production rollout should wait for an explicit compatibility check of the suggested `active-win` downgrade or an upstream patched `active-win` release.
- Until resolved, do not distribute a production desktop installer outside controlled pilot testers.

## Owner

Release engineering owns tracking the advisory. Desktop engineering owns the dependency compatibility decision.
