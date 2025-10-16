import { Task, TaskCreationAttributes, TaskStatus, TaskPriority } from '../models/Task';
import { User } from '../models/User';
import { Op } from 'sequelize';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  creatorId?: string;
}

export class TaskService {
  async createTask(data: TaskCreationAttributes): Promise<Task> {
    const task = await Task.create(data);
    return this.getTaskById(task.id);
  }

  async getTaskById(id: string): Promise<Task> {
    const task = await Task.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async listTasks(filters: TaskFilters = {}): Promise<Task[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters.creatorId) {
      where.creatorId = filters.creatorId;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return tasks;
  }

  async updateTask(id: string, data: Partial<TaskCreationAttributes>): Promise<Task> {
    const task = await Task.findByPk(id);

    if (!task) {
      throw new Error('Task not found');
    }

    await task.update(data);
    return this.getTaskById(id);
  }

  async deleteTask(id: string): Promise<void> {
    const task = await Task.findByPk(id);

    if (!task) {
      throw new Error('Task not found');
    }

    await task.destroy();
  }

  async validateTaskOwnership(taskId: string, userId: string): Promise<boolean> {
    const task = await Task.findByPk(taskId);

    if (!task) {
      return false;
    }

    return task.creatorId === userId;
  }
}

export const taskService = new TaskService();
