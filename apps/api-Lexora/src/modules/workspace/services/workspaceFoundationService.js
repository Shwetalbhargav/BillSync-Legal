const now = () => new Date();

export const CORE_FEATURES = [
  {
    key: 'workspace.core',
    name: 'Workspace Core',
    category: 'platform',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'none',
    unavailableMessage: 'Workspace access is not available on the current subscription.',
  },
  {
    key: 'workspace.members',
    name: 'Workspace Members',
    category: 'platform',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'seats',
    unavailableMessage: 'Member management is not included in the current plan.',
  },
  {
    key: 'legal.clients',
    name: 'Clients',
    category: 'legal_work',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'none',
    unavailableMessage: 'Client records are not available on the current plan.',
  },
  {
    key: 'legal.matters',
    name: 'Matters',
    category: 'legal_work',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'none',
    unavailableMessage: 'Matter management is not available on the current plan.',
  },
  {
    key: 'work.capture',
    name: 'Work Capture',
    category: 'work',
    status: 'active',
    gateBehavior: 'read_only',
    usageMetric: 'none',
    unavailableMessage: 'Work capture is read-only until the workspace moves to a plan that includes it.',
  },
  {
    key: 'billing.core',
    name: 'Billing',
    category: 'billing',
    status: 'active',
    gateBehavior: 'read_only',
    usageMetric: 'none',
    unavailableMessage: 'Billing tools are read-only on the current plan.',
  },
  {
    key: 'finance.core',
    name: 'Finance',
    category: 'finance',
    status: 'active',
    gateBehavior: 'read_only',
    usageMetric: 'none',
    unavailableMessage: 'Finance tools are read-only on the current plan.',
  },
  {
    key: 'reports.core',
    name: 'Reports',
    category: 'reporting',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'none',
    unavailableMessage: 'Reports are not included in the current plan.',
  },
  {
    key: 'settings.core',
    name: 'Workspace Settings',
    category: 'settings',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'none',
    unavailableMessage: 'Workspace settings are not available on the current plan.',
  },
  {
    key: 'document.storage',
    name: 'Document Storage',
    category: 'storage',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'storage_gb',
    unavailableMessage: 'Document storage is not included in the current plan.',
  },
  {
    key: 'ai.assistant',
    name: 'AI Assistant',
    category: 'ai',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'ai_credits',
    unavailableMessage: 'AI assistance is not included in the current plan.',
  },
  {
    key: 'ai.matter_qna',
    name: 'Matter Q&A',
    category: 'ai',
    status: 'active',
    gateBehavior: 'disable',
    usageMetric: 'ai_credits',
    unavailableMessage: 'Matter Q&A is not included in the current plan.',
  },
  {
    key: 'integrations.zoho',
    name: 'Zoho Integration',
    category: 'integrations',
    status: 'active',
    gateBehavior: 'hide',
    usageMetric: 'none',
    unavailableMessage: 'Zoho integration is not included in the current plan.',
  },
  {
    key: 'court.sync',
    name: 'Court Sync',
    category: 'integrations',
    status: 'active',
    gateBehavior: 'hide',
    usageMetric: 'none',
    unavailableMessage: 'Court sync is not included in the current plan.',
  },
  {
    key: 'analytics.insights',
    name: 'Analytics',
    category: 'analytics',
    status: 'active',
    gateBehavior: 'hide',
    usageMetric: 'none',
    unavailableMessage: 'Analytics are not included in the current plan.',
  },
  {
    key: 'people.operations',
    name: 'People Operations',
    category: 'operations',
    status: 'active',
    gateBehavior: 'hide',
    usageMetric: 'none',
    unavailableMessage: 'People operations are not included in the current plan.',
  },
];

