import { describe, expect, test } from 'vitest';
import {
  ENTERPRISE_FEATURE_KEY,
  ENTERPRISE_PERMISSIONS,
  ENTERPRISE_SETTING_DEFAULTS,
  enterpriseBackendGaps,
  enterpriseFeatureHiddenState,
  getEnterpriseOverview,
  publicEnterpriseSetting,
  publicEnterpriseUnit,
} from '../modules/workspace/services/enterpriseFoundationService.js';

describe('enterprise foundation service', () => {
  test('declares enterprise feature and permission contracts', () => {
    expect(ENTERPRISE_FEATURE_KEY).toBe('enterprise.foundations');
    expect(ENTERPRISE_PERMISSIONS).toEqual({
      read: 'enterprise.read',
      manage: 'enterprise.manage',
      audit: 'enterprise.audit',
    });
    expect(ENTERPRISE_SETTING_DEFAULTS.map((setting) => setting.category)).toEqual([
      'sso',
      'scim',
      'api_keys',
      'webhooks',
      'audit_logs',
      'data_retention',
      'white_label',
      'custom_workflows',
      'custom_roles',
    ]);
  });

  test('hidden state keeps enterprise controls quiet for smaller workspaces', () => {
    const state = enterpriseFeatureHiddenState();
    expect(state.enabled).toBe(false);
    expect(state.state).toBe('hidden');
    expect(state.settings.every((setting) => setting.status === 'not_configured')).toBe(true);
  });

  test('overview falls back to empty configured-safe data when collections are not connected', async () => {
    const overview = await getEnterpriseOverview({ workspaceId: '64b0000000000000000000aa' });
    expect(overview.enabled).toBe(true);
    expect(overview.units).toEqual({ departments: [], offices: [], practiceGroups: [] });
    expect(overview.backendGaps.length).toBeGreaterThan(0);
  });

  test('public mappers avoid exposing secret-bearing fields', () => {
    expect(publicEnterpriseUnit({
      _id: 'unit-1',
      type: 'practice_group',
      key: 'disputes',
      name: 'Disputes',
      status: 'active',
    })).toEqual(expect.objectContaining({
      id: 'unit-1',
      type: 'practice_group',
      key: 'disputes',
      name: 'Disputes',
    }));

    expect(publicEnterpriseSetting({
      category: 'sso',
      status: 'enabled',
      provider: 'saml',
      configuration: { loginUrl: 'https://idp.example.test' },
    })).toEqual(expect.objectContaining({
      category: 'sso',
      displayName: 'Single sign-on',
      status: 'enabled',
      provider: 'saml',
    }));
  });

  test('backend gaps document unfinished enterprise integrations', () => {
    expect(enterpriseBackendGaps().map((gap) => gap.area)).toEqual([
      'Single sign-on',
      'Directory sync',
      'API keys',
      'Webhooks',
      'Custom workflows',
    ]);
  });
});
