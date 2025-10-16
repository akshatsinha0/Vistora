import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { taskService, TaskFilters } from '../services/task.service';
import { logger } from '../utils/logger';
import { TaskStatus, TaskPriority } from '../models/Task';
import { broadcastTaskCreated, broadcastTaskUpdated, broadcastTaskDeleted } from '../websocket/socket';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;

    if (!title) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Title is required',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    if (!req.userId) {
      res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const task = await taskService.createTask({
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assigneeId: assigneeId || null,
      creatorId: req.userId,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    logger.info('Task created', {
      userId: req.userId,
      taskId: task.id,
      action: 'create_task',
    });

    await broadcastTaskCreated(task);

    res.status(201).json(task);
  } catch (error) {
    logger.error('Create task error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create task',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters: TaskFilters = {};

    if (req.query.status) {
      filters.status = req.query.status as TaskStatus;
    }

    if (req.query.priority) {
      filters.priority = req.query.priority as TaskPriority;
    }

    if (req.query.assigneeId) {
      filters.assigneeId = req.query.assigneeId as string;
    }

    if (req.query.creatorId) {
      filters.creatorId = req.query.creatorId as string;
    }

    const tasks = await taskService.listTasks(filters);

    res.status(200).json(tasks);
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve tasks',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await taskService.getTaskById(id);

    res.status(200).json(task);
  } catch (error: any) {
    if (error.message === 'Task not found') {
      res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Task not found',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    logger.error('Get task error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve task',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigneeId, dueDate } = req.body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await taskService.updateTask(id, updateData);

    logger.info('Task updated', {
      userId: req.userId,
      taskId: task.id,
      action: 'update_task',
    });

    await broadcastTaskUpdated(task);

    res.status(200).json(task);
  } catch (error: any) {
    if (error.message === 'Task not found') {
      res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Task not found',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    logger.error('Update task error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update task',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await taskService.deleteTask(id);

    logger.info('Task deleted', {
      userId: req.userId,
      taskId: id,
      action: 'delete_task',
    });

    await broadcastTaskDeleted(id);

    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Task not found') {
      res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Task not found',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    logger.error('Delete task error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete task',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};
