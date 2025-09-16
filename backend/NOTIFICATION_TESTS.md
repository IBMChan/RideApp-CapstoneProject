# Notification Service Tests

## Overview
Comprehensive unit tests for the notification service covering OTP generation, email sending, SMS via email, and verification functionality.

## Test Coverage
- **Total Tests**: 21 tests passed
- **Statement Coverage**: 86.2%
- **Branch Coverage**: 68.75%
- **Function Coverage**: 85.71%

## Test Categories

### 1. Module Exports (1 test)
- Verifies all required functions are exported correctly

### 2. OTP Verification (5 tests)
- Non-existent OTP handling
- Expired OTP handling
- Wrong OTP handling
- Correct OTP verification
- OTP deletion after successful verification

### 3. Email OTP Service (5 tests)
- Successful email OTP sending
- Default SMTP settings usage
- Error handling for email sending failures
- 6-digit OTP generation validation
- IST expiry time inclusion in email content

### 4. SMS OTP Service (4 tests)
- SMS OTP via email functionality
- Error handling for SMS sending failures
- Phone number as OTP identifier storage
- Phone number and expiry time in email content

### 5. OTP Storage and Expiry (2 tests)
- OTP storage logging with expiry timestamp
- OTP verification attempt logging

### 6. Input Validation (2 tests)
- Email format validation
- Phone format validation

### 7. Error Handling (2 tests)
- Nodemailer transport creation error handling
- Missing SMTP credentials handling

## Commands

### Run Tests Individually
```bash
# Navigate to backend directory
Set-Location "c:\Users\LaxmikanthReddySingi\Desktop\GIT_FI\backend"

# Run notification service tests only
node --experimental-vm-modules node_modules/jest/bin/jest.js test/unit/services/notificationService.test.js --forceExit
```

### Run Tests with Coverage
```bash
# Navigate to backend directory
Set-Location "c:\Users\LaxmikanthReddySingi\Desktop\GIT_FI\backend"

# Run notification service tests with coverage report
node --experimental-vm-modules node_modules/jest/bin/jest.js test/unit/services/notificationService.test.js --coverage --forceExit
```

### Alternative Commands (if in backend directory)
```bash
# If already in backend directory, you can use:
npm test test/unit/services/notificationService.test.js
npm run test:coverage test/unit/services/notificationService.test.js
```

## Test Features

### Mocking Strategy
- **Nodemailer**: Mocked to prevent actual email sending during tests
- **Console**: Mocked to capture logging output
- **Environment Variables**: Set up test-specific SMTP configuration

### Key Test Scenarios
1. **Happy Path**: Successful OTP generation, sending, and verification
2. **Error Handling**: Network failures, invalid credentials, transport errors
3. **Edge Cases**: Expired OTPs, non-existent OTPs, format validation
4. **Configuration**: Default values when environment variables are missing
5. **Logging**: Verification of proper logging for debugging

### Data Validation
- Email format validation (basic regex)
- Phone number format (10 digits)
- OTP format (6 digits, numeric)
- SMTP configuration validation

## Uncovered Code
The following lines are not covered by tests (normal for this type of service):
- Lines 20-24: Periodic cleanup interval (runs automatically)
- Lines 40-42: Edge cases in OTP expiry deletion logic

These represent less critical paths that would require complex timing mocks to test effectively.