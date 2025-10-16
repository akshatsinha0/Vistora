import { Request, Response } from 'express';
import { sequelizeInstance } from '../index';
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

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    
    const memoryUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    };

    const dbStartTime = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbResponseTime: number | undefined;

    try {
      if (sequelizeInstance) {
        await sequelizeInstance.authenticate();
        dbStatus = 'connected';
        dbResponseTime = Date.now() - dbStartTime;
      }
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    const redisStartTime = Date.now();
    let redisStatus: 'connected' | 'disconnected' = 'disconnected';
    let redisResponseTime: number | undefined;

    try {
      await redisClient.ping();
      redisStatus = 'connected';
      redisResponseTime = Date.now() - redisStartTime;
    } catch (error) {
      logger.error('Redis health check failed:', error);
    }

    const overallStatus: 'healthy' | 'unhealthy' = 
      dbStatus === 'connected' && redisStatus === 'connected' ? 'healthy' : 'unhealthy';

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory,
      dependencies: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
        redis: {
          status: redisStatus,
          responseTime: redisResponseTime,
        },
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
};
