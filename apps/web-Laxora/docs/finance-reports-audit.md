# Finance Reports Audit

Branch: `feat/finance-reports-audit`

## Scope

- Finance dashboard for revenue, work in progress, receivables, utilization, realization, and recent finance activity.
- Reports page with date filters and downloadable time, invoice, tax, and utilization reports.
- Audit logs page using available integration event resources.
- KPI snapshots page for saved monthly finance review records.

## Connected Resources

- `GET /api/kpi/summary`
- `GET /api/kpi/trend`
- `GET /api/kpi-snapshots`
- `GET /api/revenue/breakdown`
- `GET /api/revenue/monthly`
- `GET /api/analytics/billables`
- `GET /api/analytics/invoices`
- `GET /api/analytics/unbilled-by-client`
- `GET /api/payments/finance-summary`
- `GET /api/payments`
- `GET /api/invoices`
- `GET /api/ar/aging`
- `GET /api/reports/gst-summary`
- `GET /api/reports/time-entries.csv`
- `GET /api/reports/invoices.csv`
- `GET /api/reports/gst.csv`
- `GET /api/reports/utilization.csv`
- `GET /api/integration-logs`
- `GET /api/integration-logs/stats`

## UX States

- Loading state for all finance workspaces.
- Empty states for revenue lists, work in progress, saved snapshots, and audit events.
- Partial-refresh warnings when one finance source is unavailable.
- Error states when the page cannot load.
- Success and warning toasts for report downloads.
- Honest not-ready state for PDF board pack export.

## Backend Gap

The PDF report route exists but does not generate a document yet. The frontend keeps spreadsheet-style downloads active and marks the board pack as not ready until PDF generation is implemented.
