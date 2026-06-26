import { packageBoundary } from '../../shared/src/index.js';

export const INTEGRATIONS_PACKAGE = packageBoundary('@lexora/integrations', ['provider-connections', 'sync-logs', 'webhooks']);
