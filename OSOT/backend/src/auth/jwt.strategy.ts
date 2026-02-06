/**
 * JWT Strategy
 * Objective: Validate JWT tokens and attach user info to requests for protected routes.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { extractBearerToken } from '../utils/jwt.utils';
import { RedisService } from '../redis/redis.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  privilege?: number; // Add privilege field
  userType?: string;
  userGuid?: string; // GUID for Dataverse lookups (osot_table_accountid or osot_table_account_affiliateid)
  // Organization Context (Multi-Tenant Architecture)
  organizationId: string; // Encrypted GUID for security (decrypt with organization-crypto.util)
  organizationSlug: string; // Public identifier (e.g., 'osot', 'org-a') from subdomain
  organizationName: string; // Display name
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(private readonly redisService: RedisService) {
    super({
      jwtFromRequest: extractBearerToken,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '',
    });
  }

  validate(payload: JwtPayload) {
    // Audit log for authentication
    // JWT validated
    // Return complete payload including privilege, userGuid, and organization context
    return {
      userId: payload.sub,
      userGuid: payload.userGuid, // Include GUID for efficient lookups
      email: payload.email,
      role: payload.role,
      privilege: payload.privilege, // Include privilege from JWT
      userType: payload.userType,
      // Organization Context (Multi-Tenant)
      organizationId: payload.organizationId, // Encrypted GUID
      organizationSlug: payload.organizationSlug, // Public slug
      organizationName: payload.organizationName, // Display name
    };
  }
}
