# Payments Portal Reconciliation

Branch: `feat/payments-portal-reconciliation`

## Scope

- Payment dashboard for receipt recording, recent payments, payment-page creation, and receivables visibility.
- Payment reconciliation queue for pending and failed receipts.
- Receivables aging page for firm follow-up.
- Public client payment page for invoice payment-detail submission.

## Connected Resources

- `GET /api/payments`
- `POST /api/payments`
- `POST /api/payments/:id/reconcile`
- `POST /api/payments/portal-link/:invoiceId`
- `GET /api/payments/portal/:paymentCode`
- `POST /api/payments/portal/:paymentCode/pay`
- `GET /api/payments/finance-summary`
- `GET /api/ar/aging`
- `GET /api/ar/aging/by-client`
- `GET /api/invoices`

## UX States

- Loading state while payment and receivable records refresh.
- Empty state when no payments are recorded.
- Calm error state when records cannot be loaded.
- Validation state when invoice, amount, or received date is missing.
- Success toast after payment save, reconciliation, or payment-page creation.
- Payment failed state for receipts requiring follow-up.
- Not-connected state for online collection.

## Backend Gap

The current client payment page records client-submitted payment details. It does not collect funds through a live gateway. The UI names that honestly and keeps reconciliation manual until gateway-session and webhook routes are added.
