export const EnvConfig = {
  port: process.env.PORT || '3333',
  environment: process.env.NODE_ENV || 'development',
  isTestEnvironment: process.env.NODE_ENV === 'test',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
};
