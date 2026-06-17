# Lexora Desktop Agent

Windows-first Electron agent for privacy-safe desktop activity tracking.

## Development

```sh
npm install
npm run dev
```

The agent talks to the backend using `POST /api/auth/desktop-login` and then polls `GET /api/work-sessions/current`.

Default deployed targets:

- Backend API: `https://billsync-legal.onrender.com`
- Web Work Meter: `https://bill-sync-legal.vercel.app/app/work-meter`

## Privacy

The agent sends counts and timing only:

- keyboard event count
- mouse event count
- active/inactive seconds
- active app name and window title

It does not send keystroke values, screenshots, document content, clipboard content, or page text.
