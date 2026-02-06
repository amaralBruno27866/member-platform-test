import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProductOrchestratorRepository } from '../repositories/product-orchestrator.repository';
import { ProductOrchestratorEventService } from '../events/product-orchestrator-event.service';
import { ProductCrudService } from '../../../others/product/services/product-crud.service';
import { AudienceTargetCrudService } from '../../../others/audience-target/services/audience-target-crud.service';
import { ProductLookupService } from '../../../others/product/services/product-lookup.service';
import {
  ProductOrchestratorSession,
  ProductOrchestratorCommitResult,
} from '../interfaces/product-orchestrator.interfaces';
import { ProductState, isValidTransition } from '../enums/product-state.enum';
import {
  PRODUCT_SESSION_TTL_SECONDS,
  PRODUCT_ORCHESTRATOR_ERRORS,
  MAX_COMMIT_RETRIES,
  RETRY_DELAY_MS,
} from '../constants/product-orchestrator.constants';
import {
  createProductSession,
  addProductToSession,
  addTargetToSession,
  markSessionCommitted,
  markSessionFailed,
} from '../mappers/session.mappers';
import { validateProductData, validateTargetData } from '../validators';
import { CreateProductDto } from '../../../others/product/dtos/create-product.dto';
import { AddTargetToSessionDto } from '../dtos/add-audience-target-to-session.dto';
import { CreateAudienceTargetDto } from '../../../others/audience-target/dtos/audience-target-create.dto';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Product Orchestrator Service
 * Manages product creation workflow with Redis-first validation
 */
@Injectable()
export class ProductOrchestratorService {
  private readonly logger = new Logger(ProductOrchestratorService.name);

  constructor(
    private readonly repository: ProductOrchestratorRepository,
    private readonly eventService: ProductOrchestratorEventService,
    private readonly productCrudService: ProductCrudService,
    private readonly audienceTargetService: AudienceTargetCrudService,
    private readonly productLookupService: ProductLookupService,
  ) {}

  /**
   * Create a new product orchestrator session
   */
  async createSession(
    userId: string,
    userPrivilege: Privilege,
    organizationGuid: string,
    operationId: string,
  ): Promise<ProductOrchestratorSession> {
    this.logger.log(`Creating product orchestrator session for user ${userId}`);

    // Only Admin and Main can create products
    if (userPrivilege !== Privilege.ADMIN && userPrivilege !== Privilege.MAIN) {
      throw new BadRequestException(
        'Only Admin and Main users can create products',
      );
    }

    // Create session
    const session = createProductSession(
      userId,
      userPrivilege,
      organizationGuid,
      operationId,
      PRODUCT_SESSION_TTL_SECONDS,
    );

    // Save to Redis
    await this.repository.saveSession(session);

    // Publish event
    this.eventService.publishSessionCreated({
      sessionId: session.sessionId,
      userId,
      timestamp: new Date(),
      operationId,
    });

    this.logger.log(
      `Created product orchestrator session ${session.sessionId}`,
    );

    return session;
  }

