export const name = '001_workspace_and_finance_indexes';

export async function up(db) {
  await db.collection('invoices').createIndex({ workspaceId: 1, invoiceNumber: 1 }, { unique: true, sparse: true });
  await db.collection('payments').createIndex({ workspaceId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
  await db.collection('payments').createIndex({ workspaceId: 1, receiptNumber: 1 }, { unique: true, sparse: true });
  await db.collection('worksessions').createIndex(
    { workspaceId: 1, captureSource: 1, sourceFingerprint: 1 },
    { unique: true, partialFilterExpression: { sourceFingerprint: { $exists: true, $type: 'string' } } }
  );
  await db.collection('billables').createIndex(
    { workspaceId: 1, sourceFingerprint: 1 },
    { unique: true, partialFilterExpression: { sourceFingerprint: { $exists: true, $type: 'string' } } }
  );
}
