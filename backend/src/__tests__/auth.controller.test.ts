import { Request, Response } from 'express';
import { register, login } from '../controllers/auth.controller';
import { User } from '../models/User';
import * as passwordUtils from '../utils/password';
import * as jwtUtils from '../utils/jwt';

jest.mock('../models/User');
jest.mock('../utils/password');
jest.mock('../utils/jwt');
jest.mock('../utils/logger');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {
      body: {},
      path: '/api/auth/register',
    };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({ valid: true });
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashedPassword');
      
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'member',
        }),
      };
      
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('token123');

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        token: 'token123',
        user: expect.objectContaining({
          email: 'test@example.com',
        }),
      });
    });

    it('should return 400 if email is missing', async () => {
      mockRequest.body = {
        password: 'Test1234',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_FAILED',
          }),
        })
      );
    });

    it('should return 400 if password is weak', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      };

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        valid: false,
        message: 'Password too weak',
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 if email already exists', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      };

      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({ valid: true });
      (User.findOne as jest.Mock).mockResolvedValue({ id: '123' });

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Email already registered',
          }),
        })
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Test1234',
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          email: 'test@example.com',
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateToken as jest.Mock).mockReturnValue('token123');

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        token: 'token123',
        user: expect.objectContaining({
          email: 'test@example.com',
        }),
      });
    });

    it('should return 401 if user not found', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Test1234',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'AUTH_CREDENTIALS_INVALID',
          }),
        })
      );
    });

    it('should return 401 if password is incorrect', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });
});
