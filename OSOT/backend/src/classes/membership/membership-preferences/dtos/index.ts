/**
 * Membership Preferences DTOs Index
 * Central export point for all DTOs in the membership-preferences module
 *
 * PURPOSE:
 * - Provides clean barrel exports for all DTOs
 * - Simplifies imports in controllers, services, and other modules
 * - Maintains consistent export patterns across the application
 *
 * USAGE:
 * import { CreateMembershipPreferenceDto, MembershipPreferenceResponseDto } from './dtos';
 *
 * DTO PATTERN:
 * - CreateMembershipPreferenceDto: Simple request with only user preferences (6 fields)
 * - MembershipPreferenceResponseDto: Returns only 7 user-relevant fields
 * - UpdateMembershipPreferenceDto: Partial update with user preferences
 */

// Input DTOs (for requests)
export { CreateMembershipPreferenceDto } from './membership-preference-create.dto';
export { UpdateMembershipPreferenceDto } from './membership-preference-update.dto';

// Base DTO (for internal use and extension)
export { MembershipPreferenceBasicDto } from './membership-preference-basic.dto';

// Output DTOs (for responses)
export { MembershipPreferenceResponseDto } from './membership-preference-response.dto';

// Query DTOs (for filtering and pagination)
export { ListMembershipPreferencesQueryDto } from './list-membership-preferences.query.dto';
