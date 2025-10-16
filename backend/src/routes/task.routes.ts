import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validateTaskCreation, validateTaskUpdate } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.post('/', validateTaskCreation, createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', validateTaskUpdate, updateTask);
router.delete('/:id', deleteTask);

export default router;
