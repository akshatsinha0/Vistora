import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Sequelize } from 'sequelize';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { initUserModel } from './models/User';
import { initTaskModel } from './models/Task';

const PORT = process.env.PORT || 8080;

// Global sequelize instance
export let sequelizeInstance: Sequelize;

const startServer = async () => {
  try {
    // Create sequelize instance
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/vistora';
    sequelizeInstance = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
    
    // Initialize models
    initUserModel(sequelizeInstance);
    initTaskModel(sequelizeInstance);
    logger.info('Models initialized successfully');
    
    await sequelizeInstance.authenticate();
    logger.info('Database connection established successfully');
    
    await sequelizeInstance.sync({ alter: true });
    logger.info('Database models synchronized successfully');

    await connectRedis();
    logger.info('Redis connected successfully');

    // Import app after models are initialized
    const { createApp } = await import('./app');
    const { initializeWebSocket } = await import('./websocket/socket');
    
    const app = createApp();
    const httpServer = http.createServer(app);

    initializeWebSocket(httpServer);
    logger.info('WebSocket server initialized');

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
      });
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
