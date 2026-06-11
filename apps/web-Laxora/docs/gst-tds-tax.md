# GST TDS Tax

Branch: `feat/gst-tds-tax`

## Scope

- GST dashboard with invoice tax summary, firm GST settings, and invoice tax review.
- TDS dashboard with honest not-turned-on state and readiness cards.
- Tax documentation for connected GST resources and missing TDS resources.

## Connected Resources

- `GET /api/firms/:firmId/settings`
- `PATCH /api/firms/:firmId/tax-settings`
- `GET /api/reports/gst-summary`
- `GET /api/reports/gst.csv`
- `GET /api/invoices`
- `GET /api/analytics/invoices`

## UX States

- Loading state while tax details refresh.
- Empty invoice tax state.
- Error state when GST details cannot load.
- Validation state for GST settings.
- Success and warning toasts for GST settings save.
- TDS not-turned-on state.

## Backend Gap

TDS routes are not available yet. The frontend does not claim deduction calculations, certificate tracking, or compliance readiness until those resources exist.