export const CORE_PERMISSIONS = [
  { key: 'workspace.read', name: 'View workspace', moduleKey: 'settings', action: 'read', resource: 'workspace' },
  { key: 'workspace.manage', name: 'Manage workspace', moduleKey: 'settings', action: 'manage', resource: 'workspace' },
  { key: 'members.manage', name: 'Manage members', moduleKey: 'settings', action: 'manage', resource: 'member' },
  { key: 'roles.read', name: 'View roles', moduleKey: 'settings', action: 'read', resource: 'role' },
  { key: 'roles.manage', name: 'Manage roles', moduleKey: 'settings', action: 'manage', resource: 'role' },
  { key: 'policies.read', name: 'View policies', moduleKey: 'settings', action: 'read', resource: 'policy' },
  { key: 'policies.manage', name: 'Manage policies', moduleKey: 'settings', action: 'manage', resource: 'policy' },
  { key: 'subscription.read', name: 'View subscription', moduleKey: 'settings', action: 'read', resource: 'subscription' },
  { key: 'features.manage', name: 'Manage feature access', moduleKey: 'settings', action: 'manage', resource: 'feature' },
  { key: 'clients.read', name: 'View clients', moduleKey: 'clients', action: 'read', resource: 'client' },
  { key: 'clients.write', name: 'Manage clients', moduleKey: 'clients', action: 'write', resource: 'client' },
  { key: 'matters.read', name: 'View matters', moduleKey: 'matters', action: 'read', resource: 'matter' },
  { key: 'matters.write', name: 'Manage matters', moduleKey: 'matters', action: 'write', resource: 'matter' },
  { key: 'work.write', name: 'Record work', moduleKey: 'work', action: 'write', resource: 'work' },
  { key: 'billing.write', name: 'Manage billing', moduleKey: 'billing', action: 'write', resource: 'billing' },
  { key: 'finance.read', name: 'View finance', moduleKey: 'finance', action: 'read', resource: 'finance' },
  { key: 'finance.write', name: 'Manage finance', moduleKey: 'finance', action: 'write', resource: 'finance' },
  { key: 'reports.read', name: 'View reports', moduleKey: 'reports', action: 'read', resource: 'report' },
];

export const CORE_ROLES = [
  {
    key: 'owner',
    name: 'Owner',
    status: 'active',
    permissionKeys: CORE_PERMISSIONS.map((permission) => permission.key),
  },
  {
    key: 'lawyer',
    name: 'Lawyer',
    status: 'active',
    permissionKeys: ['workspace.read', 'clients.read', 'clients.write', 'matters.read', 'matters.write', 'work.write', 'billing.write'],
  },
  {
    key: 'billing_assistant',
    name: 'Billing Assistant',
    status: 'active',
    permissionKeys: ['workspace.read', 'clients.read', 'billing.write', 'finance.read', 'finance.write', 'reports.read'],
  },
  {
    key: 'accountant',
    name: 'Accountant',
    status: 'active',
    permissionKeys: ['workspace.read', 'finance.read', 'reports.read'],
  },
];

