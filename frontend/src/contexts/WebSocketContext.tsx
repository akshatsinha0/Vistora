import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Task } from '../types';
import { authService } from '../services/auth.service';

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribeToTasks: () => void;
  unsubscribeFromTasks: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    // Use relative URL in production, localhost in development
    const WS_URL = import.meta.env.VITE_WS_URL || 
      (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:8080');

    const newSocket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    newSocket.on('task:created', (task: Task) => {
      console.log('Task created event received:', task);
      if (onTaskCreated) {
        onTaskCreated(task);
      }
    });

    newSocket.on('task:updated', (task: Task) => {
      console.log('Task updated event received:', task);
      if (onTaskUpdated) {
        onTaskUpdated(task);
      }
    });

    newSocket.on('task:deleted', (taskId: string) => {
      console.log('Task deleted event received:', taskId);
      if (onTaskDeleted) {
        onTaskDeleted(taskId);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted]);

  const subscribeToTasks = () => {
    if (socket) {
      socket.emit('subscribe:tasks');
      console.log('Subscribed to task updates');
    }
  };

  const unsubscribeFromTasks = () => {
    if (socket) {
      socket.emit('unsubscribe:tasks');
      console.log('Unsubscribed from task updates');
    }
  };

  const value: WebSocketContextType = {
    socket,
    connected,
    subscribeToTasks,
    unsubscribeFromTasks,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};
