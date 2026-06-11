# HR People

Branch: `feat/hr-people`

## Scope

- HR dashboard with people totals, workload, active meter signals, and attendance readiness.
- Team directory using real users.
- Employee profile using user profile and workload resources.
- Workload and attendance overview using time entries and work sessions where available.

## Connected Resources

- `GET /api/users`
- `GET /api/users/:id`
- `GET /api/users/:id/profile`
- `GET /api/users/:id/default-rate`
- `GET /api/time-entries`
- `GET /api/work-sessions`

## UX States

- Loading state while people records refresh.
- Empty team directory state.
- Empty workload and work-session states.
- Error states for dashboard, directory, profile, and workload pages.
- Partial-refresh warnings when workload or profile data cannot be refreshed.
- Attendance not-turned-on state.

## Backend Gap

Attendance is not available as a dedicated HR resource yet. The frontend does not claim attendance compliance or leave tracking, and only uses work sessions/time entries for workload signals.