export const CORE_MODULES = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/dashboard',
    requiredPlanKey: 'free',
    featureKeys: ['workspace.core'],
    permissionKeys: ['workspace.read'],
    dependencies: [],
    navigation: { label: 'Dashboard', path: '/app/dashboard', iconKey: 'layout-dashboard', section: 'primary', order: 10 },
    order: 10,
  },
  {
    key: 'clients',
    name: 'Clients',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/clients',
    requiredPlanKey: 'free',
    featureKeys: ['legal.clients'],
    permissionKeys: ['clients.read'],
    dependencies: ['dashboard'],
    navigation: { label: 'Clients', path: '/app/clients', iconKey: 'users', section: 'primary', order: 20 },
    order: 20,
  },
  {
    key: 'matters',
    name: 'Matters',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/matters',
    requiredPlanKey: 'free',
    featureKeys: ['legal.matters'],
    permissionKeys: ['matters.read'],
    dependencies: ['clients'],
    navigation: { label: 'Matters', path: '/app/matters', iconKey: 'briefcase-business', section: 'primary', order: 30 },
    order: 30,
  },
  {
    key: 'tasks',
    name: 'Tasks',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/tasks',
    requiredPlanKey: 'free',
    featureKeys: ['legal.matters'],
    permissionKeys: ['matters.read'],
    dependencies: ['matters'],
    navigation: { label: 'Tasks', path: '/app/tasks', iconKey: 'check-square', section: 'primary', order: 35 },
    order: 35,
  },
  {
    key: 'work',
    name: 'Work',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/work-meter',
    requiredPlanKey: 'solo',
    featureKeys: ['work.capture'],
    permissionKeys: ['work.write'],
    dependencies: ['matters'],
    navigation: { label: 'Work', path: '/app/work-meter', iconKey: 'timer', section: 'primary', order: 40 },
    order: 40,
  },
  {
    key: 'billing',
    name: 'Billing',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/billables',
    requiredPlanKey: 'solo',
    featureKeys: ['billing.core'],
    permissionKeys: ['billing.write'],
    dependencies: ['clients', 'matters'],
    navigation: { label: 'Billing', path: '/app/billables', iconKey: 'circle-dollar-sign', section: 'primary', order: 50 },
    order: 50,
  },
  {
    key: 'finance',
    name: 'Finance',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/finance',
    requiredPlanKey: 'professional',
    featureKeys: ['finance.core'],
    permissionKeys: ['finance.read'],
    dependencies: ['billing'],
    navigation: { label: 'Finance', path: '/app/finance', iconKey: 'wallet-cards', section: 'primary', order: 60 },
    order: 60,
  },
  {
    key: 'reports',
    name: 'Reports',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/reports',
    requiredPlanKey: 'solo',
    featureKeys: ['reports.core'],
    permissionKeys: ['reports.read'],
    dependencies: ['dashboard'],
    navigation: { label: 'Reports', path: '/app/reports', iconKey: 'file-text', section: 'primary', order: 70 },
    order: 70,
  },
  {
    key: 'settings',
    name: 'Settings',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/settings',
    requiredPlanKey: 'free',
    featureKeys: ['settings.core', 'workspace.members'],
    permissionKeys: ['workspace.manage'],
    dependencies: ['dashboard'],
    navigation: { label: 'Settings', path: '/app/settings', iconKey: 'settings', section: 'workspace', order: 80 },
    order: 80,
  },
  {
    key: 'documents',
    name: 'Documents',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/storage',
    requiredPlanKey: 'solo',
    featureKeys: ['document.storage'],
    permissionKeys: ['matters.read'],
    dependencies: ['matters'],
    navigation: { label: 'Documents', path: '/app/document-storage', iconKey: 'database-backup', section: 'primary', order: 90 },
    order: 90,
  },
  {
    key: 'ai',
    name: 'AI Assistant',
    status: 'active',
    state: 'experimental',
    routeBase: '/app/ai',
    requiredPlanKey: 'solo',
    featureKeys: ['ai.assistant'],
    permissionKeys: ['workspace.read'],
    dependencies: ['dashboard'],
    navigation: { label: 'AI Assistant', path: '/app/assistant', iconKey: 'bot', section: 'primary', order: 100 },
    order: 100,
  },
  {
    key: 'integrations',
    name: 'Integrations',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/integrations',
    requiredPlanKey: 'business',
    featureKeys: ['integrations.zoho'],
    permissionKeys: ['workspace.manage'],
    dependencies: ['settings'],
    navigation: { label: 'Integrations', path: '/app/integrations', iconKey: 'plug', section: 'workspace', order: 110 },
    order: 110,
  },
  {
    key: 'court-sync',
    name: 'Court Sync',
    status: 'active',
    state: 'experimental',
    routeBase: '/app/court-sync',
    requiredPlanKey: 'business',
    featureKeys: ['court.sync'],
    permissionKeys: ['matters.read'],
    dependencies: ['matters', 'work'],
    navigation: { label: 'Court Sync', path: '/app/court-sync', iconKey: 'gavel', section: 'primary', order: 120 },
    order: 120,
  },
  {
    key: 'analytics',
    name: 'Analytics',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/analytics',
    requiredPlanKey: 'business',
    featureKeys: ['analytics.insights'],
    permissionKeys: ['reports.read'],
    dependencies: ['reports', 'finance'],
    navigation: { label: 'Analytics', path: '/app/analytics', iconKey: 'bar-chart-3', section: 'primary', order: 130 },
    order: 130,
  },
  {
    key: 'people',
    name: 'People Operations',
    status: 'active',
    state: 'enabled',
    routeBase: '/app/people',
    requiredPlanKey: 'enterprise',
    featureKeys: ['people.operations'],
    permissionKeys: ['workspace.manage'],
    dependencies: ['settings'],
    navigation: { label: 'People', path: '/app/people', iconKey: 'users', section: 'workspace', order: 140 },
    order: 140,
  },
];

