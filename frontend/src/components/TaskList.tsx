import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Task, TaskStatus, TaskPriority, CreateTaskDto, UpdateTaskDto } from '../types';
import { taskService } from '../services/task.service';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const { user, logout } = useAuth();
  const { subscribeToTasks, unsubscribeFromTasks, connected } = useWebSocket();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;

      const data = await taskService.getTasks(filters);
      setTasks(data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load tasks', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    subscribeToTasks();
    return () => {
      unsubscribeFromTasks();
    };
  }, []);

  const handleCreateTask = async (data: CreateTaskDto) => {
    try {
      await taskService.createTask(data);
      setSnackbar({ open: true, message: 'Task created successfully', severity: 'success' });
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create task', severity: 'error' });
    }
  };

  const handleUpdateTask = async (data: UpdateTaskDto) => {
    if (!editingTask) return;

    try {
      await taskService.updateTask(editingTask.id, data);
      setSnackbar({ open: true, message: 'Task updated successfully', severity: 'success' });
      setEditingTask(undefined);
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update task', severity: 'error' });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.deleteTask(id);
      setSnackbar({ open: true, message: 'Task deleted successfully', severity: 'success' });
      fetchTasks();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete task', severity: 'error' });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        padding: 3,
        fontFamily: '"Happy Monkey", system-ui',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
          paddingBottom: 2,
          borderBottom: '2px solid #000000',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Happy Monkey", system-ui',
            color: '#000000',
          }}
        >
          Vistora Tasks
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box
            sx={{
              padding: '4px 8px',
              backgroundColor: connected ? '#00cc00' : '#808080',
              color: '#ffffff',
              fontFamily: '"Happy Monkey", system-ui',
              fontSize: '12px',
              border: '1px solid #000000',
            }}
          >
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </Box>
          <Typography sx={{ fontFamily: '"Happy Monkey", system-ui', color: '#000000' }}>
            {user?.name}
          </Typography>
          <Button
            onClick={logout}
            sx={{
              color: '#000000',
              borderColor: '#000000',
              fontFamily: '"Happy Monkey", system-ui',
              border: '2px solid #000000',
              '&:hover': {
                borderColor: '#000000',
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {!showForm && (
        <>
          <Box sx={{ display: 'flex', gap: 2, marginBottom: 3 }}>
            <FormControl
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  fontFamily: '"Happy Monkey", system-ui',
                  '& fieldset': {
                    borderColor: '#000000',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: '"Happy Monkey", system-ui',
                },
              }}
            >
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                sx={{ fontFamily: '"Happy Monkey", system-ui' }}
              >
                <MenuItem value="" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  All
                </MenuItem>
                <MenuItem value="todo" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  To Do
                </MenuItem>
                <MenuItem value="in_progress" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  In Progress
                </MenuItem>
                <MenuItem value="review" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  Review
                </MenuItem>
                <MenuItem value="done" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  Done
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  fontFamily: '"Happy Monkey", system-ui',
                  '& fieldset': {
                    borderColor: '#000000',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontFamily: '"Happy Monkey", system-ui',
                },
              }}
            >
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
                sx={{ fontFamily: '"Happy Monkey", system-ui' }}
              >
                <MenuItem value="" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  All
                </MenuItem>
                <MenuItem value="low" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  Low
                </MenuItem>
                <MenuItem value="medium" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  Medium
                </MenuItem>
                <MenuItem value="high" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  High
                </MenuItem>
                <MenuItem value="urgent" sx={{ fontFamily: '"Happy Monkey", system-ui' }}>
                  Urgent
                </MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
              sx={{
                backgroundColor: '#ff6600',
                color: '#ffffff',
                fontFamily: '"Happy Monkey", system-ui',
                border: '2px solid #000000',
                '&:hover': {
                  backgroundColor: '#ff6600',
                },
              }}
            >
              New Task
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
              <CircularProgress sx={{ color: '#ff6600' }} />
            </Box>
          ) : tasks.length === 0 ? (
            <Typography
              sx={{
                textAlign: 'center',
                padding: 4,
                fontFamily: '"Happy Monkey", system-ui',
                color: '#000000',
              }}
            >
              No tasks found. Create your first task!
            </Typography>
          ) : (
            <Box>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} />
              ))}
            </Box>
          )}
        </>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={handleCancelForm}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            fontFamily: '"Happy Monkey", system-ui',
            border: '1px solid #000000',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
