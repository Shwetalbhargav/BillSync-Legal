import { packageBoundary } from '../../shared/src/index.js';

export const TASKS_PACKAGE = packageBoundary('@lexora/tasks', ['task-records', 'task-assignment', 'task-views']);
