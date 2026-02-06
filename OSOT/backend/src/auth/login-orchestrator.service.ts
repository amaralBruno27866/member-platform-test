/**
 * Class: LoginOrchestratorService
 * Objective: Simplified orchestrator for login operations using unified authentication system.
 * Functionality: Delegates authentication to AuthService.loginEnhanced for unified Account/Affiliate support.
 * Expected Result: Clean separation of authentication concerns with unified user type handling.
 *
 * Note: Now uses enhanced authentication system for both Account and Affiliate users.
 */

import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../classes/login/login.dto';

@Injectable()
export class LoginOrchestratorService {
  constructor(private readonly authService: AuthService) {}

  async login(loginDto: LoginDto) {
    // Extract organizationSlug from DTO or default to 'osot' (master organization)
    // In production, this would typically come from subdomain parsing
    const organizationSlug = loginDto.organizationSlug || 'osot';

    // Use enhanced unified authentication system with organization context
    return await this.authService.loginEnhanced(loginDto, organizationSlug);
  }
}
