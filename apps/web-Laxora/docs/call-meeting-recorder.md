# Call Meeting Recorder Branch

Branch: `feat/call-meeting-recorder`

## Implemented Screens

- `/app/recordings` - call and meeting recorder workspace, microphone readiness check, saved recording library, related meeting work, and transcript not-configured panel.
- `/app/recordings/:recordingId` - recording detail placeholder prepared for transcript review, matter linking, and follow-up actions.
- `/states/recorder-permission` - existing fallback state remains linked from the recorder workspace.

## Data Approach

The backend does not currently expose saved recording, audio upload, transcript, or recording-to-matter routes. The frontend therefore does not fake recording persistence.

The recorder workspace composes available related work data from:

- `GET /api/activities?activityType=meeting`
- `GET /api/activities?activityType=call`
- `GET /api/work-sessions`

Saved recordings remain an honest empty state until recording storage is available.

## Frontend Adapter

`src/api/recordings.js` provides a future-ready recorder service:

- `recordingsApi.loadWorkspace()` loads related meeting/call activity and work sessions.
- `recordingsApi.getRecording()` returns an honest not-configured detail model.
- `recordingsApi.createRecording()` points at the tracked recording gap adapter.

## UX States Covered

- Loading while related recorder context loads.
- Empty saved recording library.
- Partial refresh warning when related work sources fail.
- Microphone ready, blocked, and unavailable states.
- Transcript unavailable state.
- Matter link unavailable state.

## Backend Gaps

- `GET /api/recordings`
- `POST /api/recordings`
- `GET /api/recordings/:recordingId`
- `POST /api/recordings/:recordingId/transcribe`
- `PATCH /api/recordings/:recordingId/matter`

The UI is ready to consume these once they exist, but it currently avoids saving or presenting any pretend audio records.
