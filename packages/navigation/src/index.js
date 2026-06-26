export { buildNavigationModel, publicModule, validateModuleDependencies } from '../../module-registry/src/index.js';
import { packageBoundary } from '../../shared/src/index.js';

export const NAVIGATION_PACKAGE = packageBoundary('@lexora/navigation', ['sidebar', 'topbar', 'route-guards']);
