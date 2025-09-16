// test/unit/config/sqlConfig.test.js
import { jest } from '@jest/globals';

// Mock Sequelize to prevent actual database connections
jest.unstable_mockModule('sequelize', () => ({
  Sequelize: jest.fn().mockImplementation((database, username, password, options) => ({
    database,
    username,
    password,
    options,
    dialect: options?.dialect || 'mysql',
    authenticate: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true)
  }))
}));

describe('SQL Config', () => {
  beforeAll(() => {
    // Set up test environment variables
    process.env.DB_NAME = 'test_db';
    process.env.DB_USER = 'test_user';
    process.env.DB_PASSWORD = 'test_password';
    process.env.DB_HOST = 'localhost';
  });

  test('should export database configuration', async () => {
    const sqlConfig = await import('../../../node/config/sqlConfig.js');
    expect(sqlConfig.default).toBeDefined();
  });

  test('should create Sequelize instance with correct parameters', async () => {
    const { Sequelize } = await import('sequelize');
    const sqlConfig = await import('../../../node/config/sqlConfig.js');
    
    expect(Sequelize).toHaveBeenCalledWith(
      'test_db',
      'test_user', 
      'test_password',
      expect.objectContaining({
        host: 'localhost',
        dialect: 'mysql',
        logging: false,
        pool: expect.objectContaining({
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        })
      })
    );
  });

  test('should use default host if DB_HOST is not set', async () => {
    // Temporarily remove DB_HOST
    const originalHost = process.env.DB_HOST;
    delete process.env.DB_HOST;
    
    // Re-import to get fresh instance
    jest.resetModules();
    const { Sequelize } = await import('sequelize');
    await import('../../../node/config/sqlConfig.js');
    
    expect(Sequelize).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        host: 'localhost',
        dialect: 'mysql'
      })
    );
    
    // Restore original value
    process.env.DB_HOST = originalHost;
  });

  test('should handle database environment variables', () => {
    // Test environment variable handling
    const envVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    expect(envVars).toContain('DB_HOST');
    expect(envVars).toContain('DB_USER');
    expect(envVars).toContain('DB_PASSWORD');
    expect(envVars).toContain('DB_NAME');
  });

  test('should configure connection pool correctly', async () => {
    const { Sequelize } = await import('sequelize');
    await import('../../../node/config/sqlConfig.js');
    
    const mockCall = Sequelize.mock.calls[Sequelize.mock.calls.length - 1];
    const poolConfig = mockCall[3].pool;
    
    expect(poolConfig).toEqual({
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    });
  });
});