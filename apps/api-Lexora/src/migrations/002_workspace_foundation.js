import {
  backfillWorkspaceIds,
  backfillWorkspacesFromFirms,
  ensureWorkspaceFoundationIndexes,
  ensureWorkspacesForExistingWorkspaceIds,
  ensureWorkspaceSubscriptionsAndModules,
  seedCorePlatformData,
  validateWorkspaceFoundation,
} from '../modules/workspace/services/workspaceFoundationService.js';

export const name = '002_workspace_foundation';

export async function up(db) {
  await ensureWorkspaceFoundationIndexes(db);
  const catalog = await seedCorePlatformData(db);
  const workspaces = await backfillWorkspacesFromFirms(db);
  const workspaceIds = await backfillWorkspaceIds(db);
  const placeholderWorkspaces = await ensureWorkspacesForExistingWorkspaceIds(db);
  const subscriptionsAndModules = await ensureWorkspaceSubscriptionsAndModules(db);
  const validation = await validateWorkspaceFoundation(db);

  if (!validation.ok) {
    const error = new Error('Workspace foundation validation failed');
    error.validation = validation;
    throw error;
  }

  return {
    catalog,
    workspaces,
    workspaceIds,
    placeholderWorkspaces,
    subscriptionsAndModules,
    validation,
  };
}

export async function down(db) {
  for (const name of [
    'workspacemodules',
    'workspacefeatureoverrides',
    'subscriptions',
    'policies',
    'moduleregistries',
    'roles',
    'permissions',
    'features',
    'plans',
    'workspaces',
  ]) {
    await db.collection(name).drop().catch((error) => {
      if (error?.codeName !== 'NamespaceNotFound') throw error;
    });
  }

  return {
    ok: true,
    note: 'Dropped workspace foundation collections. Legacy workspaceId backfill fields were preserved for rollback safety.',
  };
}
