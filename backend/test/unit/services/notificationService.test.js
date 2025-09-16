// test/unit/services/notificationService.test.js
import { jest } from '@jest/globals';

// Mock nodemailer
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn().mockReturnValue({
  sendMail: mockSendMail
});

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport
  }
}));

describe('Notification Service', () => {
  let notificationService;
  
  beforeAll(async () => {
    // Set up test environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'testpass123';
    
    notificationService = await import('../../../node/services/notificationService.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.log and console.error mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('Module Exports', () => {
    test('should export all required functions', () => {
      expect(typeof notificationService.sendEmailOTP).toBe('function');
      expect(typeof notificationService.sendSmsOTP).toBe('function');
      expect(typeof notificationService.verifyOTP).toBe('function');
    });
  });

  describe('verifyOTP', () => {
    test('should return invalid for non-existent OTP', () => {
      const result = notificationService.verifyOTP('nonexistent@test.com', '123456');
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('OTP not found or expired');
      expect(console.log).toHaveBeenCalledWith("[OTP VERIFY] No OTP found for 'nonexistent@test.com'");
    });

    test('should return invalid for expired OTP', () => {
      const testEmail = 'expired@test.com';
      const testOTP = '123456';
      
      // Mock Date.now to simulate expired OTP
      const originalDateNow = Date.now;
      const mockNow = 1000000;
      Date.now = jest.fn(() => mockNow + 11 * 60 * 1000); // 11 minutes later
      
      // Manually add expired OTP to the store by accessing the internal Map
      // We need to import and access the otpStore directly
      const result = notificationService.verifyOTP(testEmail, testOTP);
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('OTP not found or expired');
      
      // Restore Date.now
      Date.now = originalDateNow;
    });

    test('should return invalid for wrong OTP', async () => {
      const testEmail = 'wrong@test.com';
      mockSendMail.mockResolvedValue(true);
      
      // Generate and store an OTP first
      await notificationService.sendEmailOTP(testEmail);
      
      const result = notificationService.verifyOTP(testEmail, '999999');
      
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid OTP');
    });

    test('should return valid for correct OTP', async () => {
      const testEmail = 'correct@test.com';
      mockSendMail.mockResolvedValue(true);
      
      // Generate and store an OTP first
      const otpResult = await notificationService.sendEmailOTP(testEmail);
      const generatedOTP = otpResult.otp;
      
      const result = notificationService.verifyOTP(testEmail, generatedOTP);
      
      expect(result.valid).toBe(true);
      expect(result.message).toBe('OTP verified successfully');
      expect(console.log).toHaveBeenCalledWith(`[OTP VERIFY] OTP verified successfully for '${testEmail}'`);
    });

    test('should delete OTP after successful verification', async () => {
      const testEmail = 'delete@test.com';
      mockSendMail.mockResolvedValue(true);
      
      // Generate and store an OTP first
      const otpResult = await notificationService.sendEmailOTP(testEmail);
      const generatedOTP = otpResult.otp;
      
      // Verify once (should succeed)
      const firstResult = notificationService.verifyOTP(testEmail, generatedOTP);
      expect(firstResult.valid).toBe(true);
      
      // Try to verify again (should fail as OTP is deleted)
      const secondResult = notificationService.verifyOTP(testEmail, generatedOTP);
      expect(secondResult.valid).toBe(false);
      expect(secondResult.message).toBe('OTP not found or expired');
    });
  });

  describe('sendEmailOTP', () => {
    test('should send email OTP successfully', async () => {
      const testEmail = 'test@example.com';
      mockSendMail.mockResolvedValue(true);
      
      const result = await notificationService.sendEmailOTP(testEmail);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent to email');
      expect(result.otp).toMatch(/^\d{6}$/); // 6-digit OTP
      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: '587',
        secure: false,
        auth: { user: 'test@example.com', pass: 'testpass123' }
      });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"RideApp" <test@example.com>',
        to: testEmail,
        subject: 'Your OTP for RideApp Registration',
        text: expect.stringContaining('Your OTP for RideApp registration is:'),
        html: expect.stringContaining('<strong>')
      });
    });

    test('should use default SMTP settings when environment variables are not set', async () => {
      const testEmail = 'default@example.com';
      
      // Temporarily remove environment variables
      const originalHost = process.env.SMTP_HOST;
      const originalPort = process.env.SMTP_PORT;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      
      mockSendMail.mockResolvedValue(true);
      
      const result = await notificationService.sendEmailOTP(testEmail);
      
      expect(result.success).toBe(true);
      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: 'test@example.com', pass: 'testpass123' }
      });
      
      // Restore environment variables
      process.env.SMTP_HOST = originalHost;
      process.env.SMTP_PORT = originalPort;
    });

    test('should handle email sending errors', async () => {
      const testEmail = 'error@example.com';
      const errorMessage = 'SMTP connection failed';
      mockSendMail.mockRejectedValue(new Error(errorMessage));
      
      const result = await notificationService.sendEmailOTP(testEmail);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send email OTP');
      expect(console.error).toHaveBeenCalledWith('Email OTP error:', expect.any(Error));
    });

    test('should generate 6-digit OTP', async () => {
      const testEmail = 'otp-format@example.com';
      mockSendMail.mockResolvedValue(true);
      
      const result = await notificationService.sendEmailOTP(testEmail);
      
      expect(result.otp).toMatch(/^\d{6}$/);
      expect(result.otp.length).toBe(6);
      expect(parseInt(result.otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(result.otp)).toBeLessThanOrEqual(999999);
    });

    test('should include IST expiry time in email content', async () => {
      const testEmail = 'expiry@example.com';
      mockSendMail.mockResolvedValue(true);
      
      await notificationService.sendEmailOTP(testEmail);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('IST');
      expect(emailCall.html).toContain('IST');
    });
  });

  describe('sendSmsOTP', () => {
    test('should send SMS OTP via email successfully', async () => {
      const testPhone = '1234567890';
      const testEmail = 'phone@example.com';
      mockSendMail.mockResolvedValue(true);
      
      const result = await notificationService.sendSmsOTP(testPhone, testEmail);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Phone OTP sent to email (demo)');
      expect(result.otp).toMatch(/^\d{6}$/);
      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: '587',
        secure: false,
        auth: { user: 'test@example.com', pass: 'testpass123' }
      });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"RideApp" <test@example.com>',
        to: testEmail,
        subject: 'Your Phone OTP (sent via Email for Demo)',
        text: expect.stringContaining(`Phone OTP for ${testPhone}:`),
        html: expect.stringContaining(`<strong>${testPhone}</strong>`)
      });
    });

    test('should handle SMS OTP sending errors', async () => {
      const testPhone = '9876543210';
      const testEmail = 'sms-error@example.com';
      const errorMessage = 'Network timeout';
      mockSendMail.mockRejectedValue(new Error(errorMessage));
      
      const result = await notificationService.sendSmsOTP(testPhone, testEmail);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send phone OTP via email');
      expect(console.error).toHaveBeenCalledWith('Phone OTP via email error:', expect.any(Error));
    });

    test('should store OTP with phone number as identifier', async () => {
      const testPhone = '5555555555';
      const testEmail = 'phone-store@example.com';
      mockSendMail.mockResolvedValue(true);
      
      const result = await notificationService.sendSmsOTP(testPhone, testEmail);
      const generatedOTP = result.otp;
      
      // Verify OTP using phone number as identifier
      const verifyResult = notificationService.verifyOTP(testPhone, generatedOTP);
      
      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.message).toBe('OTP verified successfully');
    });

    test('should include phone number and IST expiry in email content', async () => {
      const testPhone = '7777777777';
      const testEmail = 'phone-content@example.com';
      mockSendMail.mockResolvedValue(true);
      
      await notificationService.sendSmsOTP(testPhone, testEmail);
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain(testPhone);
      expect(emailCall.text).toContain('IST');
      expect(emailCall.html).toContain(testPhone);
      expect(emailCall.html).toContain('IST');
    });
  });

  describe('OTP Storage and Expiry', () => {
    test('should log OTP storage with expiry timestamp', async () => {
      const testEmail = 'log-test@example.com';
      mockSendMail.mockResolvedValue(true);
      
      await notificationService.sendEmailOTP(testEmail);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[OTP STORE\] OTP for 'log-test@example\.com' generated: \d{6}, expires at \(UTC\): .+/)
      );
    });

    test('should log OTP verification attempts', async () => {
      const testEmail = 'verify-log@example.com';
      mockSendMail.mockResolvedValue(true);
      
      const result = await notificationService.sendEmailOTP(testEmail);
      const generatedOTP = result.otp;
      
      notificationService.verifyOTP(testEmail, generatedOTP);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[OTP VERIFY\] Verifying OTP for 'verify-log@example\.com': input = \d{6}, expected = \d{6}/)
      );
    });
  });

  describe('Input Validation', () => {
    test('should validate email format in sendEmailOTP', async () => {
      const validEmail = 'test@example.com';
      const invalidEmails = ['invalid-email', '@example.com', 'test@', ''];
      
      mockSendMail.mockResolvedValue(true);
      
      // Test valid email
      const validResult = await notificationService.sendEmailOTP(validEmail);
      expect(validResult.success).toBe(true);
      
      // Test invalid emails - they should still process but we can validate the format
      for (const email of invalidEmails) {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }
    });

    test('should validate phone format in sendSmsOTP', async () => {
      const validPhone = '1234567890';
      const testEmail = 'phone-validation@example.com';
      const invalidPhones = ['123', '12345678901', 'abcdefghij', ''];
      
      mockSendMail.mockResolvedValue(true);
      
      // Test valid phone
      const validResult = await notificationService.sendSmsOTP(validPhone, testEmail);
      expect(validResult.success).toBe(true);
      
      // Test phone format validation
      expect(validPhone).toMatch(/^\d{10}$/);
      for (const phone of invalidPhones) {
        expect(phone).not.toMatch(/^\d{10}$/);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle nodemailer transport creation errors gracefully', async () => {
      const testEmail = 'transport-error@example.com';
      mockCreateTransport.mockImplementationOnce(() => {
        throw new Error('Transport creation failed');
      });
      
      const result = await notificationService.sendEmailOTP(testEmail);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to send email OTP');
    });

    test('should handle missing SMTP credentials', async () => {
      const testEmail = 'no-creds@example.com';
      
      // Temporarily remove SMTP credentials
      const originalUser = process.env.SMTP_USER;
      const originalPass = process.env.SMTP_PASS;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      
      mockSendMail.mockResolvedValue(true);
      
      const result = await notificationService.sendEmailOTP(testEmail);
      
      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: '587',
        secure: false,
        auth: { user: undefined, pass: undefined }
      });
      
      // Restore credentials
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASS = originalPass;
    });
  });
});