import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Request } from 'express';
import { LoginDto } from '../classes/login/login.dto';

const MAX_ATTEMPTS = 20; // Maximum number of attempts (increased for development/testing)
const WINDOW_SECONDS = 60; // Time window in seconds (1 minute)

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const body = request.body as Partial<LoginDto>;
    const email =
      typeof body?.osot_email === 'string' ? body.osot_email : undefined;

    if (!email) {
      // If there's no email, it doesn't make sense to apply rate limit
      return true;
    }

    const key = `login:rate:${email}:${ip}`;
    const attempts = await this.redisService.get(key);
    if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many login attempts. Please try again later.',
        429,
      );
    }
    // Increments the counter and sets expiration if it's the first attempt
    if (!attempts) {
      await this.redisService.set(key, '1', { EX: WINDOW_SECONDS });
    } else {
      await this.redisService.set(key, String(Number(attempts) + 1), {
        EX: WINDOW_SECONDS,
      });
    }
    return true;
  }
}
