/**
 * Create Contact DTO
 * Extends ContactBasicDto for contact creation operations
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Inherits all validation and transformation from ContactBasicDto
 * - Includes comprehensive business rule validation for creation workflow
 * - Supports optional system-generated field override for admin operations
 * - Integrates with DataverseService for OData entity binding
 *
 * DATAVERSE INTEGRATION:
 * - OData bind support for related Table Account entities
 * - UUID generation override capability for administrative imports
 * - Business rule validation during contact setup
 * - Comprehensive validation for registration and onboarding workflows
 *
 * USAGE CONTEXT:
 * - Contact creation via administrative endpoints
 * - User onboarding and account initialization workflows
 * - Bulk contact import operations
 * - API integration with external contact management systems
 *
 * BUSINESS RULES:
 * - User Business ID is required for all new contacts
 * - All other contact fields are optional
 * - Social media URLs must follow proper format validation
 * - Phone numbers are automatically formatted to Canadian standard
 * - Email validation enforced for secondary email
 * - Account binding optional for standalone contacts
 */

import { ContactBasicDto } from './contact-basic.dto';

export class CreateContactDto extends ContactBasicDto {
  // Note: osot_Table_Account@odata.bind is handled internally by the service layer
  // and should not be included in user-facing create requests
}
