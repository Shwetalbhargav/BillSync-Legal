# Auth, Users, and Permissions Branch

Branch: `feat/auth-users-permissions`

## Scope

- Working sign-in screen shaped to the deployed auth contract.
- Invite acceptance screen using the existing registration route.
- Password help and reset placeholder states with honest user-facing guidance.
- Protected app shell that waits for the current signed-in user.
- Role-aware page rendering for every planned app route.
- Profile screen with refresh and sign-out.
- Admin user management screen connected to the users service.

## Routes

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/app/profile`
- `/app/admin/users`
- All existing `/app/*` product routes now pass through signed-in and role checks.

## Connected Services

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/users`

## Backend Gaps

- No self-service forgot-password route was found.
- No self-service reset-password route was found.
- No invite-token acceptance route was found; the frontend uses registration until the invite lifecycle exists.
- User role editing is not wired in this branch because the current route inventory needs final confirmation for the safe update workflow.

## Tester Notes

- The sign-in form needs the firm member's name, mobile number, password, role, and firm code.
- Opening a protected page while signed out redirects to sign-in.
- A signed-in user only sees navigation and pages allowed for their role.
