import {
  ProductOrchestratorSession,
  ProductOrchestratorProgress,
} from '../interfaces/product-orchestrator.interfaces';
import { ProductState } from '../enums/product-state.enum';
import { ProductOrchestratorSessionDto, ProductProgressDto } from '../dtos';

/**
 * Map session data to session DTO
 */
export function mapSessionToDto(
  session: ProductOrchestratorSession,
): ProductOrchestratorSessionDto {
  return {
    sessionId: session.sessionId,
    state: session.state,
    expiresAt: session.expiresAt,
    operationId: session.operationId,
  };
}

/**
 * Map session data to progress DTO
 */
export function mapSessionToProgressDto(
  session: ProductOrchestratorSession,
): ProductProgressDto {
  const progress = calculateProgress(session);

  return {
    sessionId: session.sessionId,
    state: session.state,
    steps: progress.steps,
    errors: progress.errors,
    canCommit: progress.canCommit,
    expiresAt: session.expiresAt,
  };
}

/**
 * Calculate progress from session data
 */
export function calculateProgress(
  session: ProductOrchestratorSession,
): ProductOrchestratorProgress {
  const productAdded = !!session.product;
  const targetConfigured = !!session.audienceTarget;
  const committed = session.state === ProductState.COMMITTED;

  // Can commit if product is added and no errors
  const canCommit =
    productAdded &&
    (session.errors?.length ?? 0) === 0 &&
    session.state !== ProductState.COMMITTED &&
    session.state !== ProductState.COMPLETED &&
    session.state !== ProductState.FAILED;

  return {
    sessionId: session.sessionId,
    state: session.state,
    steps: {
      productAdded,
      targetConfigured,
      committed,
    },
    errors: session.errors ?? [],
    canCommit,
    expiresAt: session.expiresAt,
  };
}
