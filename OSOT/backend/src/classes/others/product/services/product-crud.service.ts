/**
 * Product CRUD Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with ProductRepository
 * - Security-First Design: Admin-only access for all operations
 * - Data Transformation: Mappers for DTO ↔ Internal conversions
 * - Error Management: Centralized error handling with ErrorCodes
 * - Event Emission: ProductCreated, ProductUpdated, ProductDeleted events
 *
 * PERMISSION SYSTEM (Product Management):
 * - CREATE: Admin only (privilege = 2)
 * - UPDATE: Admin only (privilege = 2)
 * - SOFT DELETE: Admin only (privilege = 2)
 * - HARD DELETE: Owner only (privilege = 3)
 *
 * BUSINESS RULES ENFORCED:
 * - Product code uniqueness validation
 * - Status transition validation (DRAFT → AVAILABLE → DISCONTINUED)
 * - Inventory validation based on status
 * - At least one price required validation
 * - Price required when status = AVAILABLE
 *
 * Key Features:
 * - Complete CRUD operations with business validation
 * - Status-based workflow management
 * - Event emission for product lifecycle
 * - Operation tracking for audit and debugging
 * - Privilege-based access control
 *
 * @file product-crud.service.ts
 * @module ProductModule
 * @layer Services
 * @since 2025-05-01
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
// TODO: Install @nestjs/event-emitter package to enable event emission
// import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '../../../../cache/cache.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../interfaces/product-repository.interface';
import { ProductInternal } from '../interfaces/product-internal.interface';
import { ProductMapper } from '../mappers/product.mapper';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';
import { AudienceTargetCrudService } from '../../audience-target/services/audience-target-crud.service';
import { CreateAudienceTargetDto } from '../../audience-target/dtos/audience-target-create.dto';
import { ProductBusinessRulesService } from './product-business-rules.service';
// TODO: Enable event imports when @nestjs/event-emitter is installed
// import {
//   ProductCreatedEvent,
//   ProductUpdatedEvent,
//   ProductDeletedEvent,
// } from '../events/product.events';

/**
 * Product CRUD Service
 * Handles all create, update, delete operations with business validation
 */
