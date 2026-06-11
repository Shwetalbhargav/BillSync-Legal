# Matter Timeline Documents Billing Audit

Branch: `feat/matter-timeline-docs-billing-audit`

## Implemented Screens

- Matter timeline: `/app/matters/:matterId/timeline`
- Matter documents: `/app/matters/:matterId/documents`
- Matter billing: `/app/matters/:matterId/billing`
- Matter history: `/app/matters/:matterId/audit`

## Service Contract

`src/api/matterTabs.js` composes existing backend resources into screen-specific models:

- Timeline uses matter detail, activities, time entries, and assignment timeline.
- Documents uses matter detail and document storage filtered by matter.
- Billing uses matter detail, rollup totals, billables, invoices, payments, and time entries.
- History uses matter detail, integration logs, documents, and activities.

## UX States

- Full-page loading while the matter record loads.
- Retry state when the matter itself cannot be loaded.
- Empty states for no timeline events, no documents, no billing rows, and no history.
- Partial-refresh warnings when one supporting section cannot be refreshed while the matter still loads.

## Known Gaps

- A single matter-wide history feed is not available yet.
- Document download/open links are not available yet.
