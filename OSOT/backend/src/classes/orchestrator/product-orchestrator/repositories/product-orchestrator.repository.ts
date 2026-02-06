import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import {
  ProductOrchestratorSession,
  PRODUCT_ORCHESTRATOR_REDIS_KEYS,
} from '../interfaces/product-orchestrator.interfaces';
import { ProductState } from '../enums/product-state.enum';
import { PRODUCT_SESSION_TTL_SECONDS } from '../constants/product-orchestrator.constants';
import { CreateProductDto } from '../../../others/product/dtos/create-product.dto';
import { CreateAudienceTargetDto } from '../../../others/audience-target/dtos/audience-target-create.dto';

/**
 * Product Orchestrator Repository
 * Manages Redis persistence for product creation sessions
 */
@Injectable()
export class ProductOrchestratorRepository {
  private readonly logger = new Logger(ProductOrchestratorRepository.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Save session to Redis
   */
  async saveSession(session: ProductOrchestratorSession): Promise<void> {
    const key = PRODUCT_ORCHESTRATOR_REDIS_KEYS.SESSION(session.sessionId);

    try {
      await this.redisService.set(key, JSON.stringify(session), {
        EX: PRODUCT_SESSION_TTL_SECONDS,
      });

      this.logger.log(
        `Saved product orchestrator session ${session.sessionId} with state ${session.state}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save session ${session.sessionId} to Redis`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get session from Redis
   */
  async getSession(
    sessionId: string,
  ): Promise<ProductOrchestratorSession | null> {
    const key = PRODUCT_ORCHESTRATOR_REDIS_KEYS.SESSION(sessionId);

    try {
      const data = await this.redisService.get(key);

      if (!data) {
        this.logger.warn(`Session ${sessionId} not found in Redis`);
        return null;
      }

      const session = JSON.parse(data) as ProductOrchestratorSession;

      // Parse dates
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      session.expiresAt = new Date(session.expiresAt);

      // Debug logging
      this.logger.debug(
        `Retrieved session ${sessionId} from Redis: state=${session.state}, has_product=${!!session.product}`,
      );
      if (session.product) {
        this.logger.debug(
          `Product data in session: ${JSON.stringify(session.product)}`,
        );
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to get session ${sessionId} from Redis`, error);
      throw error;
    }
  }

  /**
   * Delete session from Redis
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = PRODUCT_ORCHESTRATOR_REDIS_KEYS.SESSION(sessionId);
    const productKey = PRODUCT_ORCHESTRATOR_REDIS_KEYS.PRODUCT(sessionId);
    const targetKey = PRODUCT_ORCHESTRATOR_REDIS_KEYS.TARGET(sessionId);
    const validationKey = PRODUCT_ORCHESTRATOR_REDIS_KEYS.VALIDATION(sessionId);

    try {
      await Promise.all([
        this.redisService.del(sessionKey),
        this.redisService.del(productKey),
        this.redisService.del(targetKey),
        this.redisService.del(validationKey),
      ]);

      this.logger.log(`Deleted product orchestrator session ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete session ${sessionId} from Redis`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    const key = PRODUCT_ORCHESTRATOR_REDIS_KEYS.SESSION(sessionId);

    try {
      const data = await this.redisService.get(key);
      return data !== null;
    } catch (error) {
      this.logger.error(
        `Failed to check if session ${sessionId} exists`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update session state
   */
  async updateSessionState(
    sessionId: string,
    newState: ProductState,
  ): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.state = newState;
    session.updatedAt = new Date();

    await this.saveSession(session);
  }

  /**
   * Get all session data (product + target)
   */
  async getAllSessionData(sessionId: string): Promise<{
    product: CreateProductDto | null;
    target: Partial<CreateAudienceTargetDto> | null;
  }> {
    const productKey = PRODUCT_ORCHESTRATOR_REDIS_KEYS.PRODUCT(sessionId);
    const targetKey = PRODUCT_ORCHESTRATOR_REDIS_KEYS.TARGET(sessionId);

    try {
      const [productData, targetData] = await Promise.all([
        this.redisService.get(productKey),
        this.redisService.get(targetKey),
      ]);

      return {
        product: productData
          ? (JSON.parse(productData) as CreateProductDto)
          : null,
        target: targetData
          ? (JSON.parse(targetData) as Partial<CreateAudienceTargetDto>)
          : null,
      };
    } catch (error) {
      this.logger.error(`Failed to get session data for ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Store product data
   */
  async storeProductData(
    sessionId: string,
    productData: CreateProductDto,
  ): Promise<void> {
    const key = PRODUCT_ORCHESTRATOR_REDIS_KEYS.PRODUCT(sessionId);

    try {
      await this.redisService.set(key, JSON.stringify(productData), {
        EX: PRODUCT_SESSION_TTL_SECONDS,
      });

      this.logger.log(`Stored product data for session ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to store product data for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Store audience target data
   */
  async storeTargetData(
    sessionId: string,
    targetData: Partial<CreateAudienceTargetDto>,
  ): Promise<void> {
    const key = PRODUCT_ORCHESTRATOR_REDIS_KEYS.TARGET(sessionId);

    try {
      await this.redisService.set(key, JSON.stringify(targetData), {
        EX: PRODUCT_SESSION_TTL_SECONDS,
      });

      this.logger.log(`Stored target data for session ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to store target data for session ${sessionId}`,
        error,
      );
      throw error;
    }
  }
}
