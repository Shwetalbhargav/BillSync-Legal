# Dependency Risk Register

The CI pipeline runs `node scripts/audit-workspace.mjs` on every pull request and writes JSON reports to `audit-reports/`.

## Pilot Gate
- No unactioned critical advisory can be accepted for pilot.
- High advisories require owner sign-off, a compensating control, and a scheduled remediation issue.
- Runtime dependencies take priority over build-only dependencies.

## Current Known Risks

### API
- `axios`, `mongoose`, `nodemailer`, `path-to-regexp`, `undici` and related transitive packages are reported by `npm audit` on the current lockfile.
- Compensating controls: outbound HTTP use is server-side only, request payload limits are enabled, NoSQL filter sanitisation is enabled, and production mock payment completion is disabled.
- Remediation target: update direct dependencies and rerun the full API, workspace-isolation, and financial-invariant suites before staging approval.

### Desktop Agent
- `active-win` pulls vulnerable native build tooling in the current dependency path; npm's suggested fix is a breaking downgrade and must be tested against Windows capture behavior.
- `concurrently` reports a shell quoting advisory in the development script path.
- Compensating controls: desktop builds are produced in CI from lockfile, the development script is not shipped to end users, and pilot capture requires explicit user consent.
- Remediation target: replace or update the active-window capture dependency and development runner before production general availability.