@Injectable()
export class ProductCrudService {
  private readonly logger = new Logger(ProductCrudService.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly productMapper: ProductMapper,
    private readonly cacheService: CacheService,
    private readonly audienceTargetService: AudienceTargetCrudService,
    private readonly productBusinessRules: ProductBusinessRulesService,
    // TODO: Enable when @nestjs/event-emitter is installed
    // private readonly eventEmitter: EventEmitter2,
  ) {}

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Automatically create audience target for a new product
   * Uses retry logic (3 attempts) and rollback on failure
   *
   * @param productGuid - Product GUID
   * @param productCode - Product code for naming
   * @param userPrivilege - User privilege
   * @param userId - User ID
   * @param operationId - Operation ID
   * @returns true if successful, false if failed after retries
   */
  private async autoCreateAudienceTarget(
    productGuid: string,
    productCode: string,
    userPrivilege: Privilege,
    userId: string,
    operationId: string,
  ): Promise<boolean> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `Attempting to auto-create target for product ${productCode} (attempt ${attempt}/${maxRetries})`,
        );

        // Build OData bind reference
        const odataBindRef = `/osot_table_products(${productGuid})`;

        // Create target with all 32 targeting fields omitted (null = open-to-all)
        // Only the product relationship is required
        const targetDto: CreateAudienceTargetDto = {
          'osot_Table_Product@odata.bind': odataBindRef,
          // All 32 targeting fields intentionally omitted (will be null = open-to-all)
        };

        await this.audienceTargetService.create(
          targetDto,
          userPrivilege,
          userId,
          `${operationId}-target`,
        );

        this.logger.log(
          `Successfully auto-created target for product ${productCode}`,
        );
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Failed to create target for product ${productCode} (attempt ${attempt}/${maxRetries}): ${lastError.message}`,
        );

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    this.logger.error(
      `Failed to auto-create target after ${maxRetries} attempts for product ${productCode}: ${lastError?.message}`,
    );
    return false;
  }

  /**
   * Resolve product identifier to GUID
   * Accepts either GUID (osot_table_productid) or productId (osot-prod-0000003)
   *
   * @param identifier - GUID or productId
   * @returns GUID or null if not found
   */
  private async resolveProductIdentifier(
    identifier: string,
    organizationGuid?: string,
  ): Promise<string | null> {
    // Check if it's a GUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (guidRegex.test(identifier)) {
      this.logger.debug(`Identifier ${identifier} is already a GUID`);
      return identifier; // Already a GUID
    }

    // Otherwise, treat as productId (osot-prod-0000003)
    this.logger.debug(`Resolving productId ${identifier} to GUID`);
    const product = await this.productRepository.findByProductId(
      identifier,
      organizationGuid,
    );

    if (product?.osot_table_productid) {
      this.logger.debug(
        `Resolved productId ${identifier} to GUID ${product.osot_table_productid}`,
      );
    } else {
      this.logger.warn(`Could not resolve productId ${identifier} to GUID`);
    }

    return product?.osot_table_productid || null;
  }

  // ========================================
  // CREATE
  // ========================================

  /**
   * Create a new product
   *
   * @param createDto - Product creation data
   * @param userPrivilege - User privilege level
   * @param userId - User ID for audit
   * @param operationId - Operation tracking ID
   * @returns Created product
   * @throws ForbiddenException if user is not Admin
   * @throws ConflictException if product code already exists
   */
  async create(
    createDto: CreateProductDto,
    userPrivilege: Privilege,
    userId: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<ProductResponseDto> {
    const opId = operationId || `create-product-${Date.now()}`;

    this.logger.log(
      `Creating product ${createDto.productCode} for operation ${opId}`,
    );

    // 1. Permission check - Admin only
    if (userPrivilege !== Privilege.ADMIN && userPrivilege !== Privilege.MAIN) {
      this.logger.warn(
        `Product creation denied for user ${userId}, privilege: ${userPrivilege}`,
      );
      throw createAppError(ErrorCodes.FORBIDDEN, {
        message: 'Only Admin users can create products',
        operationId: opId,
        requiredPrivilege: Privilege.ADMIN,
        userPrivilege,
      });
    }

    // 2. Validate product code uniqueness
    const existingProduct = await this.productRepository.existsByProductCode(
      createDto.productCode,
    );

    if (existingProduct) {
      this.logger.warn(
        `Product code ${createDto.productCode} already exists for operation ${opId}`,
      );
      throw createAppError(ErrorCodes.CONFLICT, {
        message: `Product code ${createDto.productCode} already exists`,
        operationId: opId,
        productCode: createDto.productCode,
      });
    }

    try {
      // 3. Map DTO to internal format (validation happens via class-validator decorators)
      const internalData = this.productMapper.mapCreateDtoToInternal(createDto);
      internalData.organizationGuid = organizationGuid;

      // 3.5. Validate insurance fields (business rule enforcement)
      const insuranceValidation =
        this.productBusinessRules.validateInsuranceFields(internalData);
      if (!insuranceValidation.isValid) {
        this.logger.warn(
          `Insurance validation failed for product ${createDto.productCode}: ${insuranceValidation.errors.join(', ')}`,
        );
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Insurance validation failed',
          operationId: opId,
          errors: insuranceValidation.errors,
        });
      }

      // 4. Save to repository
      const createdProduct = await this.productRepository.create(internalData);

      // 5. AUTO-CREATE AUDIENCE TARGET (with retry & rollback)
      const targetCreated = await this.autoCreateAudienceTarget(
        createdProduct.osot_table_productid,
        createdProduct.osot_product_code,
        userPrivilege,
        userId,
        opId,
      );

      if (!targetCreated) {
        // Target creation failed after all retries - ROLLBACK
        this.logger.error(
          `Rolling back product ${createdProduct.osot_product_code} due to target creation failure`,
        );

        try {
          await this.productRepository.hardDelete(
            createdProduct.osot_table_productid,
            opId,
          );
          this.logger.log(
            `Successfully rolled back product ${createdProduct.osot_product_code}`,
          );
        } catch (rollbackError) {
          this.logger.error(
            `CRITICAL: Failed to rollback product ${createdProduct.osot_product_code} after target creation failure`,
            rollbackError,
          );
        }

        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message:
            'Failed to create audience target for product. Product creation rolled back.',
          hint: 'Please try again. If the issue persists, contact support.',
          operationId: opId,
          productCode: createdProduct.osot_product_code,
        });
      }

      // 6. Map to response DTO
      const response =
        this.productMapper.mapInternalToResponseDto(createdProduct);

      // 7. Emit event
      // TODO: Uncomment when @nestjs/event-emitter is installed
      // this.eventEmitter.emit(
      //   'product.created',
      //   new ProductCreatedEvent(
      //     createdProduct.osot_table_productid,
      //     createdProduct.osot_product_code,
      //     createdProduct.osot_product_status,
      //     userId,
      //     opId,
      //   ),
      // );

      // Invalidate product catalog cache
      await this.cacheService.invalidatePattern('products:catalog:*');

      this.logger.log(
        `Successfully created product ${createdProduct.osot_product_code} with audience target for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Error creating product for operation ${opId}:`, error);
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to create product',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create product WITHOUT auto-creating audience target
   * Used by product orchestrator which handles target creation separately
   * @param productDto - Product creation DTO
   * @param userPrivilege - User privilege level
   * @param userId - User ID for audit
   * @param operationId - Operation tracking ID
   * @returns Created product (internal format)
   */
  async createWithoutAutoTarget(
    productDto: CreateProductDto,
    userPrivilege: Privilege,
    userId: string,
    organizationGuid: string,
    operationId: string,
  ): Promise<ProductInternal> {
    const describeError = (err: unknown) => {
      if (err instanceof Error) {
        return {
          name: err.constructor.name,
          message: err.message,
          stack: err.stack,
        };
      }

      let message: string;
      try {
        if (typeof err === 'string') {
          message = err;
        } else if (
          typeof err === 'number' ||
          typeof err === 'boolean' ||
          typeof err === 'bigint' ||
          typeof err === 'symbol'
        ) {
          message = String(err);
        } else if (typeof err === 'function') {
          message = err.name || 'Function';
        } else if (err && typeof err === 'object') {
          message = JSON.stringify(err);
        } else {
          message = 'Unknown error type';
        }
      } catch (stringifyError) {
        message = `Non-serializable error: ${String(stringifyError)}`;
      }

      return {
        name: 'Unknown',
        message,
        stack: 'N/A',
      };
    };

    try {
      this.logger.log(
        `Creating product without auto-target for operation ${operationId}`,
      );

      // Log input parameters for debugging
      this.logger.debug(
        `INPUTS: userPrivilege=${userPrivilege}, organizationGuid=${organizationGuid}`,
      );
      // 1. Permission check - Admin or Main only

      // Convert to number if string (from Redis deserialization)
      const privilegeNum =
        typeof userPrivilege === 'string'
          ? (Number(userPrivilege) as Privilege)
          : userPrivilege;

      if (privilegeNum !== Privilege.ADMIN && privilegeNum !== Privilege.MAIN) {
        throw createAppError(ErrorCodes.FORBIDDEN, {
          message: 'Only Admin or Main users can create products',
          operationId,
          requiredPrivilege: `${Privilege.ADMIN} (Admin) or ${Privilege.MAIN} (Main)`,
          userPrivilege: privilegeNum,
        });
      }
      // 2. Validate product code uniqueness
      try {
        const existingProduct =
          await this.productRepository.existsByProductCode(
            productDto.productCode,
          );

        if (existingProduct) {
          throw createAppError(ErrorCodes.CONFLICT, {
            message: `Product code ${productDto.productCode} already exists`,
            operationId,
            productCode: productDto.productCode,
          });
        }
      } catch (error) {
        this.logger.error(
          `Step 2 ERROR: Failed to check product code uniqueness`,
        );
        this.logger.error(
          `Details: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }

      // 3. Map DTO to internal format
      try {
        const productData =
          this.productMapper.mapCreateDtoToInternal(productDto);
        productData.organizationGuid = organizationGuid;

        this.logger.log(
          `Step 3: ✅ Mapped product data - organizationGuid: ${productData.organizationGuid}, productCode: ${productData.osot_product_code}`,
        );
        try {
          const createdProduct =
            await this.productRepository.create(productData);

          // 5. Invalidate cache
          await this.cacheService.invalidatePattern('products:catalog:*');

          this.logger.log(
            `✅ Created product ${createdProduct.osot_product_code} without auto-target for operation ${operationId}`,
          );

          return createdProduct;
        } catch (repoError) {
          this.logger.error(
            `Step 4 REPOSITORY ERROR: Failed to create product in Dataverse`,
          );
          const repoErrorName =
            repoError instanceof Error ? repoError.constructor.name : 'Unknown';
          const repoErrorMsg =
            repoError instanceof Error ? repoError.message : String(repoError);
          const repoErrorStack =
            repoError instanceof Error ? repoError.stack : 'N/A';
          this.logger.error(`Repository Error Type: ${repoErrorName}`);
          this.logger.error(`Repository Error Message: ${repoErrorMsg}`);
          this.logger.error(`Repository Error Stack: ${repoErrorStack}`);
          throw repoError;
        }
      } catch (mapError) {
        const mapErr = describeError(mapError);
        this.logger.error(
          `Step 3 MAPPER ERROR: Failed to map DTO to internal format`,
        );
        this.logger.error(`Mapper Error Type: ${mapErr.name}`);
        this.logger.error(`Mapper Error Message: ${mapErr.message}`);
        this.logger.error(`Mapper Error Stack: ${mapErr.stack}`);
        throw mapError;
      }
    } catch (error) {
      // Log full error details
      const errInfo = describeError(error);
      const errorMessage = errInfo.message;
      const errorStack = errInfo.stack ?? 'No stack trace available';
      const errorType = errInfo.name;

      this.logger.error(
        `❌ CRITICAL ERROR in createWithoutAutoTarget for operation ${operationId}`,
      );
      this.logger.error(`Error Type: ${errorType}`);
      this.logger.error(`Error Message: ${errorMessage}`);
      this.logger.error(`Error Stack: ${errorStack}`);
      this.logger.error(`Product Code: ${productDto.productCode}`);
      this.logger.error(`Organization GUID: ${organizationGuid}`);

      // If error is already an AppError, rethrow it
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }

      // Otherwise, wrap in AppError with full details
      throw createAppError(
        ErrorCodes.DATAVERSE_SERVICE_ERROR,
        {
          message: `Failed to create product: ${errorMessage}`,
          operationId,
          productCode: productDto.productCode,
          organizationGuid,
          originalError: errorMessage,
          errorStack,
          errorType,
        },
        undefined,
        `Product creation failed for ${productDto.productCode}: ${errorMessage}`,
      );
    }
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * Update an existing product
   * Accepts either GUID or productId (osot-prod-0000003)
   *
   * @param identifier - Product GUID or productId
   * @param updateDto - Product update data
   * @param userPrivilege - User privilege level
   * @param userId - User ID for audit
   * @param operationId - Operation tracking ID
   * @returns Updated product
   * @throws ForbiddenException if user is not Admin
   * @throws NotFoundException if product not found
   */
  async update(
    identifier: string,
    updateDto: UpdateProductDto,
    userPrivilege: Privilege,
    userId: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<ProductResponseDto> {
    const opId = operationId || `update-product-${Date.now()}`;

    this.logger.log(`Updating product ${identifier} for operation ${opId}`);

    // 1. Permission check - Admin only
    if (userPrivilege !== Privilege.ADMIN && userPrivilege !== Privilege.MAIN) {
      this.logger.warn(
        `Product update denied for user ${userId}, privilege: ${userPrivilege}`,
      );
      throw createAppError(ErrorCodes.FORBIDDEN, {
        message: 'Only Admin users can update products',
        operationId: opId,
        requiredPrivilege: Privilege.ADMIN,
        userPrivilege,
      });
    }

    // 2. Enforce organization ownership
    const existing = await this.productRepository.findById(
      identifier,
      organizationGuid,
      opId,
    );
    if (!existing) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: 'Product not found',
        operationId: opId,
        productId: identifier,
      });
    }
    if (
      existing.organizationGuid &&
      existing.organizationGuid.toLowerCase() !== organizationGuid.toLowerCase()
    ) {
      throw createAppError(ErrorCodes.FORBIDDEN, {
        message: 'Product does not belong to this organization',
        operationId: opId,
        productId: identifier,
      });
    }

    // 2. Resolve identifier to GUID
    const id = await this.resolveProductIdentifier(
      identifier,
      organizationGuid,
    );
    if (!id) {
      this.logger.warn(`Product ${identifier} not found for operation ${opId}`);
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `Product ${identifier} not found`,
        operationId: opId,
        productId: identifier,
      });
    }

    // 3. Check if product exists
    const existingProduct = await this.productRepository.findById(
      id,
      organizationGuid,
      opId,
    );

    if (!existingProduct) {
      this.logger.warn(`Product ${id} not found for operation ${opId}`);
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `Product ${id} not found`,
        operationId: opId,
        productId: id,
      });
    }

    try {
      // 3. Map DTO to internal format
      const updateData = this.productMapper.mapUpdateDtoToInternal(updateDto);

      // 3.5. Merge with existing product for validation
      const mergedData = { ...existingProduct, ...updateData };

      // 3.6. Validate insurance fields (business rule enforcement)
      const insuranceValidation =
        this.productBusinessRules.validateInsuranceFields(mergedData);
      if (!insuranceValidation.isValid) {
        this.logger.warn(
          `Insurance validation failed for product ${identifier}: ${insuranceValidation.errors.join(', ')}`,
        );
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Insurance validation failed',
          operationId: opId,
          errors: insuranceValidation.errors,
        });
      }

      // 4. Update in repository
      const updatedProduct = await this.productRepository.update(
        id,
        updateData,
      );

      // 5. Map to response DTO
      const response =
        this.productMapper.mapInternalToResponseDto(updatedProduct);

      // 6. Emit event
      // TODO: Uncomment when @nestjs/event-emitter is installed
      // this.eventEmitter.emit(
      //   'product.updated',
      //   new ProductUpdatedEvent(
      //     updatedProduct.osot_table_productid,
      //     updatedProduct.osot_product_code,
      //     existingProduct.osot_product_status,
      //     updatedProduct.osot_product_status,
      //     userId,
      //     opId,
      //   ),
      // );

      // Invalidate product cache
      await this.cacheService.invalidate(`products:details:${id}`);
      await this.cacheService.invalidatePattern('products:catalog:*');

      this.logger.log(
        `Successfully updated product ${updatedProduct.osot_product_code} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error updating product ${id} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to update product',
        operationId: opId,
        productId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // DELETE (SOFT)
  // ========================================

  /**
   * Soft delete a product (set status to DISCONTINUED)
   * Accepts either GUID or productId (osot-prod-0000003)
   *
   * @param identifier - Product GUID or productId
   * @param userPrivilege - User privilege level
   * @param userId - User ID for audit
   * @param operationId - Operation tracking ID
   * @returns Success boolean
   * @throws ForbiddenException if user is not Admin
   * @throws NotFoundException if product not found
   */
  async delete(
    identifier: string,
    userPrivilege: Privilege,
    userId: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete-product-${Date.now()}`;

    this.logger.log(
      `Soft deleting product ${identifier} for operation ${opId}`,
    );

    // 1. Permission check - Admin only
    if (userPrivilege !== Privilege.ADMIN && userPrivilege !== Privilege.MAIN) {
      this.logger.warn(
        `Product deletion denied for user ${userId}, privilege: ${userPrivilege}`,
      );
      throw createAppError(ErrorCodes.FORBIDDEN, {
        message: 'Only Admin users can delete products',
        operationId: opId,
        requiredPrivilege: Privilege.ADMIN,
        userPrivilege,
      });
    }

    // 2. Resolve identifier to GUID
    const id = await this.resolveProductIdentifier(
      identifier,
      organizationGuid,
    );
    if (!id) {
      this.logger.warn(`Product ${identifier} not found for operation ${opId}`);
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `Product ${identifier} not found`,
        operationId: opId,
        productId: identifier,
      });
    }

    // 3. Check if product exists
    const existingProduct = await this.productRepository.findById(
      id,
      organizationGuid,
      opId,
    );

    if (!existingProduct) {
      this.logger.warn(`Product ${id} not found for operation ${opId}`);
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `Product ${id} not found`,
        operationId: opId,
        productId: id,
      });
    }

    if (
      existingProduct.organizationGuid &&
      existingProduct.organizationGuid.toLowerCase() !==
        organizationGuid.toLowerCase()
    ) {
      throw createAppError(ErrorCodes.FORBIDDEN, {
        message: 'Product does not belong to this organization',
        operationId: opId,
        productId: id,
      });
    }

    try {
      // 3. Soft delete (set status to DISCONTINUED)
      const success = await this.productRepository.delete(id, opId);

      if (!success) {
        throw new Error('Failed to delete product');
      }

      // 4. Emit event
      // TODO: Uncomment when @nestjs/event-emitter is installed
      // this.eventEmitter.emit(
      //   'product.deleted',
      //   new ProductDeletedEvent(
      //     id,
      //     existingProduct.osot_product_code,
      //     false, // soft delete
      //     userId,
      //     opId,
      //   ),
      // );

      // Invalidate product cache
      await this.cacheService.invalidate(`products:details:${id}`);
      await this.cacheService.invalidatePattern('products:catalog:*');

      this.logger.log(
        `Successfully soft deleted product ${existingProduct.osot_product_code} for operation ${opId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting product ${id} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to delete product',
        operationId: opId,
        productId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // HARD DELETE
  // ========================================

  /**
   * Hard delete a product (permanent removal)
   * Accepts either GUID or productId (osot-prod-0000003)
   *
   * @param identifier - Product GUID or productId
   * @param userPrivilege - User privilege level
   * @param userId - User ID for audit
   * @param operationId - Operation tracking ID
   * @returns Success boolean
   * @throws ForbiddenException if user is not Owner
   * @throws NotFoundException if product not found
   */
  async hardDelete(
    identifier: string,
    userPrivilege: Privilege,
    userId: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `hard-delete-product-${Date.now()}`;

    this.logger.log(
      `Hard deleting product ${identifier} for operation ${opId}`,
    );

    // 1. Permission check - Owner only
    if (userPrivilege !== Privilege.MAIN) {
      this.logger.warn(
        `Product hard deletion denied for user ${userId}, privilege: ${userPrivilege}`,
      );
      throw createAppError(ErrorCodes.FORBIDDEN, {
        message: 'Only Owner users can permanently delete products',
        operationId: opId,
        requiredPrivilege: Privilege.MAIN,
        userPrivilege,
      });
    }

    // 2. Resolve identifier to GUID
    const id = await this.resolveProductIdentifier(
      identifier,
      organizationGuid,
    );
    if (!id) {
      this.logger.warn(`Product ${identifier} not found for operation ${opId}`);
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `Product ${identifier} not found`,
        operationId: opId,
        productId: identifier,
      });
    }

    // 3. Check if product exists
    const existingProduct = await this.productRepository.findById(
      id,
      organizationGuid,
      opId,
    );

    if (!existingProduct) {
      this.logger.warn(`Product ${id} not found for operation ${opId}`);
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `Product ${id} not found`,
        operationId: opId,
        productId: id,
      });
    }

    if (
      existingProduct.organizationGuid &&
      existingProduct.organizationGuid.toLowerCase() !==
        organizationGuid.toLowerCase()
    ) {
      throw createAppError(ErrorCodes.FORBIDDEN, {
        message: 'Product does not belong to this organization',
        operationId: opId,
        productId: id,
      });
    }

    try {
      // 3. Hard delete (permanent removal)
      const success = await this.productRepository.hardDelete(id, opId);

      if (!success) {
        throw new Error('Failed to hard delete product');
      }

      // 4. Emit event
      // TODO: Uncomment when @nestjs/event-emitter is installed
      // this.eventEmitter.emit(
      //   'product.deleted',
      //   new ProductDeletedEvent(
      //     id,
      //     existingProduct.osot_product_code,
      //     true, // hard delete
      //     userId,
      //     opId,
      //   ),
      // );

      // Invalidate product cache
      await this.cacheService.invalidate(`products:details:${id}`);
      await this.cacheService.invalidatePattern('products:catalog:*');

      this.logger.log(
        `Successfully hard deleted product ${existingProduct.osot_product_code} for operation ${opId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error hard deleting product ${id} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to hard delete product',
        operationId: opId,
        productId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * Batch update multiple products
   *
   * @param ids - Array of product IDs
   * @param updateDto - Product update data
   * @param userPrivilege - User privilege level
   * @param userId - User ID for audit
   * @param operationId - Operation tracking ID
   * @returns Array of updated products
   * @throws ForbiddenException if user is not Admin
   */
  async batchUpdate(
    ids: string[],
    updateDto: UpdateProductDto,
    userPrivilege: Privilege,
    userId: string,
    operationId?: string,
  ): Promise<ProductResponseDto[]> {
    const opId = operationId || `batch-update-products-${Date.now()}`;

    this.logger.log(
      `Batch updating ${ids.length} products for operation ${opId}`,
    );

    // 1. Permission check - Admin only
    if (userPrivilege !== Privilege.ADMIN && userPrivilege !== Privilege.MAIN) {
      this.logger.warn(
        `Batch update denied for user ${userId}, privilege: ${userPrivilege}`,
      );
      throw createAppError(ErrorCodes.FORBIDDEN, {
        message: 'Only Admin users can batch update products',
        operationId: opId,
        requiredPrivilege: Privilege.ADMIN,
        userPrivilege,
      });
    }

    try {
      // 2. Map DTO to internal format
      const updateData = this.productMapper.mapUpdateDtoToInternal(updateDto);

      // 3. Batch update in repository
      const updatedProducts = await this.productRepository.batchUpdate(
        ids,
        updateData,
        opId,
      );

      // 4. Map to response DTOs
      const responses = updatedProducts.map((product) =>
        this.productMapper.mapInternalToResponseDto(product),
      );

      // 5. Emit events for each updated product
      // TODO: Uncomment when @nestjs/event-emitter is installed
      // updatedProducts.forEach((product) => {
      //   this.eventEmitter.emit(
      //     'product.updated',
      //     new ProductUpdatedEvent(
      //       product.osot_table_productid,
      //       product.osot_product_code,
      //       product.osot_product_status,
      //       product.osot_product_status,
      //       userId,
      //       opId,
      //     ),
      //   );
      // });

      this.logger.log(
        `Successfully batch updated ${updatedProducts.length} products for operation ${opId}`,
      );

      return responses;
    } catch (error) {
      this.logger.error(
        `Error batch updating products for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to batch update products',
        operationId: opId,
        productCount: ids.length,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
