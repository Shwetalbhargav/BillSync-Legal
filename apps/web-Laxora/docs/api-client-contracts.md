# API Client Contracts

## Goals

- Keep feature screens importing small service modules.
- Normalize errors before UI code sees them.
- Support cookie-based auth, query params, cursor pagination, and uploads.
- Keep missing backend capabilities honest through named gap adapters.

## Import Pattern

```js
import { mattersApi, normalizeMatter } from "../api";

const page = await mattersApi.list({ limit: 25 });
const matters = asList(page).map(normalizeMatter);
```

## Error Contract

All request failures throw `BillSyncApiError`.

```js
try {
  await mattersApi.list();
} catch (error) {
  showToast(error.userMessage);
}
```

UI code should use `error.userMessage`, not raw response details.

## Pagination Contract

Use `makeCursorParams` for cursor-based lists.

```js
const params = makeCursorParams({ cursor, limit: 25, status: "active" });
const result = await tasksApi.list(params);
```

If the backend returns any common list shape, `asPage` normalizes it to:

- `items`
- `nextCursor`
- `hasMore`
- `total`
- `raw`

## Upload Contract

Use `createUploadBody(files, fields)` to build multipart bodies.

```js
const body = createUploadBody(files, { matterId });
await documentStorageApi.upload(files, { matterId });
```

## Backend Gap Adapters

Named adapters live in `src/api/gaps.js`:

- `dashboardSummary`
- `setupStatus`
- `globalAssistantChat`
- `extensionHealth`
- `calendarProvider`
- `recorderTranscription`

Feature branches should show honest unavailable states when these adapters reject.
