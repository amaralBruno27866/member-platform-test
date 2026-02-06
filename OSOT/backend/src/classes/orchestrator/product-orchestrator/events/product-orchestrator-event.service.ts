import { Injectable, Logger } from '@nestjs/common';

/**
 * Product Orchestrator Events
 * Publishes domain events for product creation workflow
 */

export interface ProductSessionCreatedEvent {
  sessionId: string;
  userId: string;
  timestamp: Date;
  operationId: string;
}

export interface ProductDataAddedEvent {
  sessionId: string;
  productCode: string;
  timestamp: Date;
  operationId: string;
}

export interface TargetConfiguredEvent {
  sessionId: string;
  productCode: string;
  targetFieldsCount: number;
  timestamp: Date;
  operationId: string;
}

export interface CommitStartedEvent {
  sessionId: string;
  productCode: string;
  timestamp: Date;
  operationId: string;
}

export interface CommitSuccessEvent {
  sessionId: string;
  productGuid: string;
  targetGuid: string;
  productCode: string;
  timestamp: Date;
  operationId: string;
}

export interface CommitFailedEvent {
  sessionId: string;
  productCode?: string;
  errors: string[];
  timestamp: Date;
  operationId: string;
}

export interface SessionExpiredEvent {
  sessionId: string;
  timestamp: Date;
  operationId: string;
}

@Injectable()
export class ProductOrchestratorEventService {
  private readonly logger = new Logger(ProductOrchestratorEventService.name);

  /**
   * Publish session created event
   */
  publishSessionCreated(event: ProductSessionCreatedEvent): void {
    this.logger.log(
      `Product orchestrator session created - Session: ${event.sessionId}, User: ${event.userId}`,
      {
        event: 'product-orchestrator.session.created',
        ...event,
      },
    );
  }

  /**
   * Publish product data added event
   */
  publishProductAdded(event: ProductDataAddedEvent): void {
    this.logger.log(
      `Product data added to session ${event.sessionId} - Code: ${event.productCode}`,
      {
        event: 'product-orchestrator.product.added',
        ...event,
      },
    );
  }

  /**
   * Publish target configured event
   */
  publishTargetConfigured(event: TargetConfiguredEvent): void {
    this.logger.log(
      `Target configured for session ${event.sessionId} - ${event.targetFieldsCount} fields set`,
      {
        event: 'product-orchestrator.target.configured',
        ...event,
      },
    );
  }

  /**
   * Publish commit started event
   */
  publishCommitStarted(event: CommitStartedEvent): void {
    this.logger.log(
      `Commit started for session ${event.sessionId} - Product: ${event.productCode}`,
      {
        event: 'product-orchestrator.commit.started',
        ...event,
      },
    );
  }

  /**
   * Publish commit success event
   */
  publishCommitSuccess(event: CommitSuccessEvent): void {
    this.logger.log(
      `Commit successful for session ${event.sessionId} - Product: ${event.productGuid}, Target: ${event.targetGuid}`,
      {
        event: 'product-orchestrator.commit.success',
        ...event,
      },
    );
  }

  /**
   * Publish commit failed event
   */
  publishCommitFailed(event: CommitFailedEvent): void {
    this.logger.error(
      `Commit failed for session ${event.sessionId} - Errors: ${event.errors.join(', ')}`,
      {
        event: 'product-orchestrator.commit.failed',
        ...event,
      },
    );
  }

  /**
   * Publish session expired event
   */
  publishSessionExpired(event: SessionExpiredEvent): void {
    this.logger.warn(`Session expired: ${event.sessionId}`, {
      event: 'product-orchestrator.session.expired',
      ...event,
    });
  }
}
