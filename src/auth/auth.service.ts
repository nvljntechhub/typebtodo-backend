import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { User } from '../users/user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DUPLICATE_EMAIL_ERROR_CODE } from '../utils/constants.utils.js';
import { errorMessages } from '../utils/properties.utils.js';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { parseDurationToSeconds } from '../utils/functions.utils.js';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service.js';
import { REFRESH_JWT_SERVICE } from './refresh-jwt.provider.js';

export type PublicUser = {
  id: string;
  email: string;
  name: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(REFRESH_JWT_SERVICE)
    private readonly refreshJwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async registerUser(registerDto: RegisterDto): Promise<PublicUser> {
    try {
      const { name, email, password } = registerDto;
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException(errorMessages.EMAIL_ALREADY_EXISTS);
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await this.userRepository.save({
        name,
        email,
        passwordHash,
      });
      return { id: user.id, email: user.email, name: user.name };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === DUPLICATE_EMAIL_ERROR_CODE
      ) {
        throw new ConflictException(errorMessages.EMAIL_ALREADY_EXISTS);
      }
      throw error;
    }
  }

  async loginUser(
    loginDto: LoginDto,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'passwordHash'],
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException(errorMessages.INVALID_CREDENTIALS);
    }

    const { accessToken, refreshToken } = await this.issueAuthTokens({
      id: user.id,
    });
    await this.storeRefreshToken(user.id, refreshToken);
    return { user, accessToken, refreshToken };
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      throw new UnauthorizedException(errorMessages.SESSION_NOT_FOUND);
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  private async issueAuthTokens(user: { id?: string }) {
    if (!user.id) {
      throw new InternalServerErrorException(
        errorMessages.USER_CREATION_FAILED,
      );
    }

    const payload = {
      sub: user.id,
      role: 'user',
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.refreshJwtService.signAsync(payload);
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hashed = await argon2.hash(refreshToken);
    const ttlSeconds = parseDurationToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
    await this.redisService.client.set(
      `refresh:user:${userId}`,
      hashed,
      'EX',
      ttlSeconds,
    );
  }
}
