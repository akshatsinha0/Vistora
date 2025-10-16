import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  dependencies: {
    database: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
    };
  };
}

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    
    const dbStatus = await checkDatabase();
    const redisStatus = await checkRedis();
    
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    
    const health: HealthStatus = {
      status: dbStatus.status === 'connected' && redisStatus.status === 'connected' 
        ? 'healthy' 
        : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(usedMemory / 1024 / 1024),
        total: Math.round(totalMemory / 1024 / 1024),
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      dependencies: {
        database: dbStatus,
        redis: redisStatus,
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    if (health.status === 'unhealthy') {
      logger.warn('Health check failed', health);
    }
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
};

async function checkDatabase(): Promise<{ status: 'connected' | 'disconnected'; responseTime?: number }> {
  try {
    const startTime = Date.now();
    await sequelize.authenticate();
    const responseTime = Date.now() - startTime;
    return { status: 'connected', responseTime };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'disconnected' };
  }
}

async function checkRedis(): Promise<{ status: 'connected' | 'disconnected'; responseTime?: number }> {
  try {
    const startTime = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - startTime;
    return { status: 'connected', responseTime };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return { status: 'disconnected' };
  }
}
