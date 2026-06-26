import { normalizeArray, packageBoundary } from '../../shared/src/index.js';

export const MODULE_REGISTRY_PACKAGE = packageBoundary('@lexora/module-registry', [
  'module-manifests',
  'module-dependencies',
  'module-state',
]);

const HIDDEN_STATES = new Set(['hidden']);
const BLOCKED_STATES = new Set(['hidden', 'disabled']);
const PUBLIC_MODULE_FIELDS = [
  'key',
  'name',
  'status',
  'state',
  'routeBase',
  'requiredPlanKey',
  'featureKeys',
  'permissionKeys',
  'dependencies',
  'navigation',
  'order',
  'metadata',
];

export function publicModule(module) {
  const obj = typeof module?.toObject === 'function' ? module.toObject() : module;
  if (!obj) return null;
  return PUBLIC_MODULE_FIELDS.reduce((memo, field) => {
    if (obj[field] !== undefined) memo[field] = obj[field];
    return memo;
  }, {
    key: obj.key,
    name: obj.name,
    status: obj.status || 'active',
    state: obj.state || 'enabled',
    routeBase: obj.routeBase,
    requiredPlanKey: obj.requiredPlanKey,
    featureKeys: normalizeArray(obj.featureKeys),
    permissionKeys: normalizeArray(obj.permissionKeys),
    dependencies: normalizeArray(obj.dependencies),
    navigation: obj.navigation || {},
    order: obj.order || obj.navigation?.order || 100,
  });
}

export function validateModuleDependencies(modules = []) {
  const moduleKeys = new Set(modules.map((module) => module.key));
  const unknownDependencies = [];
  const cycles = [];

  modules.forEach((module) => {
    (module.dependencies || []).forEach((dependencyKey) => {
      if (!moduleKeys.has(dependencyKey)) {
        unknownDependencies.push({ moduleKey: module.key, dependencyKey });
      }
    });
  });

  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const moduleByKey = new Map(modules.map((module) => [module.key, module]));

  function visit(moduleKey) {
    if (visited.has(moduleKey)) return;
    if (visiting.has(moduleKey)) {
      const start = stack.indexOf(moduleKey);
      cycles.push(stack.slice(start).concat(moduleKey));
      return;
    }
    visiting.add(moduleKey);
    stack.push(moduleKey);
    const module = moduleByKey.get(moduleKey);
    (module?.dependencies || []).forEach((dependencyKey) => {
      if (moduleByKey.has(dependencyKey)) visit(dependencyKey);
    });
    stack.pop();
    visiting.delete(moduleKey);
    visited.add(moduleKey);
  }

  modules.forEach((module) => visit(module.key));

  return {
    ok: unknownDependencies.length === 0 && cycles.length === 0,
    unknownDependencies,
    cycles,
  };
}

function behaviorToState(behavior) {
  if (behavior === 'hide') return 'hidden';
  if (behavior === 'read_only') return 'read_only';
  if (behavior === 'disable') return 'disabled';
  return 'enabled';
}

function resolveModuleState({ module, access, workspaceModule, permissionAllowed, dependencyIssues, permissionDeniedMessage }) {
  const moduleStatus = module.status || 'active';
  if (moduleStatus !== 'active') {
    return {
      state: 'hidden',
      allowed: false,
      reason: 'This module is not available in this workspace.',
    };
  }

  if (module.state === 'hidden' || module.state === 'disabled') {
    return {
      state: module.state,
      allowed: false,
      reason: module.state === 'disabled' ? 'This module is paused for this workspace.' : null,
    };
  }

  if (workspaceModule && workspaceModule.status !== 'enabled') {
    return {
      state: workspaceModule.status === 'not_configured' ? 'disabled' : workspaceModule.status,
      allowed: ['read_only', 'experimental'].includes(workspaceModule.status),
      reason: workspaceModule.reason || 'This module is not available in this workspace.',
    };
  }

  if (dependencyIssues.length) {
    return {
      state: 'disabled',
      allowed: false,
      reason: 'Another module must be enabled before this area can be used.',
    };
  }

  if (!permissionAllowed) {
    return {
      state: 'hidden',
      allowed: false,
      reason: permissionDeniedMessage,
    };
  }

  if (!access?.allowed) {
    const state = behaviorToState(access?.behavior);
    return {
      state,
      allowed: state === 'read_only',
      reason: access?.reason || 'This module is not available in this workspace.',
    };
  }

  if (module.state === 'read_only' || module.state === 'experimental') {
    return {
      state: module.state,
      allowed: true,
      reason: null,
    };
  }

  return { state: 'enabled', allowed: true, reason: null };
}

export function buildNavigationModel({
  modules = [],
  permissions = [],
  accessByModule = {},
  workspaceModules = {},
  permissionDeniedMessage = 'You do not have access to this area.',
}) {
  const permissionSet = new Set(permissions);
  const validation = validateModuleDependencies(modules);
  const moduleStateByKey = new Map();
  const resolvedModules = [];

  for (const module of [...modules].sort((a, b) => (a.order || 100) - (b.order || 100))) {
    const dependencyIssues = (module.dependencies || []).filter((dependencyKey) => {
      const dependencyState = moduleStateByKey.get(dependencyKey);
      return dependencyState && BLOCKED_STATES.has(dependencyState);
    });
    const requiredPermissions = normalizeArray(module.permissionKeys);
    const permissionAllowed = requiredPermissions.length === 0
      || requiredPermissions.every((permissionKey) => permissionSet.has(permissionKey));
    const decision = resolveModuleState({
      module,
      access: accessByModule[module.key],
      workspaceModule: workspaceModules[module.key],
      permissionAllowed,
      dependencyIssues,
      permissionDeniedMessage,
    });

    moduleStateByKey.set(module.key, decision.state);
    resolvedModules.push({
      ...module,
      state: decision.state,
      allowed: decision.allowed,
      reason: decision.reason,
      readOnly: decision.state === 'read_only',
      experimental: decision.state === 'experimental',
      dependenciesReady: dependencyIssues.length === 0,
    });
  }

  const navigation = resolvedModules
    .filter((module) => !HIDDEN_STATES.has(module.state))
    .map((module) => {
      const navigation = module.navigation || {};
      return {
        label: navigation.label || module.name,
        path: navigation.path || module.routeBase,
        iconKey: navigation.iconKey || 'layout-dashboard',
        section: navigation.section || 'primary',
        order: navigation.order || module.order || 100,
        moduleKey: module.key,
        state: module.state,
        reason: module.reason,
        readOnly: module.readOnly,
        experimental: module.experimental,
        disabled: module.state === 'disabled',
      };
    })
    .filter((item) => item.path)
    .sort((a, b) => a.order - b.order);

  return {
    modules: resolvedModules,
    navigation,
    validation,
  };
}
