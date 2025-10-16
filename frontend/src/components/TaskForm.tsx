import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, TaskPriority } from '../types';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      status,
      priority,
    });
  };

  return (
    <Box
      sx={{
        padding: 3,
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        fontFamily: '"Happy Monkey", system-ui',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          marginBottom: 3,
          fontFamily: '"Happy Monkey", system-ui',
          color: '#000000',
        }}
      >
        {task ? 'Edit Task' : 'Create New Task'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{
            marginBottom: 2,
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
        />

        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={4}
          sx={{
            marginBottom: 2,
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
        />

        <FormControl
          fullWidth
          sx={{
            marginBottom: 2,
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
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            sx={{ fontFamily: '"Happy Monkey", system-ui' }}
          >
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
          fullWidth
          sx={{
            marginBottom: 3,
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
            value={priority}
            label="Priority"
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            sx={{ fontFamily: '"Happy Monkey", system-ui' }}
          >
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

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            sx={{
              flex: 1,
              backgroundColor: '#ff6600',
              color: '#ffffff',
              fontFamily: '"Happy Monkey", system-ui',
              padding: '10px',
              border: '2px solid #000000',
              '&:hover': {
                backgroundColor: '#ff6600',
              },
            }}
          >
            {task ? 'Update' : 'Create'}
          </Button>

          <Button
            type="button"
            onClick={onCancel}
            variant="outlined"
            sx={{
              flex: 1,
              color: '#000000',
              borderColor: '#000000',
              fontFamily: '"Happy Monkey", system-ui',
              padding: '10px',
              border: '2px solid #000000',
              '&:hover': {
                borderColor: '#000000',
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};
