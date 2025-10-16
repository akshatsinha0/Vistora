import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection failed');
      }
      return retries * 100;
    },
  },
});

export const redisPubClient = redisClient.duplicate();
export const redisSubClient = redisClient.duplicate();

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisPubClient.on('error', (err) => {
  logger.error('Redis pub client error:', err);
});

redisSubClient.on('error', (err) => {
  logger.error('Redis sub client error:', err);
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    await redisPubClient.connect();
    await redisSubClient.connect();
    logger.info('Redis connections established successfully');
  } catch (error) {
    logger.error('Unable to connect to Redis:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    await redisPubClient.quit();
    await redisSubClient.quit();
    logger.info('Redis connections closed');
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }
};
