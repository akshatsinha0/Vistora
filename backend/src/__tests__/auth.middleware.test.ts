import { Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import * as jwtUtils from '../utils/jwt';

jest.mock('../models/User');
jest.mock('../utils/jwt');
jest.mock('../utils/logger');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();

    mockRequest = {
      headers: {},
      path: '/api/tasks',
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer validToken',
      };

      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'member',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
        sub: 'user123',
        email: 'test@example.com',
      });
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.userId).toBe('user123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTH_TOKEN_MISSING',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalidToken',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTH_TOKEN_INVALID',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer validToken',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue({
        sub: 'user123',
        email: 'test@example.com',
      });
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await authenticate(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access if user has required role', () => {
      mockRequest.userRole = 'admin';

      const middleware = requireRole(['admin']);
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access if user does not have required role', () => {
      mockRequest.userRole = 'member';

      const middleware = requireRole(['admin']);
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTH_FORBIDDEN',
          }),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access if user has one of multiple required roles', () => {
      mockRequest.userRole = 'member';

      const middleware = requireRole(['admin', 'member']);
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
