import { ProductState } from '../enums/product-state.enum';
import { CreateProductDto } from '../../../others/product/dtos/create-product.dto';
import { CreateAudienceTargetDto } from '../../../others/audience-target/dtos/audience-target-create.dto';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Product Orchestrator Session (Redis)
 * Stores temporary data during product creation workflow
 */
export interface ProductOrchestratorSession {
  /** Unique session identifier (UUID) */
  sessionId: string;

  /** Current state of the session */
  state: ProductState;

  /** Admin user ID who initiated session */
  userId: string;

  /** User privilege (Admin/Main only) */
  userPrivilege: Privilege;

  /** Session creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Session expiration timestamp (2 hours from creation) */
  expiresAt: Date;

  /** Product data (if added) - Stored as DTO for Redis */
  product?: CreateProductDto;

  /** Organization GUID for tenant isolation */
  organizationGuid?: string;

  /** Audience target data (if configured) - Stored as DTO for Redis */
  audienceTarget?: Partial<CreateAudienceTargetDto>;

  /** Validation errors (if any) */
  errors?: string[];

  /** Operation ID for tracking */
  operationId: string;

  /** Product GUID after commit (if successful) */
  productGuid?: string;

  /** Target GUID after commit (if successful) */
  targetGuid?: string;
}

/**
 * Product Orchestrator Progress
 * Tracks completion of workflow steps
 */
export interface ProductOrchestratorProgress {
  sessionId: string;
  state: ProductState;
  steps: {
    productAdded: boolean;
    targetConfigured: boolean;
    committed: boolean;
  };
  errors: string[];
  canCommit: boolean;
  expiresAt: Date;
}

/**
 * Product Orchestrator Commit Result
 * Result of committing session to Dataverse
 */
export interface ProductOrchestratorCommitResult {
  success: boolean;
  productGuid?: string;
  targetGuid?: string;
  productCode?: string;
  errors?: string[];
  operationId: string;
}

/**
 * Redis Keys for Product Orchestrator
 */
export const PRODUCT_ORCHESTRATOR_REDIS_KEYS = {
  SESSION: (sessionId: string) => `product-orchestrator:session:${sessionId}`,
  PRODUCT: (sessionId: string) => `product-orchestrator:product:${sessionId}`,
  TARGET: (sessionId: string) => `product-orchestrator:target:${sessionId}`,
  VALIDATION: (sessionId: string) =>
    `product-orchestrator:validation:${sessionId}`,
} as const;