export const CORE_PLANS = [
  {
    key: 'free',
    name: 'Free',
    status: 'active',
    featureKeys: ['workspace.core', 'legal.clients', 'legal.matters', 'settings.core'],
    moduleKeys: ['dashboard', 'clients', 'matters', 'tasks', 'settings'],
    limits: { members: 1, workspaces: 1, storageGb: 1, aiCredits: 0 },
    usage: { seats: 1, storageGb: 1, aiCredits: 0 },
    price: { currency: 'INR', amountPaise: 0, interval: 'month' },
    metadata: { catalogOrder: 10, public: true },
  },
  {
    key: 'solo',
    name: 'Solo',
    status: 'active',
    featureKeys: ['workspace.core', 'legal.clients', 'legal.matters', 'work.capture', 'billing.core', 'reports.core', 'settings.core', 'document.storage', 'ai.assistant'],
    moduleKeys: ['dashboard', 'clients', 'matters', 'tasks', 'work', 'billing', 'reports', 'settings', 'documents', 'ai'],
    limits: { members: 1, workspaces: 1, storageGb: 5, aiCredits: 100 },
    usage: { seats: 1, storageGb: 5, aiCredits: 100 },
    price: { currency: 'INR', amountPaise: 149900, interval: 'month' },
    metadata: { catalogOrder: 20, public: true },
  },
  {
    key: 'professional',
    name: 'Professional',
    status: 'active',
    featureKeys: ['workspace.core', 'workspace.members', 'legal.clients', 'legal.matters', 'work.capture', 'billing.core', 'finance.core', 'reports.core', 'settings.core', 'document.storage', 'ai.assistant'],
    moduleKeys: ['dashboard', 'clients', 'matters', 'tasks', 'work', 'billing', 'finance', 'reports', 'settings', 'documents', 'ai'],
    limits: { members: 5, workspaces: 1, storageGb: 25, aiCredits: 500 },
    usage: { seats: 5, storageGb: 25, aiCredits: 500 },
    price: { currency: 'INR', amountPaise: 499900, interval: 'month' },
    metadata: { catalogOrder: 30, public: true },
  },
  {
    key: 'business',
    name: 'Business',
    status: 'active',
    featureKeys: ['workspace.core', 'workspace.members', 'legal.clients', 'legal.matters', 'work.capture', 'billing.core', 'finance.core', 'reports.core', 'settings.core', 'document.storage', 'ai.assistant', 'ai.matter_qna', 'integrations.zoho', 'court.sync', 'analytics.insights'],
    moduleKeys: ['dashboard', 'clients', 'matters', 'tasks', 'work', 'billing', 'finance', 'reports', 'settings', 'documents', 'ai', 'integrations', 'court-sync', 'analytics'],
    limits: { members: 15, workspaces: 1, storageGb: 100, aiCredits: 2500 },
    usage: { seats: 15, storageGb: 100, aiCredits: 2500 },
    price: { currency: 'INR', amountPaise: 1299900, interval: 'month' },
    metadata: { catalogOrder: 40, public: true },
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    status: 'active',
    featureKeys: CORE_FEATURES.map((feature) => feature.key),
    moduleKeys: CORE_MODULES.map((module) => module.key),
    limits: { members: 100, workspaces: 10, storageGb: 1000, aiCredits: 25000 },
    usage: { seats: 100, storageGb: 1000, aiCredits: 25000 },
    price: { currency: 'INR', amountPaise: 0, interval: 'pilot' },
    metadata: { catalogOrder: 50, public: false, salesLed: true },
  },
];

