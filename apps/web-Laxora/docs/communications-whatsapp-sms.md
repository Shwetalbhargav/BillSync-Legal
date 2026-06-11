# Communications WhatsApp SMS

## Scope

- WhatsApp inbox and setup status.
- SMS center and setup status.
- Communication logs.
- Provider-not-connected states for planned messaging work.

## Implementation Notes

- Routes render under `/app/communications`, `/app/communications/whatsapp`, `/app/communications/sms`, and `/app/communications/logs`.
- The frontend uses `communicationsWorkspaceApi` to collect provider readiness from gap adapters.
- Compose controls are disabled until provider routes exist.
- Template rows are planning examples only and do not claim approval or delivery.

## Backend Gaps

- `GET /api/communications/whatsapp/status`
- `POST /api/communications/whatsapp/send`
- `GET /api/communications/sms/status`
- `POST /api/communications/sms/send`
- `GET /api/communications/logs`

## Tester Notes

- Verify that communication pages render provider setup states.
- Verify that no send action shows success while providers are not connected.
- Verify that logs render an empty state.
