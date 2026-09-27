import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { DurationString } from '../utils/functions.utils.js';

/** Signs refresh tokens with their own secret and lifetime, separate from access tokens. */
export const REFRESH_JWT_SERVICE = 'REFRESH_JWT_SERVICE';

export const refreshJwtProvider: Provider = {
  provide: REFRESH_JWT_SERVICE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    new JwtService({
      secret: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      signOptions: {
        expiresIn: config.getOrThrow<DurationString>('JWT_REFRESH_EXPIRES_IN'),
      },
    }),
};
