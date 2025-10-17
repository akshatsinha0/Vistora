import { TaskService } from '../services/task.service';
import { Task } from '../models/Task';

jest.mock('../models/Task');
jest.mock('../models/User');

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo' as const,
        priority: 'medium' as const,
        creatorId: 'user123',
      };

      const mockTask = {
        id: 'task123',
        ...taskData,
      };

      (Task.create as jest.Mock).mockResolvedValue(mockTask);
      (Task.findByPk as jest.Mock).mockResolvedValue(mockTask);

      const result = await taskService.createTask(taskData);

      expect(Task.create).toHaveBeenCalledWith(taskData);
      expect(result).toEqual(mockTask);
    });
  });

  describe('getTaskById', () => {
    it('should return task if found', async () => {
      const mockTask = {
        id: 'task123',
        title: 'Test Task',
      };

      (Task.findByPk as jest.Mock).mockResolvedValue(mockTask);

      const result = await taskService.getTaskById('task123');

      expect(Task.findByPk).toHaveBeenCalledWith('task123', expect.any(Object));
      expect(result).toEqual(mockTask);
    });

    it('should throw error if task not found', async () => {
      (Task.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(taskService.getTaskById('nonexistent')).rejects.toThrow('Task not found');
    });
  });

  describe('listTasks', () => {
    it('should return all tasks without filters', async () => {
      const mockTasks = [
        { id: 'task1', title: 'Task 1' },
        { id: 'task2', title: 'Task 2' },
      ];

      (Task.findAll as jest.Mock).mockResolvedValue(mockTasks);

      const result = await taskService.listTasks();

      expect(Task.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
      }));
      expect(result).toEqual(mockTasks);
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [{ id: 'task1', title: 'Task 1', status: 'done' }];

      (Task.findAll as jest.Mock).mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({ status: 'done' });

      expect(Task.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: 'done' },
      }));
      expect(result).toEqual(mockTasks);
    });

    it('should filter tasks by multiple criteria', async () => {
      const mockTasks = [{ id: 'task1', title: 'Task 1' }];

      (Task.findAll as jest.Mock).mockResolvedValue(mockTasks);

      await taskService.listTasks({
        status: 'in_progress',
        priority: 'high',
        assigneeId: 'user123',
      });

      expect(Task.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          status: 'in_progress',
          priority: 'high',
          assigneeId: 'user123',
        },
      }));
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const mockTask = {
        id: 'task123',
        title: 'Old Title',
        update: jest.fn().mockResolvedValue(true),
      };

      const updatedTask = {
        id: 'task123',
        title: 'New Title',
      };

      (Task.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(updatedTask);

      const result = await taskService.updateTask('task123', { title: 'New Title' });

      expect(mockTask.update).toHaveBeenCalledWith({ title: 'New Title' });
      expect(result).toEqual(updatedTask);
    });

    it('should throw error if task not found', async () => {
      (Task.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(taskService.updateTask('nonexistent', { title: 'New' }))
        .rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const mockTask = {
        id: 'task123',
        destroy: jest.fn().mockResolvedValue(true),
      };

      (Task.findByPk as jest.Mock).mockResolvedValue(mockTask);

      await taskService.deleteTask('task123');

      expect(mockTask.destroy).toHaveBeenCalled();
    });

    it('should throw error if task not found', async () => {
      (Task.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(taskService.deleteTask('nonexistent')).rejects.toThrow('Task not found');
    });
  });

  describe('validateTaskOwnership', () => {
    it('should return true if user owns task', async () => {
      const mockTask = {
        id: 'task123',
        creatorId: 'user123',
      };

      (Task.findByPk as jest.Mock).mockResolvedValue(mockTask);

      const result = await taskService.validateTaskOwnership('task123', 'user123');

      expect(result).toBe(true);
    });

    it('should return false if user does not own task', async () => {
      const mockTask = {
        id: 'task123',
        creatorId: 'user123',
      };

      (Task.findByPk as jest.Mock).mockResolvedValue(mockTask);

      const result = await taskService.validateTaskOwnership('task123', 'user456');

      expect(result).toBe(false);
    });

    it('should return false if task not found', async () => {
      (Task.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await taskService.validateTaskOwnership('nonexistent', 'user123');

      expect(result).toBe(false);
    });
  });
});
