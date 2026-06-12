# Zoho Integration API

## Scope

- Zoho connect and status screen.
- Zoho client, matter, and invoice sync actions.
- WorkDrive matter folder link form.
- Zoho sync logs.
- Attachment review shell for linked records.

## Implementation Notes

- Routes render under `/app/integrations/zoho`, `/app/integrations/zoho/workdrive`, and `/app/integrations/zoho/logs`.
- The frontend uses existing Zoho auth, sync, WorkDrive, attachment, and integration-log routes.
- Zoho connection failures are shown as setup guidance, not raw provider messages.
- WorkDrive link validates that a matter and folder detail are provided before saving.

## Backend Gaps

- No branch-blocking gaps.
- A future single Zoho health summary route could simplify the page if CRM, WorkDrive, scopes, and recent sync status need one combined response.

## Tester Notes

- Verify Zoho connect link opens in a new tab when the user is signed in.
- Verify sync actions show friendly review guidance when Zoho is not connected.
- Verify WorkDrive link form validates matter and folder details.
- Verify Zoho logs render an empty state when no events are available.
