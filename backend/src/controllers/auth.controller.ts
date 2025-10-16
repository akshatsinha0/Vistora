import { Request, Response } from 'express';
import { User } from '../models/User';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Email, password, and name are required',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid email format',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: passwordValidation.message,
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Email already registered',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email,
      passwordHash,
      name,
      role: 'member',
    });

    const token = generateToken(user);

    logger.info('User registered', {
      userId: user.id,
      email: user.email,
      action: 'register',
    });

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Email and password are required',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({
        error: {
          code: 'AUTH_CREDENTIALS_INVALID',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        error: {
          code: 'AUTH_CREDENTIALS_INVALID',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const token = generateToken(user);

    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      action: 'login',
    });

    res.status(200).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('User logged out', {
      userId: req.userId,
      action: 'logout',
    });

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Logout failed',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    res.status(200).json({
      user: req.user.toJSON(),
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user information',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};
