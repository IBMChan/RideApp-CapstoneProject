// test/unit/middlewares/validationMiddleware.test.js
import { jest } from '@jest/globals';
import { validateSignup, validateLogin } from '../../../node/middlewares/validationMiddleware.js';

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validateSignup', () => {
    test('should call next() for valid signup data', () => {
      req.body = {
        full_name: 'Test User',
        phone: '1234567890',
        email: 'test@example.com',
        role: 'rider',
        password: 'password123'
      };
      
      validateSignup(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should require license for driver role', () => {
      req.body = {
        full_name: 'Test Driver',
        phone: '1234567890',
        email: 'driver@example.com',
        role: 'driver',
        password: 'password123'
      };
      
      validateSignup(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('License')
        })
      );
    });

    test('should validate required fields', () => {
      req.body = {
        full_name: 'Test User',
        // Missing phone
        email: 'test@example.com',
        role: 'rider',
        password: 'password123'
      };
      
      validateSignup(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required fields'
        })
      );
    });

    test('should validate role', () => {
      req.body = {
        full_name: 'Test User',
        phone: '1234567890',
        email: 'test@example.com',
        role: 'invalid-role',
        password: 'password123'
      };
      
      validateSignup(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid role'
        })
      );
    });
  });

  describe('validateLogin', () => {
    test('should call next() for valid login data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      validateLogin(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should validate required fields', () => {
      req.body = {
        email: 'test@example.com'
        // Missing password
      };
      
      validateLogin(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email and password are required'
        })
      );
    });
  });
});