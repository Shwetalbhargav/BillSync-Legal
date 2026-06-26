import { packageBoundary } from '../../shared/src/index.js';

export const AUTH_PACKAGE = packageBoundary('@lexora/auth', ['sessions', 'cookies', 'identity']);
