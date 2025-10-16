import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { redisPubClient, redisSubClient } from '../config/redis';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export let io: Server;

export const initializeWebSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyToken(token);
      socket.userId = payload.sub;
      socket.userEmail = payload.email;

      logger.info('WebSocket authentication successful', {
        userId: socket.userId,
        socketId: socket.id,
      });

      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Client connected', {
      userId: socket.userId,
      socketId: socket.id,
    });

    socket.on('subscribe:tasks', () => {
      socket.join('tasks');
      logger.info('Client subscribed to tasks', {
        userId: socket.userId,
        socketId: socket.id,
      });
    });

    socket.on('unsubscribe:tasks', () => {
      socket.leave('tasks');
      logger.info('Client unsubscribed from tasks', {
        userId: socket.userId,
        socketId: socket.id,
      });
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', {
        userId: socket.userId,
        socketId: socket.id,
      });
    });

    socket.on('error', (error) => {
      logger.error('Socket error:', {
        userId: socket.userId,
        socketId: socket.id,
        error,
      });
    });
  });

  setupRedisSubscription();

  return io;
};

const setupRedisSubscription = async () => {
  try {
    await redisSubClient.subscribe('task:updates', (message) => {
      try {
        const data = JSON.parse(message);
        logger.debug('Broadcasting task update', { event: data.event });

        switch (data.event) {
          case 'created':
            io.to('tasks').emit('task:created', data.task);
            break;
          case 'updated':
            io.to('tasks').emit('task:updated', data.task);
            break;
          case 'deleted':
            io.to('tasks').emit('task:deleted', data.taskId);
            break;
        }
      } catch (error) {
        logger.error('Error processing Redis message:', error);
      }
    });

    logger.info('Redis subscription established for task updates');
  } catch (error) {
    logger.error('Failed to setup Redis subscription:', error);
  }
};

export const broadcastTaskCreated = async (task: any): Promise<void> => {
  try {
    await redisPubClient.publish(
      'task:updates',
      JSON.stringify({ event: 'created', task })
    );
  } catch (error) {
    logger.error('Failed to broadcast task created:', error);
  }
};

export const broadcastTaskUpdated = async (task: any): Promise<void> => {
  try {
    await redisPubClient.publish(
      'task:updates',
      JSON.stringify({ event: 'updated', task })
    );
  } catch (error) {
    logger.error('Failed to broadcast task updated:', error);
  }
};

export const broadcastTaskDeleted = async (taskId: string): Promise<void> => {
  try {
    await redisPubClient.publish(
      'task:updates',
      JSON.stringify({ event: 'deleted', taskId })
    );
  } catch (error) {
    logger.error('Failed to broadcast task deleted:', error);
  }
};
