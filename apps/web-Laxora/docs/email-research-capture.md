# Email Research Capture

Branch: `feat/email-research-capture`

## Implemented Screens

- Gmail Capture Review: `/app/gmail-review`
- Research Capture Review: `/app/research-review`

## Service Contract

`src/api/capture.js` composes:

- Captured Gmail items from `GET /api/email-entries?source=gmail`.
- Captured research items from `GET /api/email-entries?source=research`.
- Client and matter options for mapping.
- Mapping through `POST /api/email-entries/:id/map`.
- Narrative drafting through `POST /api/email-entries/:id/gpt-narrative`.
- Conversion through `POST /api/email-entries/:id/time-entry`.

## UX States

- Loading while captured items load.
- Empty states for Gmail and research queues.
- Error/retry state when captured work cannot be loaded.
- Validation when client or matter is missing.
- Converted state through backend status after conversion succeeds.

## Known Gaps

- Bulk captured work review is not available yet.
