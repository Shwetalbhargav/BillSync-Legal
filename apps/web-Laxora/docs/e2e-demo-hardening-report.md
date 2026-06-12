# End-to-End Demo Hardening Report

## Scope

This branch hardens the frontend demo path by adding smoke checks for route inventory, fallback completeness, role access consistency, and user-facing copy.

## Route Inventory

- Product routes expected: at least 75.
- Fallback routes expected: 24.
- Fallback catalog entries expected: 24.
- All routes must have path, title, module, module key, and role group metadata.
- Duplicate route paths are treated as a test failure.

## Demo Role Paths

- Lawyer: dashboard, client review, matter review, tasks, work meter, captured work, assistant, extension setup.
- Partner: lawyer path plus billing, finance, people, settings, and support/testing evidence.
- Admin: full workspace including firm setup, user management, settings, integrations, finance, people, and all support routes.

## Seeded Data Assumptions

- At least one firm should exist for public firm selection checks.
- Signed-in demos need one admin, one partner, and one lawyer.
- Useful demo records: one client, one matter, one task, one time entry, one billable, one invoice, one payment, and one stored document record.
- Missing seeded records should produce empty states or not-configured states, not broken pages.

## Smoke Command

Run:

```powershell
npm run smoke
```

The smoke command checks:

- Product route count.
- Fallback route count.
- Fallback catalog matching.
- Route metadata completeness.
- Role access consistency.
- User-facing technical copy restrictions.

## Backend Gaps Still Visible In Demo

- Global streaming assistant chat and source-backed research.
- Full document indexing for matter document Q&A.
- Extension health diagnostics and browser handshake test.
- Calendar provider sync and court daily feed.
- Recorder persistence and transcription.
- Direct document file transfer and signed download links.
- WhatsApp, SMS, communication logs, and provider send actions.
- Payment gateway collection.
- Payroll, attendance, and compensation resources.
- Managed settings for invoice defaults, notifications, storage defaults, and permission matrix.

These gaps should remain visible through honest not-configured or needs-attention states.
