# Invoices API Branch

Branch: `feat/invoices-api`

## Implemented Screens

- `/app/invoices` - invoice list, filters, pipeline totals, and pending-by-client summary.
- `/app/invoices/new` - invoice builder from approved time or approved billables.
- `/app/invoices/:invoiceId` - invoice detail, line review, send form, PDF link, void action, and activity history.
- `/app/invoices/:invoiceId/lines` - invoice line add/remove workflow.

## Data Approach

The branch uses real invoice resources already present in the backend:

- `GET /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/invoices/from-time`
- `POST /api/invoices/from-billables`
- `GET /api/invoices/__pipeline`
- `GET /api/invoices/__analytics/pending-by-client`
- `GET /api/invoices/:id/pdf`
- `GET /api/invoices/:id/document`
- `POST /api/invoices/:id/send`
- `POST /api/invoices/:id/void`
- `GET /api/invoices/:invoiceId/lines`
- `POST /api/invoices/:invoiceId/lines`
- `DELETE /api/invoices/:invoiceId/lines/:lineId`
- `GET /api/integration-logs/by-invoice/:invoiceId`
- `GET /api/clients`
- `GET /api/cases`
- `GET /api/time-entries?status=approved`
- `GET /api/billables?status=approved`

## UX States Covered

- Loading while invoices and builder resources refresh.
- Empty invoice list, invoice lines, invoice activity, and approved-work source lists.
- Error state with retry copy.
- Builder validation for client and selected approved work.
- Generation failure guidance when selected work is not ready.
- Delivery-needs-attention state if sending does not confirm.
- Template shell and share-link not-configured states without pretending those workflows are active.

## Backend Gaps And Notes

- Invoice templates are not available yet: planned `GET /api/invoice-templates`.
- Secure client share links are not available yet: planned `POST /api/invoices/:id/share-link`.
- From-billables generation is admin-only in the backend; the builder explains this for non-admin users.
- PDF and document preview routes exist, but the UI does not claim a PDF was delivered unless the send route confirms delivery.
