import { describe, expect, test } from 'vitest';
import {
  can,
  getCurrentUserPermissionSummary,
  scopeMatchesPolicy,
} from '../modules/workspace/services/rbacPolicyService.js';

const USER_ID = '64b000000000000000000001';
const WORKSPACE_ID = '64b0000000000000000000aa';

describe('rbac policy service', () => {
  test('allows a role-template permission through the central can service', async () => {
    const decision = await can(USER_ID, WORKSPACE_ID, 'members.manage', {}, {
      user: { id: USER_ID, role: 'owner', commercialRole: 'owner' },
    });

    expect(decision.allowed).toBe(true);
    expect(decision.source).toBe('role');
    expect(decision.permissionKey).toBe('members.manage');
  });

  test('denies a missing permission with plain product language', async () => {
    const decision = await can(USER_ID, WORKSPACE_ID, 'finance.write', { financial: true }, {
      user: { id: USER_ID, role: 'accountant', commercialRole: 'accountant' },
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('You do not have access to this area.');
  });

  test('policy scopes support assigned matter, department, office, practice group, workspace, and financial-only concepts', () => {
    expect(scopeMatchesPolicy({
      policy: { scope: 'workspace' },
      userId: USER_ID,
      resource: {},
    })).toBe(true);

    expect(scopeMatchesPolicy({
      policy: { scope: 'assigned_matter' },
      userId: USER_ID,
      resource: { assignedUserIds: [USER_ID] },
    })).toBe(true);

    expect(scopeMatchesPolicy({
      policy: { scope: 'department', conditions: { departmentKeys: ['litigation'] } },
      userId: USER_ID,
      user: { departmentKey: 'litigation' },
      resource: {},
    })).toBe(true);

    expect(scopeMatchesPolicy({
      policy: { scope: 'office', conditions: { officeKeys: ['mumbai'] } },
      userId: USER_ID,
      resource: { officeKey: 'mumbai' },
    })).toBe(true);

    expect(scopeMatchesPolicy({
      policy: { scope: 'practice_group', conditions: { practiceGroupKeys: ['disputes'] } },
      userId: USER_ID,
      user: { practiceGroupKey: 'disputes' },
      resource: {},
    })).toBe(true);

    expect(scopeMatchesPolicy({
      policy: { scope: 'financial_only' },
      userId: USER_ID,
      resource: { financialOnly: true },
    })).toBe(true);
  });

  test('current-user permission summary exposes route guard inputs', async () => {
    const summary = await getCurrentUserPermissionSummary({
      userId: USER_ID,
      workspaceId: WORKSPACE_ID,
      user: { id: USER_ID, role: 'billing_assistant', commercialRole: 'billing_assistant' },
    });

    expect(summary.roleKey).toBe('billing_assistant');
    expect(summary.permissions).toContain('finance.write');
    expect(summary.permissions).not.toContain('members.manage');
  });
});
