/**
 * Class: AuthController
 * Objective: Handle HTTP requests related to authentication.
 * Functionality: Provides endpoints for authentication actions (login).
 * Expected Result: Exposes authentication endpoints for the application.
 */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from '../classes/login/login.dto';
import {
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiExtraModels } from '@nestjs/swagger';
import { ResponseTableAccountDto } from '../classes/login/response-table-account.dto';
import { LoginOrchestratorService } from './login-orchestrator.service';
import { Type } from '@nestjs/common';

@ApiTags('Authentication')
@ApiExtraModels(ResponseTableAccountDto as Type<any>)
@Controller('auth')
export class AuthController {
  // ...existing code...
  constructor(
    private readonly authService: AuthService,
    private readonly loginOrchestratorService: LoginOrchestratorService,
  ) {}

  /**
   * POST /auth/login
   * Receives email and password, returns JWT and user info if valid.
   *
   * - Returns: { access_token: string, user: { id, email, userType, privilege }, role, privilege, userType }
   * - On error: 401 Unauthorized
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user and return JWT token with privilege level',
    description:
      'Receives osot_email and osot_password, returns JWT, user info, and privilege level. The privilege field is returned both as numeric (1=Owner, 2=Admin, 3=Main) and human-readable format.',
  })
  @ApiBody({
    description:
      'Login credentials. Example: { "osot_email": "user@example.com", "osot_password": "P@ssw0rd!" }',
    schema: {
      type: 'object',
      properties: {
        osot_email: { type: 'string', example: 'user@example.com' },
        osot_password: { type: 'string', example: 'P@ssw0rd!' },
      },
      required: ['osot_email', 'osot_password'],
    },
  })
  @ApiOkResponse({
    description:
      'Returns a JWT access token and user data if credentials are valid.',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'osot-0000001' },
            email: { type: 'string', example: 'user@example.com' },
            userType: { type: 'string', example: 'account' },
            privilege: {
              type: 'string',
              example: 'Owner',
              description: 'User privilege level (Owner, Admin, or Main)',
            },
          },
        },
        role: {
          type: 'string',
          example: 'owner',
          description: 'User role string (for backward compatibility)',
        },
        privilege: {
          type: 'number',
          example: 1,
          description: 'Numeric privilege value (1=Owner, 2=Admin, 3=Main)',
        },
        userType: { type: 'string', example: 'account' },
        authenticationTimestamp: {
          type: 'string',
          example: '2025-12-05T10:30:00.000Z',
        },
      },
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'osot-0000001',
          email: 'user@example.com',
          userType: 'account',
          privilege: 'Owner',
        },
        role: 'owner',
        privilege: 1,
        userType: 'account',
        authenticationTimestamp: '2025-12-05T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials. The email or password is incorrect.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.loginOrchestratorService.login(loginDto);
  }

  /**
   * POST /auth/logout
   * Invalidates the current JWT token (global logout via blacklist).
   * Protected by JWT.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Add this decorator for Swagger authentication
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout global',
    description: 'Adds the JWT token to the blacklist for global logout.',
  })
  @ApiOkResponse({ description: 'Logout completed successfully.' })
  async logout(@Req() req: Request) {
    // Extracts the token from the Authorization header
    const authHeader =
      req.headers['authorization'] || req.headers['Authorization'];
    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      return { message: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    await this.authService.blacklistToken(token);
    return { message: 'Logout completed successfully.' };
  }

  /**
   * POST /logout
   * Logs in the terminal when the user logs out via frontend.
   */
  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  frontendLogout(@Body('user_business_id') userId: string) {
    console.log(`User ${userId} log out of the system`);
    return { ok: true };
  }
}
