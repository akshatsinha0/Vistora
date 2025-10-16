import { taskService } from '../services/task.service';
import { Task } from '../models/Task';
import { User } from '../models/User';

jest.mock('../models/Task');
jest.mock('../models/User');
jest.mock('../websocket/socket.handler');
jest.mock('../utils/logger');

describe('Task Service', () => {
  beforeEach(() => {
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
        toJSON: jest.fn().mockReturnValue({ id: 'task123', ...taskData }),
      };

      (Task.create as jest.Mock).mockResolvedValue(mockTask);
      (Task.findByPk as jest.Mock).mockResolvedValue({
        ...mockTask,
        creator: { id: 'user123', name: 'Test User' },
        assignee: null,
      });

      const result = await taskService.createTask(taskData);

      expect(Task.create).toHaveBeenCalledWith(taskData);
      expect(result).toBeDefined();
      expect(result.id).toBe('task123');
    });
  });

  describe('getTaskById', () => {
    it('should return task by id', async () => {
      const mockTask = {
        id: 'task123',
        title: 'Test Task',
        creator: { id: 'user123', name: 'Test User' },
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
    it('should list all tasks without filters', async () => {
      const mockTasks = [
        { id: 'task1', title: 'Task 1' },
        { id: 'task2', title: 'Task 2' },
      ];

      (Task.findAll as jest.Mock).mockResolvedValue(mockTasks);

      const result = await taskService.listTasks();

      expect(Task.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });

    it('should list tasks with status filter', async () => {
      const mockTasks = [{ id: 'task1', title: 'Task 1', status: 'todo' }];

      (Task.findAll as jest.Mock).mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({ status: 'todo' });

      expect(Task.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'todo' }),
        })
      );
      expect(result).toEqual(mockTasks);
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

      await expect(taskService.updateTask('nonexistent', { title: 'New' })).rejects.toThrow('Task not found');
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
});
