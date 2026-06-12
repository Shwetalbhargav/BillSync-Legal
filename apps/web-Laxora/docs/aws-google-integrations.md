# AWS Google Integrations

## Scope

- Combined cloud storage provider overview.
- Google Drive setup/status screen.
- AWS firm storage setup/status screen.
- Not-connected states and setup requirements.

## Implementation Notes

- Routes render under `/app/integrations/cloud-storage`, `/app/integrations/google-drive`, and `/app/integrations/aws-storage`.
- Existing document storage records are used to show saved Google Drive and AWS firm storage references.
- Provider setup stays intentionally disabled until real provider status and connection resources exist.
- No file transfer, preview, or download success is claimed.

## Backend Gaps

- `GET /api/integrations/google-drive/status`
- `GET /api/integrations/google-drive/connect-url`
- `POST /api/integrations/google-drive/link-folder`
- `GET /api/integrations/aws-storage/status`
- `PATCH /api/integrations/aws-storage/settings`
- `POST /api/document-storage/uploads`
- `GET /api/document-storage/:documentId/download`

## Tester Notes

- Verify that Google Drive and AWS screens render setup requirements.
- Verify that provider status is clearly not connected.
- Verify that saved cloud provider records can appear without claiming direct file transfer is enabled.
