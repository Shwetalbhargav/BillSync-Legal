# Chrome Extension Setup Status

Branch: `feat/chrome-extension-setup-status`

## Implemented Screens

- Extension setup: `/app/extension/setup`
- Extension status: `/app/extension/status`
- Extension troubleshooting: `/app/extension/troubleshooting`

## Service Contract

`src/api/extension.js` uses available resources:

- Workspace connection check through `POST /api/auth/extension-token`.
- Recent captured work through `GET /api/email-entries?source=extension`.
- Recent Gmail captures through `GET /api/email-entries?source=gmail`.

## UX States

- Setup checklist for loading the unpacked Chrome extension folder.
- Connection check loading and success states.
- Recent captured work empty state.
- Troubleshooting guidance for missing icon, disconnected status, missing capture, and blocked folder.
- Honest not-connected language until dedicated extension health exists.

## Known Gaps

- Dedicated extension health route is not available yet.
- Browser handshake test-event route is not available yet.
