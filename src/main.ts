import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import {
  isAllowedCorsOrigin,
  parseAllowedOrigins,
} from './utils/cors.utils.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = parseAllowedOrigins(
    configService.get<string>('FRONTEND_URL'),
  );
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, success: boolean) => void,
    ) => {
      if (isAllowedCorsOrigin(origin, allowedOrigins, isProduction)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(configService.get<number>('PORT') ?? 5001, '0.0.0.0');
}
bootstrap();
