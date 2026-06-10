# Legal Billables Chrome Extension

Tracks actual typing time in Gmail, captures research work from the active browser tab, and logs idempotent email-entry records through the backend.

## Current scope

- Gmail content script on `https://mail.google.com/*`
- Active typing timer with idle pause
- Confirmed-send email-entry logging
- AI draft generation inside Gmail
- Post-log client/matter dropdown mapping
- Research capture from the extension action button
- Centralized Gmail DOM adapter with fallback selectors and MutationObserver refresh
- Local pending-capture queue with retry/backoff and sync status UI
- Extension settings page for identity, backend URL, frontend login URL, auth session linking, and feature flags

## Privacy behavior

The extension currently sends:

- recipient
- subject
- typing time in minutes
- typing time in seconds
- typing time in `m.ss` display format
- resolved user email
- source metadata: `sourceRef`, `messageId`, `threadId`, `url`, and `domain`

The extension does not send:

- email body content

Note: the backend may still generate a billable summary from the subject or backend-side rules, but the extension itself no longer submits the compose body text.

## Identity behavior

The extension resolves the acting user in this order:

1. `chrome.storage.sync.userEmail`
2. Signed-in Gmail account detected from the page

If no email can be resolved, the extension will not log time and will show an in-page error.

## Auth behavior

Primary auth is backend web-login based:

1. Open extension options.
2. Click `Open Backend Login`.
3. Sign in to the backend app.
4. Return to options and click `Check Session`.

The service worker calls `POST /api/auth/extension-token` with backend cookies and stores the returned short-lived extension token in `chrome.storage.local`. Backend requests still use `credentials: "include"` and include extension identity headers. The bearer-token field is retained only as an advanced fallback for development or support.

## Settings

Options page:

- `options.html`
- available through Chrome extension details or `chrome.runtime.openOptionsPage()`

Settings supported:

- `userEmail`
- `backendBaseUrl`
- `frontendAppUrl`
- `authToken`
- `featureResearchCapture`
- `featureAutoConvert`
- `featureAIDrafting`

Requests are sent through the extension service worker. The service worker includes backend cookies with `credentials: "include"`, adds extension identity headers, and uses the short-lived extension token when linked.

If you open `options.html` directly as a `file://` page, it will fall back to preview mode and use `localStorage` instead of extension sync storage.

## Backend

Production backend:

- `https://legalbillind-backend.onrender.com`

Dev backend:

- `http://localhost:5000`

Endpoints used:

- `POST /api/auth/extension-token`
- `POST /api/email-entries`
- `POST /api/email-entries/:id/map`
- `GET /api/email-entries/ops/metrics`
- `GET /api/email-entries/ops/reconcile`
- `POST /api/email-entries/ops/reconcile/:id/repair`
- `GET /api/clients`
- `GET /api/cases`
- `POST /api/ai/generate-email`

## Automated QA

Run extension unit and Gmail-adapter fixture tests:

```sh
npm test
```

The tests cover sourceRef stability, idle-capped timing, timer formatting, and Gmail-like compose selector behavior.

## Install (Chrome)

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `legal-billables-extension` folder.
5. Refresh Gmail after the extension loads.

## Expected user flow

1. Open a Gmail compose window.
2. Type in the message body and watch the timer increment.
3. Stop typing for more than `5s` to confirm the timer pauses.
4. Send the email.
5. Wait for send confirmation and log popup.
6. Optionally select a client and matter in the mapping popup. Saving mapping also requests backend conversion into Activity, TimeEntry, and Billable records.

If the backend is offline or returns a retryable failure, the capture is stored locally with the same `sourceRef` and retried by the service worker. The Gmail status badge shows queued, syncing, synced, and failed items; clicking it retries failed captures and displays recent reasons.

## Research capture flow

1. Open a research page.
2. Optionally select relevant text.
3. Click the extension action button.
4. Enter minutes, select client and matter, then save.
5. The capture is posted as `source: "research"` with page URL/domain metadata and `autoConvert: true`.

## Operational robustness

- Gmail selectors are centralized in `gmailAdapter.js`.
- Compose detection is refreshed through a `MutationObserver`.
- Gmail selector failures show a visible `Capture unavailable` state instead of silently losing capture.
- Active compose state is persisted in `chrome.storage.local` so timer state can recover after Gmail reloads or service-worker restarts.
- Backend posts use request timeouts, retry-safe local queueing, exponential backoff, and stable idempotency keys.
- Diagnostic logs use event names and failure categories, not raw email body content.
- Feature flags can disable research capture, auto-conversion, or AI drafting without redeploying the extension.
- Backend reconciliation endpoints find unmapped, unconverted, broken-link, and duplicate-sourceRef records and can repair mapped captures.

## QA

Use [QA_CHECKLIST.md](./QA_CHECKLIST.md) for manual verification.

## Packaging

Run the automated checks and build a clean Chrome Web Store ZIP:

```sh
npm run release:check
npm run package
```

The package command writes `dist/billsync-capture-<version>.zip` and includes only release files: manifest, service worker, content scripts, options page, research capture script, and icons.

Included assets:

- `icons/icon-16.png`
- `icons/icon-32.png`
- `icons/icon-48.png`
- `icons/icon-128.png`

Manifest packaging hooks:

- `options_page`
- extension icons
- action title

## Uninstall

Remove the extension from `chrome://extensions`.

## License

All rights reserved. Provided solely for evaluation. No redistribution.
