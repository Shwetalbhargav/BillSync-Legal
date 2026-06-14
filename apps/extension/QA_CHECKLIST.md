# BillSync Legal Billables Capture QA Checklist

Date baseline: `May 22, 2026`

## Release package

- Run `npm run release:check` and confirm extension tests pass.
- Run `npm run package` and confirm `dist/billsync-capture-<version>.zip` is created.
- Confirm the ZIP contains no tests, logs, local storage dumps, or source-control metadata.
- Confirm `manifest.json` version matches the release tag/checklist.
- Confirm production backend defaults to `https://billsync-legal.onrender.com`.

## Install and settings

- Run `npm test` in `legal-billables-extension` and confirm capture-core and Gmail-adapter fixture tests pass.
- Load the unpacked extension from `legal-billables-extension`.
- Open extension options from `chrome://extensions` and confirm the settings page opens as a `chrome-extension://` page.
- Save a valid `userEmail` and confirm the success message appears.
- Save a valid `backendBaseUrl` and confirm the success message appears.
- Save a valid `frontendAppUrl` and confirm the success message appears.
- Click `Open Backend Login`, sign in to the backend app, then return and click `Check Session`.
- Confirm `Check Session` links the extension and fills `userEmail` from the backend user.
- Confirm authenticated requests work without a manually pasted bearer token.
- Save an optional fallback bearer token only for development/support verification.
- Reset backend and confirm it returns to default behavior.
- Toggle research capture, auto-convert, and AI drafting flags and confirm the matching UI/actions are enabled or disabled.

## Gmail DOM resilience

- Confirm `gmailAdapter.js` is loaded before `content.js` in the manifest.
- Open Gmail and confirm compose detection works after opening compose before and after page load.
- Open/close multiple compose windows and confirm the timer badge follows the correct compose window.
- Temporarily break the compose-body selector in `gmailAdapter.js` during local QA and confirm Gmail shows `Capture unavailable`.
- Confirm Gmail UI changes after navigation are picked up without reloading the extension.

## Timer behavior

- Open one Gmail compose window and type for `10s`.
- Confirm the floating timer appears and increments in `MM:SS`.
- Stop typing for more than `5s` and confirm the timer pauses.
- Resume typing and confirm the timer continues from the prior value.
- Open a second compose window and confirm timing follows the active compose session.
- Reload Gmail mid-compose and confirm persisted timer state is recovered or safely reset with no duplicate capture.

## Send logging

- Send an email after about `10s` of typing and confirm logged time is about `0.10 min`.
- Send an email after `2m 59s` of typing and confirm logged time is `2.59 min`.
- Send using click and confirm only one log is created.
- Send using `Ctrl+Enter` or `Cmd+Enter` and confirm only one log is created.
- Repeat a backend retry for the same captured send and confirm the same `sourceRef` is returned idempotently.
- Trigger a failed or cancelled send and confirm the extension does not show a success log popup.
- Confirm every capture payload includes `source`, `sourceRef`, `messageId`, `threadId`, `url`, `domain`, `schemaVersion`, and extension version metadata.

## Offline and retry safety

- Stop the backend or disconnect the network, send a test email, and confirm the capture is queued locally.
- Confirm queued items show as `pending`, `syncing`, `synced`, or `failed` in the Gmail sync status badge.
- Restore backend/network connectivity and confirm retry syncs the queued item without duplicating it.
- Click the sync status badge and confirm failed items show a reason category such as auth, offline, timeout, validation, or server.
- Confirm retry exhaustion leaves the item available for manual retry instead of deleting it.

## Privacy and identity

- Confirm the extension sends recipient, subject, user email, and time metadata only.
- Confirm the extension does not send email body text from the compose window.
- Clear `userEmail` from settings, stay signed into Gmail, and confirm identity resolves from the Gmail account.
- Clear `userEmail` and test in a context where Gmail identity cannot be resolved; confirm the extension shows an identity error and does not log time.

## AI drafting

- Click `Write with AI` and generate a draft.
- Confirm generated content is inserted into Gmail compose.
- Use `Insert & Send` and confirm the draft is inserted and the send flow continues.
- Confirm AI errors show a visible message instead of failing silently.
- Disable the AI drafting feature flag and confirm the Gmail AI button does not appear.

## Mapping flow

- Send an email and confirm the mapping popup appears after a successful log.
- Confirm client and matter dropdowns load from the backend.
- Select a client and confirm matters filter to that client.
- Select a matter and confirm the client field follows the matter.
- Save mapping and confirm the email entry becomes `converted` with Activity, TimeEntry, and Billable IDs.
- Try saving without either dropdown and confirm the popup shows a validation message.
- Disable auto-convert and confirm mapped captures stay `mapped` until converted later.

## Research capture

- Open a non-Gmail research page and select text.
- Click the extension action button and confirm the research popup appears.
- Confirm client and matter dropdowns load.
- Save with valid minutes, client, and matter.
- Confirm the backend entry has `source: research`, `url`, `domain`, `sourceRef`, and `status: converted`.
- Disable research capture and confirm clicking the extension action opens settings instead of injecting the capture popup.

## Backend reconciliation and metrics

- Call `GET /api/email-entries/ops/metrics` as admin/partner and confirm counts by status, source, idempotent replay, conversion failure, and reconciliation bucket.
- Call `GET /api/email-entries/ops/reconcile` and confirm it lists captured-unmapped, mapped-unconverted, converted-missing-link, and duplicate-sourceRef records.
- Use `POST /api/email-entries/ops/reconcile/:id/repair` on a mapped-unconverted record and confirm Activity, TimeEntry, and Billable links are created.
- Create a duplicate replay with the same user/source/sourceRef and confirm the backend returns the existing entry with `idempotent: true`.

## Packaging sanity

- Confirm manifest includes `options_page`.
- Confirm manifest includes icon assets for `16`, `32`, `48`, and `128`.
- Confirm manifest includes `storage`, `scripting`, `activeTab`, and `alarms` permissions only.
- Confirm the extension loads without manifest errors in `chrome://extensions`.
