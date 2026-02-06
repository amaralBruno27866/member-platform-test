/**
 * Update Order Product DTO
 *
 * Data Transfer Object for updating an existing Order Product.
 *
 * Architecture Notes:
 * - Partial update (only changed fields required)
 * - Most fields are IMMUTABLE (snapshot frozen at creation)
 * - Only privilege/access_modifiers should be updated
 * - Updates are rare and should be logged (audit trail)
 * - Owner role CANNOT update (prevents fraud/tampering)
 *
 * Updatable Fields:
 * - osot_privilege (visibility changes)
 * - osot_access_modifiers (access rule changes)
 *
 * Immutable Fields (will be rejected):
 * - orderGuid (parent order cannot change)
 * - osot_product_id (snapshot frozen)
 * - osot_product_name (snapshot frozen)
 * - osot_quantity (snapshot frozen)
 * - osot_selectedprice (snapshot frozen)
 * - osot_producttax (snapshot frozen)
 * - osot_taxamount (calculated, frozen)
 * - osot_itemsubtotal (calculated, frozen)
 * - osot_itemtotal (calculated, frozen)
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { AccessModifier, Privilege } from '../../../../common/enums';

/**
 * DTO for updating an Order Product
 * Only access control fields are updatable (immutability enforced)
 */
export class UpdateOrderProductDto {
  // ========================================
  // ACCESS CONTROL (Only updatable fields)
  // ========================================

  @ApiPropertyOptional({
    description:
      'Privilege level (visibility). Update to change who can see this line item.',
    enum: Privilege,
    example: Privilege.ADMIN,
  })
  @IsOptional()
  @IsEnum(Privilege)
  osot_privilege?: Privilege;

  @ApiPropertyOptional({
    description:
      'Access modifier (access rules). Update to change access permissions.',
    enum: AccessModifier,
    example: AccessModifier.PROTECTED,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  osot_access_modifiers?: AccessModifier;
}
