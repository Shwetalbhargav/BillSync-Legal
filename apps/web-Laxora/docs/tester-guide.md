# Tester Guide

## Demo Entry Points

- Public sign-in: `/login`
- Protected workspace shell: `/app/dashboard`
- Admin setup and controls: `/app/settings`
- Client and matter flow: `/app/clients`, `/app/matters`
- Daily work flow: `/app/tasks`, `/app/work-meter`, `/app/captured-work`
- Billing and finance flow: `/app/billables`, `/app/invoices`, `/app/payments`, `/app/finance`
- Assistant and document flow: `/app/assistant`, `/app/assistant/documents`
- Integration readiness: `/app/extension/setup`, `/app/integrations/zoho`, `/app/integrations/cloud-storage`
- Fallback gallery: `/fallback-gallery`

## Role Demo Paths

- Lawyer: dashboard, clients, matters, tasks, work meter, captured work, assistant, extension setup.
- Partner: dashboard, clients, matters, tasks, billing, finance, people, settings, support, assistant.
- Admin: full workspace review, user management, firm setup, permissions review, integrations, finance, people.

## Seeded Data Assumptions

- Demo data should include at least one firm, one admin, one partner, one lawyer, one client, one matter, one invoice, and one payment.
- If seeded records are not present, screens should show empty or not-configured guidance rather than broken UI.
- Public firm options are available for smoke checks; signed-in actions still require a valid demo account.

## Required Smoke Checks

- Run `npm run smoke`.
- Run `npm run build`.
- Open `/login`.
- Open `/app/dashboard` and confirm protected routes show the sign-in flow when no session is active.
- Open `/fallback-gallery` and confirm all 24 fallback states are reachable.
- Open `/states/not-configured`, `/states/connection-needs-attention`, and `/states/save-failed`.
- Resize to 360px and confirm there is no horizontal page overflow.

## Backend Gap Review

- Review `docs/backend-gaps.md` for feature-level gaps.
- Review `docs/e2e-demo-hardening-report.md` for final demo QA notes.
- Do not treat not-configured states as failures when the report lists the missing service contract.

