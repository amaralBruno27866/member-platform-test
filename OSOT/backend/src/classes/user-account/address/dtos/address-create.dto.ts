/**
 * Create Address DTO
 * Extends AddressBasicDto for address creation operations
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Inherits all validation and transformation from AddressBasicDto
 * - Includes comprehensive business rule validation for creation workflow
 * - Supports optional system-generated field override for admin operations
 * - Integrates with DataverseService for OData entity binding
 *
 * DATAVERSE INTEGRATION:
 * - OData bind support for related Table Account entities
 * - UUID generation override capability for administrative imports
 * - Business rule validation during address setup
 * - Comprehensive validation for registration and onboarding workflows
 *
 * USAGE CONTEXT:
 * - Address creation via administrative endpoints
 * - User onboarding and account initialization workflows
 * - Bulk address import operations
 * - API integration with external geographic systems
 *
 * BUSINESS RULES:
 * - Address Line 1 is required for all new addresses
 * - City, Province, Postal Code, and Country are required
 * - Address Type is required to categorize the address
 * - Address Preference is optional for multi-address scenarios
 * - Canadian postal code validation enforced
 */

import { AddressBasicDto } from './address-basic.dto';

export class CreateAddressDto extends AddressBasicDto {
  // Note: This DTO inherits all fields and examples from AddressBasicDto
  // No additional properties needed for basic creation
}
