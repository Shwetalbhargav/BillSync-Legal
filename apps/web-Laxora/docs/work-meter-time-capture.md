# Work Meter Time Capture

Branch: `feat/work-meter-time-capture`

## Implemented Screens

- Work Meter: `/app/work-meter`
- Work Session History: `/app/work-sessions`
- Manual Time Entry: `/app/time-entry/new`
- Time Entries: `/app/time-entries`
- Captured Work Review: `/app/captured-work`
- Activity Capture: `/app/activities`
- Submit Work for Approval: `/app/submit-work`

## Service Contract

`src/api/workCapture.js` composes:

- Current work session and matter/client options.
- Work-session history and time entries.
- Captured activities for review.
- Draft time entries for approval submission.

## UX States

- Live work-meter clock.
- Loading and retry states for every data surface.
- Empty captured work, empty session history, and empty submission queue.
- Save-failed state that keeps the active time visible and retryable.
- Manual time validation for matter, client, description, and minutes.

## Known Gaps

- Direct time-entry-to-billable conversion is not available yet.
