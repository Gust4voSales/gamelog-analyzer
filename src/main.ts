import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvConfig } from './config/env';
import { EntityAlreadyExistsErrorFilter } from './infra/http/errors-filters/entity-already-exists';
import { EntityNotFoundErrorFilter } from './infra/http/errors-filters/entity-not-found';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new EntityAlreadyExistsErrorFilter())
  app.useGlobalFilters(new EntityNotFoundErrorFilter())

  app.enableCors()
  await app.listen(EnvConfig.port, () => {
    console.log(`🚀 Server is running on port ${EnvConfig.port}`);
  });
}
bootstrap();
