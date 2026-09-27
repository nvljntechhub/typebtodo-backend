import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { ApiResponse } from '../utils/responses/api-response.js';
import { errorMessages, successMessages } from '../utils/properties.utils.js';
import { LoginDto } from './dto/login.dto.js';
import { clearAuthCookies, setAuthCookies } from './auth-cookie.utils.js';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { JwtUser } from './jwt.strategy.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async registerUser(@Body() registerDto: RegisterDto): Promise<ApiResponse> {
    const user = await this.authService.registerUser(registerDto);
    return new ApiResponse(
      HttpStatus.CREATED,
      successMessages.USER_REGISTERED_SUCCESSFULLY,
      user,
    );
  }

  @Post('login')
  async loginUser(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse> {
    const { user, accessToken, refreshToken } =
      await this.authService.loginUser(loginDto);
    setAuthCookies(response, this.configService, { accessToken, refreshToken });

    return new ApiResponse(
      HttpStatus.OK,
      successMessages.USER_LOGGED_IN_SUCCESSFULLY,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: Request & { user?: JwtUser }): Promise<ApiResponse> {
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException(errorMessages.SESSION_NOT_FOUND);
    }

    const user = await this.authService.getCurrentUser(userId);
    return new ApiResponse(HttpStatus.OK, successMessages.USER_SESSION_LOADED, {
      user,
    });
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): ApiResponse {
    clearAuthCookies(response, this.configService);
    return new ApiResponse(
      HttpStatus.OK,
      successMessages.USER_LOGGED_OUT_SUCCESSFULLY,
    );
  }
}
