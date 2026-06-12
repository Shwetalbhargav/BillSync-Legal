# Settings Admin Controls

This branch adds the shared settings workspace for admins and partners.

## Implemented Routes

- `/app/settings`
- `/app/settings/invoice-tax`
- `/app/settings/storage-defaults`
- `/app/settings/notifications`
- `/app/security`
- `/app/compliance`
- `/app/firms`
- `/app/admin`

## Connected Workflows

- Firm name and currency save through firm routes.
- Tax defaults save through firm tax settings.
- Billing defaults save through firm billing preferences.
- Team role counts load from the users route.
- Security and firm admin screens are gated to admins only.

## Not Configured Yet

- Editable permissions matrix.
- Invoice template and reminder defaults.
- Notification digest and alert defaults.
- Storage provider defaults and matter folder rules.

These areas use explicit adapters and disabled UI states so testers can see the planned shape without mistaking it for live behavior.
