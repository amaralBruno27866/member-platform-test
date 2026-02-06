/**
 * Account Registration DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes/ErrorMessages for validation errors
 * - enums: Uses centralized enums for all enum fields
 * - validators: Uses Account validators for field validation
 * - integrations: Designed for account registration workflow
 *
 * REGISTRATION WORKFLOW:
 * - Streamlined registration process with essential fields only
 * - Account declaration required as part of registration acceptance
 * - Default values applied for optional fields during registration
 * - Email verification and phone validation handled post-registration
 *
 * BUSINESS RULES:
 * - All personal and contact information required for registration
 * - Account group selection required to determine user type
 * - Account declaration must be accepted to complete registration
 * - Password security requirements enforced during registration
 * - Email and phone uniqueness validated during registration process
 */

import { ApiProperty } from '@nestjs/swagger';
import { AccountBasicDto } from './account-basic.dto';

/**
 * DTO for Account registration workflow
 * Used when creating an account as part of user registration process
 */
export class AccountRegistrationDto extends AccountBasicDto {
  // Note: This DTO inherits all fields and validation from AccountBasicDto
  // Registration workflow uses all the same validation rules
  // Default values for optional fields are applied at service layer:
  // - osot_Account_Status: PENDING
  // - osot_Active_Member: false
  // - osot_Access_Modifiers: PRIVATE
  // - osot_Privilege: OWNER

  @ApiProperty({
    description: 'Registration confirmation flag (for UI state management)',
    example: false,
    required: false,
  })
  registrationConfirmed?: boolean;
}
