import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../TaskCard';
import { Task } from '../../types';

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    assigneeId: null,
    creatorId: '123',
    dueDate: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it('renders task information', () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('TODO')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const editButton = screen.getAllByRole('button')[0];
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const deleteButton = screen.getAllByRole('button')[1];
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('displays assignee name when present', () => {
    const taskWithAssignee: Task = {
      ...mockTask,
      assignee: {
        id: '456',
        email: 'assignee@example.com',
        name: 'John Doe',
        role: 'member',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    };

    render(<TaskCard task={taskWithAssignee} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(/Assigned to: John Doe/i)).toBeInTheDocument();
  });

  it('displays creator name when present', () => {
    const taskWithCreator: Task = {
      ...mockTask,
      creator: {
        id: '123',
        email: 'creator@example.com',
        name: 'Jane Smith',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    };

    render(<TaskCard task={taskWithCreator} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText(/Created by: Jane Smith/i)).toBeInTheDocument();
  });
});