export const PLAN_ALIASES = {
  small_workspace: 'professional',
};

export const TENANT_OWNED_COLLECTIONS = [
  { name: 'users', ownershipField: 'firmId' },
  { name: 'admins', ownershipField: 'firmId' },
  { name: 'clients', ownershipField: 'firmId', parents: [{ collection: 'users', localField: 'ownerUserId' }] },
  { name: 'caseassignments', ownershipField: 'firmId', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'activities', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'activitysamples', parents: [{ collection: 'worksessions', localField: 'workSessionId' }, { collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'appusageevents', parents: [{ collection: 'worksessions', localField: 'workSessionId' }, { collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'attendancedays', parent: { collection: 'users', localField: 'userId' } },
  { name: 'billables', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'cases', parent: { collection: 'clients', localField: 'clientId' } },
  { name: 'emailentries', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'cases', localField: 'mappedCaseId' }, { collection: 'clients', localField: 'mappedClientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'holidays', parent: { collection: 'users', localField: 'createdBy' }, optionalParent: true },
  { name: 'idleintervals', parent: { collection: 'worksessions', localField: 'workSessionId' } },
  { name: 'integrationlogs' },
  { name: 'invoices', parent: { collection: 'clients', localField: 'clientId' } },
  { name: 'invoicelines', parent: { collection: 'invoices', localField: 'invoiceId' } },
  { name: 'kpisnapshots', kpiScope: true },
  { name: 'leaverequests', parent: { collection: 'users', localField: 'userId' } },
  { name: 'matterdocuments', parent: { collection: 'cases', localField: 'caseId' } },
  { name: 'payments', parent: { collection: 'invoices', localField: 'invoiceId' } },
  { name: 'ratecards', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'storeddocuments', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'uploadedBy' }] },
  { name: 'tasks', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'assignedTo' }, { collection: 'users', localField: 'createdBy' }] },
  { name: 'timeentries', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'worksessions', parents: [{ collection: 'cases', localField: 'caseId' }, { collection: 'clients', localField: 'clientId' }, { collection: 'users', localField: 'userId' }] },
  { name: 'zohoconnections', parent: { collection: 'users', localField: 'userId' } },
  { name: 'partnerprofiles', parent: { collection: 'users', localField: 'userId' } },
  { name: 'lawyerprofiles', parent: { collection: 'users', localField: 'userId' } },
  { name: 'associateprofiles', parent: { collection: 'users', localField: 'userId' } },
  { name: 'internprofiles', parent: { collection: 'users', localField: 'userId' } },
];

export const CORE_COLLECTIONS = [
  'workspaces',
  'plans',
  'features',
  'permissions',
  'roles',
  'policies',
  'moduleregistries',
  'workspacemodules',
  'workspacefeatureoverrides',
  'subscriptions',
  'memberships',
];

async function collectionExists(db, collectionName) {
  const matches = await db.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
  return matches.length > 0;
}

async function createIndexIfCollectionExists(db, collectionName, keys, options = {}) {
  if (!(await collectionExists(db, collectionName))) return false;
  await db.collection(collectionName).createIndex(keys, options);
  return true;
}

async function dropIndexIfCollectionExists(db, collectionName, indexName) {
  if (!(await collectionExists(db, collectionName))) return false;
  await db.collection(collectionName).dropIndex(indexName).catch((error) => {
    if (error?.codeName !== 'IndexNotFound') throw error;
  });
  return true;
}

async function upsertByKey(collection, doc) {
  const timestamp = now();
  await collection.updateOne(
    { key: doc.key },
    {
      $set: { ...doc, updatedAt: timestamp },
      $setOnInsert: { createdAt: timestamp },
    },
    { upsert: true },
  );
}

export async function ensureWorkspaceFoundationIndexes(db) {
  await db.collection('workspaces').createIndex({ slug: 1 }, { unique: true, sparse: true });
  await db.collection('workspaces').createIndex({ legacyFirmId: 1 }, { unique: true, sparse: true });
  await db.collection('workspaces').createIndex({ status: 1, updatedAt: -1 });
  await db.collection('plans').createIndex({ key: 1 }, { unique: true });
  await db.collection('features').createIndex({ key: 1 }, { unique: true });
  await db.collection('permissions').createIndex({ key: 1 }, { unique: true });
  await db.collection('roles').createIndex({ key: 1 }, { unique: true });
  await db.collection('moduleregistries').createIndex({ key: 1 }, { unique: true });
  await db.collection('subscriptions').createIndex({ workspaceId: 1, status: 1 });
  await db.collection('subscriptions').createIndex({ workspaceId: 1, planKey: 1, status: 1 });
  await db.collection('policies').createIndex({ workspaceId: 1, roleKey: 1, permissionKey: 1 }, { unique: true, sparse: true });
  await db.collection('workspacemodules').createIndex({ workspaceId: 1, moduleKey: 1 }, { unique: true });
  await db.collection('workspacefeatureoverrides').createIndex({ workspaceId: 1, featureKey: 1 }, { unique: true });
  await db.collection('workspacefeatureoverrides').createIndex({ workspaceId: 1, status: 1 });
  await db.collection('memberships').createIndex({ workspaceId: 1, userId: 1 }, { unique: true, sparse: true });
  await db.collection('memberships').createIndex({ workspaceId: 1, role: 1, status: 1 });

  await dropIndexIfCollectionExists(db, 'invoices', 'workspaceId_1_invoiceNumber_1');
  await createIndexIfCollectionExists(
    db,
    'invoices',
    { workspaceId: 1, invoiceNumber: 1 },
    { unique: true, partialFilterExpression: { invoiceNumber: { $exists: true, $type: 'string' } } },
  );
  await dropIndexIfCollectionExists(db, 'payments', 'workspaceId_1_idempotencyKey_1');
  await createIndexIfCollectionExists(
    db,
    'payments',
    { workspaceId: 1, idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true, $type: 'string' } } },
  );
  await dropIndexIfCollectionExists(db, 'payments', 'workspaceId_1_receiptNumber_1');
  await createIndexIfCollectionExists(
    db,
    'payments',
    { workspaceId: 1, receiptNumber: 1 },
    { unique: true, partialFilterExpression: { receiptNumber: { $exists: true, $type: 'string' } } },
  );

  for (const item of TENANT_OWNED_COLLECTIONS) {
    await createIndexIfCollectionExists(db, item.name, { workspaceId: 1, updatedAt: -1 });
  }
}