  /**
   * Add product data to session
   */
  async addProductData(
    sessionId: string,
    productDto: CreateProductDto,
    operationId: string,
  ): Promise<ProductOrchestratorSession> {
    this.logger.log(`Adding product data to session ${sessionId}`);

    // Get session
    const session = await this.getSession(sessionId);

    // Validate state transition
    this.validateStateTransition(
      session.state,
      ProductState.PRODUCT_ADDED,
      sessionId,
    );

    // Validate product data
    const validation = validateProductData(productDto);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Product validation failed',
        errors: validation.errors,
        operationId,
      });
    }

    // Check if product code already exists in Dataverse
    const existingProduct = await this.productLookupService.findByProductCode(
      productDto.productCode,
    );

    if (existingProduct) {
      throw new ConflictException({
        message: PRODUCT_ORCHESTRATOR_ERRORS.PRODUCT_ALREADY_EXISTS,
        productCode: productDto.productCode,
        operationId,
      });
    }

    // Store DTO directly in session (conversion happens in ProductCrudService)
    const updatedSession = addProductToSession(session, productDto);

    // Save to Redis (session contains all data - no separate keys needed)
    await this.repository.saveSession(updatedSession);

    this.logger.debug(
      `Session after adding product: ${JSON.stringify(updatedSession)}`,
    );

    // Publish event
    this.eventService.publishProductAdded({
      sessionId,
      productCode: productDto.productCode,
      timestamp: new Date(),
      operationId,
    });

    this.logger.log(
      `✅ Added product data to session ${sessionId} - Code: ${productDto.productCode}`,
    );

    return updatedSession;
  }

  /**
   * Add audience target configuration to session
   */
  async addTargetConfiguration(
    sessionId: string,
    targetDto: AddTargetToSessionDto,
    operationId: string,
  ): Promise<ProductOrchestratorSession> {
    this.logger.log(`Adding target configuration to session ${sessionId}`);

    // Get session
    const session = await this.getSession(sessionId);

    // Debug: Log session state and product data
    this.logger.debug(
      `Session state: ${session.state}, Has product: ${!!session.product}`,
    );
    if (session.product) {
      this.logger.debug(
        `Product in session: ${JSON.stringify(session.product)}`,
      );
    }

    // Validate product was added first
    if (!session.product) {
      this.logger.error(
        `Validation failed for session ${sessionId}: Product data missing. Session keys: ${JSON.stringify(Object.keys(session))}`,
      );
      throw new BadRequestException({
        message: 'Product data must be added before target configuration',
        operationId,
      });
    }

    // Validate state transition
    this.validateStateTransition(
      session.state,
      ProductState.TARGET_CONFIGURED,
      sessionId,
    );

    // Validate target data
    const validation = validateTargetData(targetDto);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Target validation failed',
        errors: validation.errors,
        operationId,
      });
    }

    // Count configured fields (at least 1 required)
    const configuredFieldsCount = Object.keys(targetDto).filter(
      (key) =>
        targetDto[key as keyof CreateAudienceTargetDto] !== undefined &&
        targetDto[key as keyof CreateAudienceTargetDto] !== null,
    ).length;

    // Update session (store DTO directly)
    const updatedSession = addTargetToSession(session, targetDto);

    // Save to Redis (session contains all data - no separate keys needed)
    await this.repository.saveSession(updatedSession);

    this.logger.debug(
      `Session after adding target: ${JSON.stringify(updatedSession)}`,
    );

    // Publish event
    this.eventService.publishTargetConfigured({
      sessionId,
      productCode: session.product.productCode,
      targetFieldsCount: configuredFieldsCount,
      timestamp: new Date(),
      operationId,
    });

    this.logger.log(
      `✅ Added target configuration to session ${sessionId} - ${configuredFieldsCount} fields configured`,
    );

    return updatedSession;
  }

  /**
   * Commit session to Dataverse (create product + target)
   */
  async commitSession(
    sessionId: string,
    operationId: string,
  ): Promise<ProductOrchestratorCommitResult> {
    this.logger.log(`Committing product orchestrator session ${sessionId}`);

    // Get session
    const session = await this.getSession(sessionId);

    // Validate product data exists
    if (!session.product) {
      throw new BadRequestException({
        message: PRODUCT_ORCHESTRATOR_ERRORS.MISSING_PRODUCT_DATA,
        operationId,
      });
    }

    // Validate organization GUID exists
    if (!session.organizationGuid) {
      throw new BadRequestException({
        message: 'Organization GUID is required',
        operationId,
      });
    }

    // Validate state allows commit
    if (
      session.state !== ProductState.PRODUCT_ADDED &&
      session.state !== ProductState.TARGET_CONFIGURED
    ) {
      throw new BadRequestException({
        message: `Cannot commit session in state ${session.state}`,
        operationId,
      });
    }

    // Publish commit started event
    this.eventService.publishCommitStarted({
      sessionId,
      productCode: session.product.productCode,
      timestamp: new Date(),
      operationId,
    });

    // Attempt commit with retry
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_COMMIT_RETRIES; attempt++) {
      try {
        this.logger.log(
          `🔄 Commit attempt ${attempt}/${MAX_COMMIT_RETRIES} for session ${sessionId}`,
        );

        // ==========================================
        // STEP 1: CREATE PRODUCT (Foundation Entity)
        // ==========================================
        this.logger.log(`🏗️ Creating Product entity for session: ${sessionId}`);
        this.logger.debug(`Product DTO: ${JSON.stringify(session.product)}`);
        this.logger.debug(
          `User Privilege: ${session.userPrivilege}, Organization: ${session.organizationGuid}`,
        );

        const createdProduct =
          await this.productCrudService.createWithoutAutoTarget(
            session.product,
            session.userPrivilege,
            session.userId,
            session.organizationGuid,
            `${operationId}-product`,
          );

        const productGuid = createdProduct.osot_table_productid;

        this.logger.log(
          `✅ Product created successfully: Code=${createdProduct.osot_product_code}, GUID=${productGuid}`,
        );

        // ==========================================
        // STEP 2: CREATE AUDIENCE TARGET (Dependent Entity)
        // ==========================================
        this.logger.log(
          `🎯 Creating Audience Target for Product: ${productGuid}`,
        );

        const targetData = session.audienceTarget || {};
        const targetDto: CreateAudienceTargetDto = {
          'osot_Table_Product@odata.bind': `/osot_table_products(${productGuid})`,
          ...targetData,
        } as CreateAudienceTargetDto;

        this.logger.debug(`Target DTO: ${JSON.stringify(targetDto)}`);

        const createdTarget = await this.audienceTargetService.create(
          targetDto,
          session.userPrivilege,
          session.userId,
          `${operationId}-target`,
        );

        const targetGuid = createdTarget.osot_table_audience_targetid;

        this.logger.log(
          `✅ Audience Target created successfully: GUID=${targetGuid}`,
        );

        // Mark session as committed
        const committedSession = markSessionCommitted(
          session,
          productGuid,
          targetGuid,
        );
        await this.repository.saveSession(committedSession);

        // Publish success event
        this.eventService.publishCommitSuccess({
          sessionId,
          productGuid,
          targetGuid,
          productCode: session.product.productCode,
          timestamp: new Date(),
          operationId,
        });

        this.logger.log(
          `Successfully committed session ${sessionId} - Product: ${productGuid}, Target: ${targetGuid}`,
        );

        // Cleanup session after short delay
        setTimeout(() => {
          this.repository.deleteSession(sessionId).catch((error) => {
            this.logger.error(`Failed to cleanup session ${sessionId}`, error);
          });
        }, 5000); // 5 seconds delay

        return {
          success: true,
          productGuid,
          targetGuid,
          productCode: session.product.productCode,
          operationId,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack =
          error instanceof Error ? error.stack : 'No stack trace available';

        // Log FULL error details for debugging
        this.logger.error(
          `❌ COMMIT ATTEMPT ${attempt}/${MAX_COMMIT_RETRIES} FAILED for session ${sessionId}`,
        );
        this.logger.error(`Error Message: ${errorMessage}`);
        this.logger.error(`Error Stack: ${errorStack}`);
        this.logger.error(`Session: ${sessionId}`);
        this.logger.error(`Product Code: ${session.product?.productCode}`);
        this.logger.error(`User: ${session.userId}`);

        if (attempt < MAX_COMMIT_RETRIES) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    // All retries failed - mark session as failed
    const errors = [
      PRODUCT_ORCHESTRATOR_ERRORS.COMMIT_FAILED,
      lastError?.message || 'Unknown error',
    ];

    const failedSession = markSessionFailed(session, errors);
    await this.repository.saveSession(failedSession);

    // Publish failed event
    this.eventService.publishCommitFailed({
      sessionId,
      productCode: session.product.productCode,
      errors,
      timestamp: new Date(),
      operationId,
    });

    this.logger.error(
      `Failed to commit session ${sessionId} after ${MAX_COMMIT_RETRIES} attempts`,
    );

    return {
      success: false,
      errors,
      operationId,
    };
  }

  /**
   * Get session progress
   */
  async getSessionProgress(
    sessionId: string,
  ): Promise<ProductOrchestratorSession> {
    return this.getSession(sessionId);
  }

  /**
   * Get session by ID
   */
  private async getSession(
    sessionId: string,
  ): Promise<ProductOrchestratorSession> {
    const session = await this.repository.getSession(sessionId);

    if (!session) {
      throw new NotFoundException({
        message: PRODUCT_ORCHESTRATOR_ERRORS.SESSION_NOT_FOUND,
        sessionId,
      });
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      // Publish expired event
      this.eventService.publishSessionExpired({
        sessionId,
        timestamp: new Date(),
        operationId: session.operationId,
      });

      throw new BadRequestException({
        message: PRODUCT_ORCHESTRATOR_ERRORS.SESSION_EXPIRED,
        sessionId,
        expiresAt: session.expiresAt,
      });
    }

    return session;
  }

  /**
   * Validate state transition
   */
  private validateStateTransition(
    currentState: ProductState,
    newState: ProductState,
    sessionId: string,
  ): void {
    if (!isValidTransition(currentState, newState)) {
      throw new BadRequestException({
        message: PRODUCT_ORCHESTRATOR_ERRORS.INVALID_STATE_TRANSITION,
        currentState,
        attemptedState: newState,
        sessionId,
      });
    }
  }
}
