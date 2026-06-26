import ModuleRegistry from '../models/ModuleRegistry.js';
import WorkspaceModule from '../models/WorkspaceModule.js';
import { getCurrentUserPermissionSummary, PERMISSION_DENIED_MESSAGE } from './rbacPolicyService.js';
import { getWorkspaceModuleAccess } from './subscriptionFeatureService.js';
import { CORE_MODULES } from './workspaceFoundationService.js';
import { idText } from '../../../../../../packages/shared/src/index.js';
import {
  buildNavigationModel,
  publicModule,
  validateModuleDependencies,
} from '../../../../../../packages/module-registry/src/index.js';

export { buildNavigationModel, publicModule, validateModuleDependencies };

export async function getWorkspaceModuleNavigation({ workspaceId, userId, user }) {
  if (!workspaceId) {
    const error = new Error('Choose a workspace before loading navigation.');
    error.statusCode = 400;
    throw error;
  }

  const [registryRows, workspaceModuleRows, permissionSummary] = await Promise.all([
    ModuleRegistry.find({ status: { $ne: 'retired' } }).sort({ order: 1, key: 1 }).lean(),
    WorkspaceModule.find({ workspaceId }).lean(),
    getCurrentUserPermissionSummary({ userId, workspaceId, user }),
  ]);
  const registryModules = registryRows.length ? registryRows.map(publicModule) : CORE_MODULES.map(publicModule);
  const workspaceModules = Object.fromEntries(workspaceModuleRows.map((row) => [row.moduleKey, row]));
  const accessEntries = await Promise.all(registryModules.map(async (module) => {
    const access = await getWorkspaceModuleAccess({ workspaceId, moduleKey: module.key });
    return [module.key, access];
  }));
  const model = buildNavigationModel({
    modules: registryModules,
    permissions: permissionSummary.permissions || [],
    workspaceModules,
    accessByModule: Object.fromEntries(accessEntries),
    permissionDeniedMessage: PERMISSION_DENIED_MESSAGE,
  });

  return {
    workspaceId: idText(workspaceId),
    permissions: permissionSummary,
    ...model,
    message: model.navigation.length ? '' : 'No modules are available for this workspace yet.',
  };
}
