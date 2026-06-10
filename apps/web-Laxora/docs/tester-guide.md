# Tester Guide

## What This Branch Shows

- Public auth layout.
- Protected app shell.
- Sidebar on desktop.
- Bottom navigation on mobile.
- Role-aware navigation preview.
- Placeholders for all planned product screens.
- 24 fallback/loading/empty/error states.
- Global assistant entry point placeholder.

## What This Branch Does Not Yet Do

- It does not complete feature workflows.
- It does not persist user actions.
- It does not claim assistant answers are ready.
- It does not hide backend gaps; they are listed in `docs/backend-gaps.md`.

## Tester Checks

- Open `/login`.
- Open `/app/dashboard`.
- Change the role selector and confirm navigation changes.
- Open `/app/matters`.
- Open `/states/no-matters-assigned`.
- Resize to 360px and confirm bottom navigation is usable.

