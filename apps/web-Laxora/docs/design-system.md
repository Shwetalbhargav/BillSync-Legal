# BillSync Design System

This branch adds reusable UI primitives before feature screens expand.

## Components Added

- Buttons: primary, secondary, quiet, success, danger, disabled, loading, icon size.
- Cards: base card, header, body.
- Forms: text field, select, textarea, checkbox, helper text, validation message.
- Status badges: neutral, success, warning, danger, accent.
- State cards: loading, empty, error, offline, permission, retry, success.
- Tabs: segmented control for compact views.
- Dialog and drawer shells.
- Toast notification surface.
- Skeleton loading blocks.
- Progress indicator.
- Data table.

## Gallery

Open `/app/design-system` to inspect the component gallery.

## Design Tokens

Palette and radius tokens live in:

- `tailwind.config.js`
- `src/styles/tokens.css`
- `src/index.css`

## Implementation Notes

- Components are intentionally small and composable.
- User-facing copy stays plain and non-technical.
- Feature branches should reuse these primitives instead of creating one-off UI.
