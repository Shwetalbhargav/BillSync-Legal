# AI Assistant Core

## Scope

This branch adds the core protected assistant experience:

- AI assistant
- AI email writer
- AI research assistant for pasted text and working notes

## Connected Resources

- `POST /api/ai/generate-email`
- `POST /api/ai/assist`
- `POST /api/ai/email-to-billable`
- `GET /api/ai/matter-documents`
- `POST /api/ai/matter-documents`
- `POST /api/ai/matter-chat`
- `POST /api/ai/generate-document`

## UX States

- Empty state before a request
- Validation when the request is blank
- Loading while a draft is prepared
- Taking-longer state for delayed responses
- Failure state with calm retry guidance
- Editable output state
- Source-backed research not connected state

## Known Gaps

The assistant can draft email and analyze pasted text today. Streaming chat, source-backed legal research citations, and persistent assistant conversation history need future resources.
