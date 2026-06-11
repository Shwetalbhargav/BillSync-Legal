# Fallback State System

Branch: `feat/fallback-state-system`

## Scope

- Central catalog for all 24 fallback states.
- Reusable fallback panel with status tone, action buttons, and purposeful animation.
- Public fallback gallery at `/fallback-gallery`.
- Public individual state routes at `/states/*`.
- Existing product placeholders now preview the shared loading, empty, and recovery patterns.

## Public Routes

- `/fallback-gallery`
- `/states/loading-workspace`
- `/states/empty-dashboard`
- `/states/no-matters-assigned`
- `/states/session-expired`
- `/states/permission-needed`
- `/states/connection-needs-attention`
- `/states/save-failed`
- `/states/offline`
- `/states/search-empty`
- `/states/calendar-not-connected`
- `/states/payment-failed`
- `/states/upload-progress`
- `/states/assistant-thinking`
- `/states/extension-connected`
- `/states/recorder-permission`
- `/states/report-unavailable`
- `/states/billing-ready`
- `/states/approval-submitted`
- `/states/invite-accepted`
- `/states/password-reset`
- `/states/storage-unavailable`
- `/states/sync-progress`
- `/states/no-captured-work`
- `/states/not-configured`

## Connected Services

- `GET /healthz` was verified against the deployed service for availability.

## Frontend Adapters Added

- `backendGapAdapters.paymentRecovery`
- `backendGapAdapters.uploadRecovery`
- `backendGapAdapters.courtCalendarSync`

## Backend Gaps

- Payment retry status needs a safe recovery status route.
- Upload progress and failure states need a resumable upload status route.
- Court calendar sync states need provider status and last-sync details.
