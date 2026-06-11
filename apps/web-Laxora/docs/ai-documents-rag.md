# AI Documents And Matter Q&A

## Scope

This branch adds document-focused assistant screens:

- Document summary
- Document creation
- Matter document Q&A shell

## Connected Resources

- `GET /api/ai/matter-documents?caseId=:caseId`
- `POST /api/ai/matter-documents`
- `POST /api/ai/matter-chat`
- `POST /api/ai/generate-document`
- `GET /api/cases`

## UX States

- Loading while matters and source notes refresh
- Empty source-note state
- Indexing-required state before Q&A
- Validation for missing matter, source text, instructions, or question
- Editable summary, draft, and answer outputs
- Citation list when returned
- Calm failure guidance

## Known Gaps

Matter Q&A currently uses saved source notes only. Background indexing status, uploaded-file ingestion, streamed document chat, and persistent conversation history still need backend support.
