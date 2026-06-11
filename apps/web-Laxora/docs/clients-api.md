# Clients API Branch

Branch: `feat/clients-api`

## Scope

- Client list with search and empty/retry states.
- Create and edit client form using backend-supported fields.
- Client detail overview with related matters and financial summary.
- Contacts view that renders existing saved contacts.
- Billing summary with invoices and payments.

## Routes

- `/app/clients`
- `/app/clients/new`
- `/app/clients/:clientId`
- `/app/clients/:clientId/edit`
- `/app/clients/:clientId/contacts`
- `/app/clients/:clientId/billing`

## Connected Services

- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:clientId`
- `PUT /api/clients/:clientId`
- `GET /api/clients/:clientId/cases`
- `GET /api/clients/:clientId/invoices`
- `GET /api/clients/:clientId/payments`
- `GET /api/clients/:clientId/summary`

## Backend Gaps

- Client contacts exist on the model, but the current client write validation does not allow contact updates.
- No dedicated client-contact create, update, or remove route exists yet.
- Delete is available, but a delete screen was not added in this branch because related-record blocking needs a careful confirmation flow.
