// test/unit/controllers/authController.test.js
import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true)
  }
}));

jest.unstable_mockModule('../../../node/utils/jwtHelper.js', () => ({
  signToken: jest.fn().mockReturnValue('mock-jwt-token')
}));

jest.unstable_mockModule('../../../node/repositories/mysql/userRepository.js', () => ({
  default: {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    updatePasswordByEmail: jest.fn()
  }
}));

jest.unstable_mockModule('../../../node/services/notificationService.js', () => ({
  sendEmailOTP: jest.fn().mockResolvedValue({ otp: '123456' }),
  sendSmsOTP: jest.fn().mockResolvedValue({ otp: '654321' }),
  verifyOTP: jest.fn().mockReturnValue({ valid: true })
}));

describe('Auth Controller', () => {
  let authController;
  let mockReq, mockRes;
  let bcrypt, userRepository, notificationService;

  beforeAll(async () => {
    // Import after mocking
    authController = await import('../../../node/controllers/authController.js');
    bcrypt = (await import('bcryptjs')).default;
    userRepository = (await import('../../../node/repositories/mysql/userRepository.js')).default;
    notificationService = await import('../../../node/services/notificationService.js');
  });

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  test('should export auth controller functions', () => {
    expect(typeof authController.initiateSignup).toBe('function');
    expect(typeof authController.completeSignup).toBe('function');
    expect(typeof authController.login).toBe('function');
    expect(typeof authController.logout).toBe('function');
    expect(typeof authController.forgotPassword).toBe('function');
    expect(typeof authController.resetPassword).toBe('function');
  });

  describe('initiateSignup', () => {
    test('should successfully initiate signup for rider', async () => {
      mockReq.body = {
        full_name: 'Test User',
        phone: '1234567890',
        email: 'test@example.com',
        role: 'rider',
        password: 'password123'
      };

      userRepository.findByEmail.mockResolvedValue(null); // Email not in use

      await authController.initiateSignup(mockReq, mockRes);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(notificationService.sendEmailOTP).toHaveBeenCalledWith('test@example.com');
      expect(notificationService.sendSmsOTP).toHaveBeenCalledWith('1234567890', 'test@example.com');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "OTP sent to email (both copies for demo)",
        emailOtp: '123456',
        phoneOtp: '654321'
      }));
    });

    test('should require license for driver role', async () => {
      mockReq.body = {
        full_name: 'Test Driver',
        phone: '1234567890',
        email: 'driver@example.com',
        role: 'driver',
        password: 'password123'
        // Missing license
      };

      await authController.initiateSignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "License number is required for drivers"
      });
    });

    test('should reject if email already exists', async () => {
      mockReq.body = {
        full_name: 'Test User',
        phone: '1234567890',
        email: 'existing@example.com',
        role: 'rider',
        password: 'password123'
      };

      userRepository.findByEmail.mockResolvedValue({ id: 1 }); // Email exists

      await authController.initiateSignup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Email already in use"
      });
    });
  });

  describe('login', () => {
    test('should successfully login valid user', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        user_id: 1,
        full_name: 'Test User',
        role: 'rider',
        password_hash: 'hashedPassword',
        emailVerified: true,
        phoneVerified: true
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await authController.login(mockReq, mockRes);

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockRes.cookie).toHaveBeenCalledWith('token', 'mock-jwt-token', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Login successful",
        user: { user_id: 1, full_name: 'Test User', role: 'rider' }
      });
    });

    test('should reject invalid credentials', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      userRepository.findByEmail.mockResolvedValue(null);

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid credentials"
      });
    });
  });

  describe('logout', () => {
    test('should successfully logout user', async () => {
      await authController.logout(mockReq, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Logged out successfully"
      });
    });
  });
});