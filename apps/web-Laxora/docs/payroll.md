# Payroll Workflow Shell

## Scope

The payroll branch adds protected People-module screens for payroll runs, payroll detail, and compensation setup. The screens are intentionally setup-first because payroll records are not available yet.

## Connected Resources

- Team members from `GET /api/users`
- Workload context from `GET /api/time-entries`
- Work-session context from `GET /api/work-sessions`

These resources help administrators see who needs compensation setup before payroll is turned on.

## Routes

- `/app/payroll`
- `/app/payroll/:runId`
- `/app/compensation`

## States Covered

- Loading while workspace records refresh
- Empty payroll run history
- Empty compensation placeholders when no people load
- Warning state when payroll is not turned on
- Retry-ready error state for failed refreshes

## Known Gap

Payroll run creation, compensation editing, approvals, payslip generation, and delivery need product resources before the UI can perform real payroll work. Until then, the frontend uses `backendGapAdapters.payrollRuns` and shows not-configured guidance.
