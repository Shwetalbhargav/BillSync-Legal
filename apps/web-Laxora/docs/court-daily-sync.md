# Court Daily Sync

## Scope

- Court daily sync dashboard.
- Court case match review shell.
- Verdict detail shell.
- Court sync settings.
- Clear split between manual hearing time and connected court feed work.

## Implementation Notes

- Routes render under `/app/court-sync`, `/app/court-sync/matches`, `/app/court-sync/verdicts/:verdictId`, and `/app/court-sync/settings`.
- Manual hearing context is loaded from available activity, work-session, time-entry, and matter resources.
- Live court feed items are not invented. The feed panels stay empty and show setup guidance until provider routes exist.
- Settings controls are disabled until the firm chooses and connects a trusted court feed source.

## Backend Gaps

- `GET /api/court/daily-sync`
- `POST /api/court/daily-sync/run`
- `GET /api/court/matches`
- `PATCH /api/court/matches/:matchId`
- `GET /api/court/verdicts`
- `GET /api/court/verdicts/:verdictId`

## Tester Notes

- Verify that court sync and manual hearing capture are visually distinct.
- Verify that no court order, verdict, or cause list is shown as real until sync is connected.
- Verify that the match screen can show matter candidates without linking unsupported court items.
