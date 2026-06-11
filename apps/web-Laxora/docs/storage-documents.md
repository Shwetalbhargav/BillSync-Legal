# Storage Documents

## Scope

This branch adds document storage screens for the protected BillSync workspace:

- Storage library
- Document metadata save form
- Document viewer
- Storage settings
- Matter document links

## Connected Resources

- `GET /api/document-storage`
- `POST /api/document-storage`
- `GET /api/document-storage/:documentId`
- `POST /api/document-storage/:documentId/status`
- `GET /api/cases`
- `GET /api/clients`
- `GET /api/integrations/zoho-sync/modules`

## UX States

- Loading while records refresh
- Empty document library
- Provider not connected
- Upload/file-transfer not ready
- Document viewer preview unavailable
- Save failure with retry guidance
- Archive success

## Known Gaps

The current backend stores document metadata and linked storage references. It does not yet accept direct binary upload from the frontend or return signed download/preview links. Google Drive and AWS-style storage setup also need provider status resources.
