# Calendar Hearings

Branch: `feat/calendar-hearings`

## Implemented Screens

- Calendar and Hearings: `/app/calendar`
- Hearing Dashboard: `/app/hearings`
- Court Hearing Time Entry: `/app/hearings/manual-time`
- Calendar not connected state on the calendar workspace

## Service Contract

`src/api/calendar.js` composes available resources:

- Hearing activity list from `GET /api/activities?activityType=hearing`.
- Work-session list from `GET /api/work-sessions`.
- Court time entries from `GET /api/time-entries`.
- Manual hearing save through `POST /api/activities` and `POST /api/time-entries`.

## UX States

- Loading while hearing records load.
- Empty state when no hearings are captured.
- Not-connected state for calendar provider sync.
- Partial-refresh warnings when supporting hearing data cannot refresh.
- Manual form validation for matter, client, title, start time, and minutes.

## Known Gaps

- Calendar provider event sync is not available yet.
- Work-session start validation does not currently accept hearing calendar metadata.