export async function seedCorePlatformData(db) {
  for (const feature of CORE_FEATURES) await upsertByKey(db.collection('features'), feature);
  for (const permission of CORE_PERMISSIONS) await upsertByKey(db.collection('permissions'), permission);
  for (const role of CORE_ROLES) await upsertByKey(db.collection('roles'), role);
  for (const module of CORE_MODULES) await upsertByKey(db.collection('moduleregistries'), module);
  for (const plan of CORE_PLANS) await upsertByKey(db.collection('plans'), plan);

  return {
    features: CORE_FEATURES.length,
    permissions: CORE_PERMISSIONS.length,
    roles: CORE_ROLES.length,
    modules: CORE_MODULES.length,
    plans: CORE_PLANS.length,
  };
}

function slugFromName(name, fallback) {
  const slug = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `workspace-${String(fallback).slice(-6)}`;
}

export async function backfillWorkspacesFromFirms(db) {
  const firms = await db.collection('firms').find({}).toArray();
  let upserted = 0;

  for (const firm of firms) {
    const timestamp = now();
    const workspace = {
      name: firm.name,
      slug: slugFromName(firm.name, firm._id),
      status: 'active',
      legacyFirmId: firm._id,
      timezone: firm.timezone || 'Asia/Kolkata',
      currency: firm.currency || 'INR',
      contact: firm.contact || {},
      address: firm.address || {},
      taxSettings: firm.taxSettings || {},
      billingPreferences: firm.billingPreferences || {},
      onboarding: firm.onboarding || {},
      workReview: firm.workReview || {},
      limits: { members: Number(firm.memberLimit || 5) },
      updatedAt: timestamp,
    };

    const result = await db.collection('workspaces').updateOne(
      { _id: firm._id },
      { $set: workspace, $setOnInsert: { createdAt: firm.createdAt || timestamp } },
      { upsert: true },
    );
    if (result.upsertedCount || result.modifiedCount) upserted += 1;
  }

  return upserted;
}

