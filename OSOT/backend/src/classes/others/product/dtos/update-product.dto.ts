/**
 * Update Product DTO
 *
 * Data Transfer Object for updating an existing product.
 * All fields are optional - only provided fields will be updated.
 *
 * Note: Product code uniqueness is validated if productCode is provided.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * Update Product DTO
 * Extends CreateProductDto but makes all fields optional
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
