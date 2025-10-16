import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { createTask, listTasks, getTask, updateTask, deleteTask } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('title').isString().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
    body('description').optional().isString().isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
    body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('assigneeId').optional().isUUID().withMessage('Invalid assignee ID'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
  ]),
  createTask
);

router.get(
  '/',
  validate([
    query('status').optional().isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    query('assigneeId').optional().isUUID().withMessage('Invalid assignee ID'),
    query('creatorId').optional().isUUID().withMessage('Invalid creator ID'),
  ]),
  listTasks
);

router.get(
  '/:id',
  validate([
    param('id').isUUID().withMessage('Invalid task ID'),
  ]),
  getTask
);

router.put(
  '/:id',
  validate([
    param('id').isUUID().withMessage('Invalid task ID'),
    body('title').optional().isString().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
    body('description').optional().isString().isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
    body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('assigneeId').optional().isUUID().withMessage('Invalid assignee ID'),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
  ]),
  updateTask
);

router.delete(
  '/:id',
  validate([
    param('id').isUUID().withMessage('Invalid task ID'),
  ]),
  deleteTask
);

export default router;
