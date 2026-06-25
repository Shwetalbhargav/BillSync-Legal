# Backup And Recovery

## Targets
- Pilot RPO: 24 hours.
- Pilot RTO: 4 hours.
- Post-pilot RPO: 1 hour.
- Post-pilot RTO: 1 hour.

## Database Backups
- Run automated encrypted MongoDB backups at least daily for pilot and hourly after pilot.
- Store backups in a separate cloud account/project or isolated backup vault.
- Encrypt with a managed KMS key referenced by `BACKUP_ENCRYPTION_KEY_REF`.
- Retention: 35 daily backups, 12 monthly backups.
- Windows runners can use `infra/backup/mongodb-backup.ps1` to create an encrypted archive before upload to the backup vault.

## Document Storage Backups
- Enable bucket/object versioning.
- Replicate documents to a backup bucket with a separate retention policy.
- Retention: match database retention, plus legal hold where required by customer contract.

## Monthly Restore Drill
1. Create an isolated restore environment.
2. Restore the latest database backup.
3. Restore document storage for the same point in time.
4. Run migrations with `npm run migrate`.
5. Verify `/healthz`, `/api/ops/readyz`, login, client list, matter list, invoice PDF, payment reconciliation report.
6. Record actual RPO/RTO and gaps in the incident log.
- Windows runners can use `infra/backup/mongodb-restore-drill.ps1` for the database restore step.

## Rollback
- Prefer image rollback to the last staging-approved image.
- If a migration is forward-only, restore from backup into a new database and point the previous image at that database.
- Freeze invoice finalisation and payments during rollback if financial data consistency is uncertain.