export async function ensureWorkspacesForExistingWorkspaceIds(db) {
  const workspaceIds = new Map();
  for (const item of TENANT_OWNED_COLLECTIONS) {
    if (!(await collectionExists(db, item.name))) continue;
    const rows = await db.collection(item.name).distinct('workspaceId', { workspaceId: { $exists: true, $ne: null } });
    rows.forEach((workspaceId) => workspaceIds.set(String(workspaceId), workspaceId));
  }

  let created = 0;
  for (const [workspaceIdText, workspaceId] of workspaceIds) {
    const existing = await db.collection('workspaces').findOne({ _id: workspaceId });
    if (existing) continue;
    const timestamp = now();
    await db.collection('workspaces').updateOne(
      { _id: workspaceId },
      {
        $setOnInsert: {
          _id: workspaceId,
          name: `Workspace ${workspaceIdText.slice(-6)}`,
          slug: `workspace-${workspaceIdText.slice(-6)}`,
          status: 'active',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          limits: { members: 5 },
          metadata: { createdBy: 'workspace-foundation-migration', reason: 'existing workspaceId without legacy firm row' },
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      { upsert: true },
    );
    created += 1;
  }

  return created;
}

export async function backfillWorkspaceIds(db) {
  const results = {};

  for (const item of TENANT_OWNED_COLLECTIONS) {
    if (!(await collectionExists(db, item.name))) continue;
    const collection = db.collection(item.name);
    const result = { direct: 0, fromParent: 0 };

    if (item.ownershipField) {
      const updateResult = await collection.updateMany(
        { workspaceId: { $exists: false }, [item.ownershipField]: { $exists: true, $ne: null } },
        [{ $set: { workspaceId: `$${item.ownershipField}` } }],
      );
      result.direct = updateResult.modifiedCount;
    }

    if (item.kpiScope) {
      const firmScopeResult = await collection.updateMany(
        { workspaceId: { $exists: false }, scope: 'firm', scopeId: { $exists: true, $ne: null } },
        [{ $set: { workspaceId: '$scopeId' } }],
      );
      result.direct += firmScopeResult.modifiedCount;
    }

    if (result.direct) results[item.name] = result;
  }

  for (let pass = 0; pass < 8; pass += 1) {
    let updatedThisPass = 0;
    for (const item of TENANT_OWNED_COLLECTIONS) {
      if (!(await collectionExists(db, item.name))) continue;
      const collection = db.collection(item.name);
      const result = results[item.name] || { direct: 0, fromParent: 0 };
      const parents = item.parents || (item.parent ? [item.parent] : []);
      if (item.kpiScope) {
        parents.push(
          { collection: 'users', localField: 'scopeId', scope: 'user' },
          { collection: 'clients', localField: 'scopeId', scope: 'client' },
          { collection: 'cases', localField: 'scopeId', scope: 'case' },
        );
      }

      for (const parentRef of parents) {
        const filter = {
          workspaceId: { $exists: false },
          [parentRef.localField]: { $exists: true, $ne: null },
        };
        if (parentRef.scope) filter.scope = parentRef.scope;

      const rows = await collection.find({
          ...filter,
      }).toArray();

      for (const row of rows) {
          const parent = await db.collection(parentRef.collection).findOne(
            { _id: row[parentRef.localField], workspaceId: { $exists: true, $ne: null } },
          { projection: { workspaceId: 1 } },
        );
        if (!parent?.workspaceId) continue;
        await collection.updateOne({ _id: row._id }, { $set: { workspaceId: parent.workspaceId } });
        result.fromParent += 1;
          updatedThisPass += 1;
        }
      }

      if (result.direct || result.fromParent) results[item.name] = result;
    }

    if (!updatedThisPass) break;
  }

  return results;
}

export async function ensureWorkspaceSubscriptionsAndModules(db) {
  const workspaces = await db.collection('workspaces').find({ status: { $ne: 'archived' } }).toArray();
  let subscriptions = 0;
  let modules = 0;

  for (const workspace of workspaces) {
    const timestamp = now();
    const memberLimit = Number(workspace.limits?.members || 5);
    const planKey = memberLimit <= 1 ? 'solo' : 'professional';
    const plan = CORE_PLANS.find((entry) => entry.key === planKey) || CORE_PLANS.find((entry) => entry.key === 'professional');

    const subscriptionResult = await db.collection('subscriptions').updateOne(
      { workspaceId: workspace._id, status: 'active' },
      {
        $set: {
          planKey,
          source: 'migration',
          featureKeysSnapshot: plan.featureKeys,
          moduleKeysSnapshot: plan.moduleKeys,
          limitsSnapshot: plan.limits,
          updatedAt: timestamp,
        },
        $setOnInsert: { createdAt: timestamp, startedAt: timestamp },
      },
      { upsert: true },
    );
    if (subscriptionResult.upsertedCount || subscriptionResult.modifiedCount) subscriptions += 1;

    for (const moduleKey of plan.moduleKeys) {
      const moduleResult = await db.collection('workspacemodules').updateOne(
        { workspaceId: workspace._id, moduleKey },
        {
          $set: { status: 'enabled', source: 'plan', updatedAt: timestamp },
          $setOnInsert: { createdAt: timestamp, enabledAt: timestamp },
        },
        { upsert: true },
      );
      if (moduleResult.upsertedCount || moduleResult.modifiedCount) modules += 1;
    }
  }

  return { subscriptions, modules };
}

export async function validateWorkspaceFoundation(db) {
  const missingCollections = [];
  for (const name of CORE_COLLECTIONS) {
    if (!(await collectionExists(db, name))) missingCollections.push(name);
  }

  const missingWorkspaceId = {};
  const orphanedWorkspaceId = {};
  for (const item of TENANT_OWNED_COLLECTIONS) {
    if (!(await collectionExists(db, item.name))) continue;
    const collection = db.collection(item.name);
    const missing = await collection.countDocuments({ workspaceId: { $exists: false } });
    if (missing) missingWorkspaceId[item.name] = missing;

    const rows = await collection.find(
      { workspaceId: { $exists: true, $ne: null } },
      { projection: { workspaceId: 1 } },
    ).toArray();
    let orphaned = 0;
    for (const row of rows) {
      const workspace = await db.collection('workspaces').findOne({ _id: row.workspaceId }, { projection: { _id: 1 } });
      if (!workspace) orphaned += 1;
    }
    if (orphaned) orphanedWorkspaceId[item.name] = orphaned;
  }

  const catalogCounts = {};
  for (const name of ['plans', 'features', 'permissions', 'roles', 'moduleregistries']) {
    catalogCounts[name] = (await collectionExists(db, name)) ? await db.collection(name).countDocuments({}) : 0;
  }

  return {
    ok: !missingCollections.length
      && !Object.keys(missingWorkspaceId).length
      && !Object.keys(orphanedWorkspaceId).length
      && Object.values(catalogCounts).every((count) => count > 0),
    missingCollections,
    missingWorkspaceId,
    orphanedWorkspaceId,
    catalogCounts,
  };
}
