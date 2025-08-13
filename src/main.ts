import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvConfig } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(EnvConfig.port, () => {
    console.log(`🚀 Server is running on port ${EnvConfig.port}`);
  });
}
bootstrap();
