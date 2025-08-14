// Ensure test environment is properly configured
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

console.log('\n=== E2E Test Environment Setup ===\n', JSON.stringify({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
}, null, 2));
