import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { requireLegalMutation } from '../../../middleware/commercialPermissions.js';
import { TaskController } from '../controllers/taskController.js';
import {
  validateCreateTask,
  validateListTasks,
  validateTaskId,
  validateUpdateTask,
} from '../validators/taskValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateListTasks, TaskController.list);
router.post('/', requireLegalMutation, validateCreateTask, TaskController.create);
router.get('/:taskId', validateTaskId, TaskController.getById);
router.patch('/:taskId', requireLegalMutation, validateTaskId, validateUpdateTask, TaskController.update);
router.delete('/:taskId', requireLegalMutation, validateTaskId, TaskController.remove);

export default router;
