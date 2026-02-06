import { IdentityBasicDto } from './identity-basic.dto';

/**
 * Identity Create DTO for creating new identity records.
 * Extends basic identity fields and excludes read-only internal fields.
 * Used for POST operations when creating new identity entries.
 *
 * Key differences from Basic DTO:
 * - All business logic validation applies
 * - No internal metadata fields included
 * - Cultural consistency validation enforced
 */
export class IdentityCreateDto extends IdentityBasicDto {}

/**
 * Usage notes:
 * - This DTO inherits all validation from IdentityBasicDto
 * - Language preferences must include at least one selection
 * - Cultural identity fields are validated for consistency
 * - Indigenous detail fields are validated for logical consistency
 */
