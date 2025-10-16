import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  todo: '#808080',
  in_progress: '#0066cc',
  review: '#ff6600',
  done: '#00cc00',
};

const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  return (
    <Box
      sx={{
        padding: 2,
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        marginBottom: 2,
        fontFamily: '"Happy Monkey", system-ui',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Happy Monkey", system-ui',
              color: '#000000',
              marginBottom: 1,
            }}
          >
            {task.title}
          </Typography>

          {task.description && (
            <Typography
              variant="body2"
              sx={{
                fontFamily: '"Happy Monkey", system-ui',
                color: '#000000',
                marginBottom: 1,
              }}
            >
              {task.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, marginTop: 1 }}>
            <Box
              sx={{
                padding: '4px 8px',
                backgroundColor: statusColors[task.status],
                color: '#ffffff',
                fontFamily: '"Happy Monkey", system-ui',
                fontSize: '12px',
                border: '1px solid #000000',
              }}
            >
              {task.status.replace('_', ' ').toUpperCase()}
            </Box>

            <Box
              sx={{
                padding: '4px 8px',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: '"Happy Monkey", system-ui',
                fontSize: '12px',
                border: '1px solid #000000',
              }}
            >
              {priorityLabels[task.priority]}
            </Box>
          </Box>

          {task.assignee && (
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Happy Monkey", system-ui',
                color: '#000000',
                display: 'block',
                marginTop: 1,
              }}
            >
              Assigned to: {task.assignee.name}
            </Typography>
          )}

          {task.creator && (
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Happy Monkey", system-ui',
                color: '#000000',
                display: 'block',
              }}
            >
              Created by: {task.creator.name}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => onEdit(task)}
            sx={{
              color: '#ff6600',
              border: '1px solid #000000',
              padding: '4px',
            }}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            onClick={() => onDelete(task.id)}
            sx={{
              color: '#000000',
              border: '1px solid #000000',
              padding: '4px',
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};
