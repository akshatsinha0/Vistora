import { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { User } from '../models/User';
import * as jwtUtils from '../utils/jwt';

jest.mock('../models/User');
jest.mock('../utils/jwt');
jest.mock('../utils/logger');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {
      headers: {},
      path: '/api/tasks',
    };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer validtoken123',
      };

      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'member',
      };

      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'member',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as any, mockResponse as Response, nextFunction);

      expect(jwtUtils.verifyToken).toHaveBeenCalledWith('validtoken123');
      expect(User.findByPk).toHaveBeenCalledWith('user123');
      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual(mockUser);
      expect((mockRequest as any).userId).toBe('user123');
    });

    it('should return 401 if no token provided', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as any, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTH_TOKEN_MISSING',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalidtoken',
      };

      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as any, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTH_TOKEN_INVALID',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer validtoken123',
      };

      const mockPayload = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'member',
      };

      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockPayload);
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await authenticate(mockRequest as any, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access for authorized role', () => {
      (mockRequest as any).userRole = 'admin';

      const middleware = requireRole(['admin']);
      middleware(mockRequest as any, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      (mockRequest as any).userRole = 'member';

      const middleware = requireRole(['admin']);
      middleware(mockRequest as any, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTH_FORBIDDEN',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny access if no role set', () => {
      const middleware = requireRole(['admin']);
      middleware(mockRequest as any, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
