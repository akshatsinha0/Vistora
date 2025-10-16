import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { redisPubClient, redisSubClient } from '../config/redis';
import { Task } from '../models/Task';

export interface SocketData {
  userId: string;
  email: string;
  role: string;
}

export interface TaskEventData {
  event: 'created' | 'updated' | 'deleted';
  task?: Task;
  taskId?: string;
}

export class WebSocketHandler {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisSubscription();
  }

  private setupMiddleware(): void {
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token missing'));
        }

        const payload = verifyToken(token);
        socket.data = {
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
        } as SocketData;

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const socketData = socket.data as SocketData;
      logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId: socketData.userId,
      });

      socket.on('subscribe:tasks', () => {
        socket.join('tasks');
        logger.info('Client subscribed to tasks', {
          socketId: socket.id,
          userId: socketData.userId,
        });
      });

      socket.on('unsubscribe:tasks', () => {
        socket.leave('tasks');
        logger.info('Client unsubscribed from tasks', {
          socketId: socket.id,
          userId: socketData.userId,
        });
      });

      socket.on('disconnect', () => {
        logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          userId: socketData.userId,
        });
      });

      socket.on('error', (error) => {
        logger.error('WebSocket error:', {
          socketId: socket.id,
          userId: socketData.userId,
          error,
        });
      });
    });
  }

  private setupRedisSubscription(): void {
    redisSubClient.subscribe('task:updates', (message) => {
      try {
        const data: TaskEventData = JSON.parse(message);
        this.broadcastTaskEvent(data);
      } catch (error) {
        logger.error('Error processing Redis message:', error);
      }
    });
  }

  private broadcastTaskEvent(data: TaskEventData): void {
    switch (data.event) {
      case 'created':
        this.io.to('tasks').emit('task:created', data.task);
        break;
      case 'updated':
        this.io.to('tasks').emit('task:updated', data.task);
        break;
      case 'deleted':
        this.io.to('tasks').emit('task:deleted', data.taskId);
        break;
    }
  }

  public async publishTaskEvent(event: 'created' | 'updated' | 'deleted', task?: Task, taskId?: string): Promise<void> {
    try {
      const data: TaskEventData = { event, task, taskId };
      await redisPubClient.publish('task:updates', JSON.stringify(data));
    } catch (error) {
      logger.error('Error publishing task event:', error);
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

let webSocketHandler: WebSocketHandler | null = null;

export const initializeWebSocket = (server: HTTPServer): WebSocketHandler => {
  webSocketHandler = new WebSocketHandler(server);
  return webSocketHandler;
};

export const getWebSocketHandler = (): WebSocketHandler => {
  if (!webSocketHandler) {
    throw new Error('WebSocket handler not initialized');
  }
  return webSocketHandler;
};
