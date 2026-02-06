import { ProductOrchestratorSession } from '../interfaces/product-orchestrator.interfaces';
import { ProductState } from '../enums/product-state.enum';
import { v4 as uuidv4 } from 'uuid';
import { CreateProductDto } from '../../../others/product/dtos/create-product.dto';
import { CreateAudienceTargetDto } from '../../../others/audience-target/dtos/audience-target-create.dto';
import { AddTargetToSessionDto } from '../dtos/add-audience-target-to-session.dto';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Create a new product orchestrator session
 */
export function createProductSession(
  userId: string,
  userPrivilege: Privilege,
  organizationGuid: string,
  operationId: string,
  ttlSeconds: number,
): ProductOrchestratorSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  return {
    sessionId: uuidv4(),
    state: ProductState.INITIATED,
    userId,
    userPrivilege,
    organizationGuid,
    createdAt: now,
    updatedAt: now,
    expiresAt,
    errors: [],
    operationId,
  };
}

/**
 * Update session state
 */
export function updateSessionState(
  session: ProductOrchestratorSession,
  newState: ProductState,
): ProductOrchestratorSession {
  return {
    ...session,
    state: newState,
    updatedAt: new Date(),
  };
}

/**
 * Add product data to session
 */
export function addProductToSession(
  session: ProductOrchestratorSession,
  productData: CreateProductDto,
): ProductOrchestratorSession {
  return {
    ...session,
    product: productData,
    state: ProductState.PRODUCT_ADDED,
    updatedAt: new Date(),
  };
}

/**
 * Add audience target data to session
 * Accepts both CreateAudienceTargetDto and AddTargetToSessionDto
 */
export function addTargetToSession(
  session: ProductOrchestratorSession,
  targetData: CreateAudienceTargetDto | AddTargetToSessionDto,
): ProductOrchestratorSession {
  return {
    ...session,
    audienceTarget: targetData,
    state: ProductState.TARGET_CONFIGURED,
    updatedAt: new Date(),
  };
}

/**
 * Mark session as committed
 */
export function markSessionCommitted(
  session: ProductOrchestratorSession,
  productGuid: string,
  targetGuid: string,
): ProductOrchestratorSession {
  return {
    ...session,
    state: ProductState.COMMITTED,
    productGuid,
    targetGuid,
    updatedAt: new Date(),
  };
}

/**
 * Mark session as failed
 */
export function markSessionFailed(
  session: ProductOrchestratorSession,
  errors: string[],
): ProductOrchestratorSession {
  return {
    ...session,
    state: ProductState.FAILED,
    errors,
    updatedAt: new Date(),
  };
}
