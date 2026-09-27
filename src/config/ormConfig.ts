import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const dir = dirname(fileURLToPath(import.meta.url));

export const ormConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
  name: 'todobackendDb',
  type: 'postgres',
  host: configService.get<string>('POSTGRES_HOST'),
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  port: Number(configService.get<string>('POSTGRES_PORT') ?? 5432),
  username: configService.get<string>('POSTGRES_USER'),
  password: configService.get<string>('POSTGRES_PASSWORD'),
  database: configService.get<string>('POSTGRES_DB'),
  entities: [dir + '/../**/*.entity{.ts,.js}'],
  autoLoadEntities: true,
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
