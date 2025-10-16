import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { User } from '../models/User';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
  userRole?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'No authentication token provided',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const user = await User.findByPk(payload.sub);

    if (!user) {
      res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Insufficient permissions',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    next();
  };
};
