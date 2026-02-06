import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProductOrchestratorService } from '../services/product-orchestrator.service';
import { JwtAuthGuard } from '../../../../auth/jwt-auth.guard';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';

/**
 * Authenticated request with user context from JWT
 */
interface AuthenticatedRequest {
  user: {
    userId: string;
    userGuid: string;
    email: string;
    privilege: Privilege;
    role: string;
    userType: 'account' | 'affiliate';
    organizationId: string;
  };
}
import {
  ProductOrchestratorSessionDto,
  ProductOrchestratorResponseDto,
  ProductProgressDto,
} from '../dtos';
import {
  mapSessionToDto,
  mapSessionToProgressDto,
} from '../mappers/progress.mappers';
import { CreateProductDto } from '../../../others/product/dtos/create-product.dto';
import { AddTargetToSessionDto } from '../dtos/add-audience-target-to-session.dto';

/**
 * Product Orchestrator Private Controller
 * Admin-only endpoints for creating products with configured audience targets
 */
@ApiTags('Product Orchestrator (Admin)')
@Controller('private/products/orchestrate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductOrchestratorPrivateController {
  constructor(
    private readonly orchestratorService: ProductOrchestratorService,
  ) {}

  /**
   * Step 1: Create new product orchestrator session
   *
   * @description Initiates a product creation workflow that allows configuring
   * audience target BEFORE committing to Dataverse. Session expires after 2 hours.
   */
  @Post('session/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create product orchestrator session (Admin only)',
    description: `
**Workflow Overview:**

This endpoint initiates a Redis-first product creation workflow:

1. **Create Session** - Initialize workflow with 2-hour TTL
2. **Add Product Data** - Submit product details (name, price, etc.)
3. **Configure Target** (Optional) - Set audience targeting criteria
4. **Commit** - Create product + target in Dataverse atomically

**Why use orchestrator instead of direct POST /private/products?**

- ✅ Configure audience target BEFORE product creation
- ✅ Frontend can enable target configuration tab from start
- ✅ Redis validation before Dataverse writes
- ✅ Atomic commit (product + configured target)
- ✅ Better UX (1 step vs 2-step create → PATCH)

**Direct creation still available:**
- \`POST /private/products\` - Creates product with empty target (null = open-to-all)
- Use orchestrator when you need pre-configured targeting
`,
  })
  @ApiResponse({
    status: 201,
    description: 'Session created successfully',
    type: ProductOrchestratorSessionDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Only Admin users can create products',
  })
  async createSession(
    @Req() req: AuthenticatedRequest,
  ): Promise<ProductOrchestratorSessionDto> {
    const operationId = `create-product-session-${Date.now()}`;
    const organizationGuid = decryptOrganizationId(req.user.organizationId);

    const session = await this.orchestratorService.createSession(
      req.user.userId,
      req.user.privilege,
      organizationGuid,
      operationId,
    );

    return mapSessionToDto(session);
  }

  /**
   * Step 2: Add product data to session
   *
   * @description Submit product details (name, code, prices, etc.) for validation
   * in Redis before Dataverse commit.
   */
  @Post('session/:sessionId/product')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'sessionId',
    description: 'Session identifier from Step 1',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Add product data to session',
    description: `
**Product Data Requirements:**

- \`productCode\`: Must follow format \`osot-prd-XXXXXX\`
- \`productName\`: Display name (max 100 chars)
- \`productCategory\`: Membership | Insurance | Training | Other
- \`productStatus\`: Active | Inactive | Draft
- **At least ONE price field required**: \`priceOntario\`, \`priceQuebec\`, \`priceStudent\`, or \`priceOta\`
- \`glCode\`: General Ledger code for accounting
- Taxes: \`hst\`, \`gst\`, \`qst\` (optional, default 0)

**Validation:**
- Product code uniqueness checked against Dataverse
- Price values must be between 0 and 999,999.99
- All required fields validated via class-validator decorators
`,
  })
  @ApiResponse({
    status: 200,
    description: 'Product data added successfully',
    type: ProductOrchestratorSessionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid state transition',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Product code already exists' })
  async addProductData(
    @Param('sessionId') sessionId: string,
    @Body() productDto: CreateProductDto,
    @Req() _req: AuthenticatedRequest,
  ): Promise<ProductOrchestratorSessionDto> {
    const operationId = `add-product-${sessionId}-${Date.now()}`;

    const session = await this.orchestratorService.addProductData(
      sessionId,
      productDto,
      operationId,
    );

    return mapSessionToDto(session);
  }

  /**
   * Step 3: Configure audience target (OPTIONAL)
   *
   * @description Set targeting criteria for product visibility. All fields optional.
   * If omitted, product is open-to-all (target created with all null values).
   */
  @Post('session/:sessionId/audience-target')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'sessionId',
    description: 'Session identifier from Step 1',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Configure audience target (optional)',
    description: `
**Targeting Criteria (all optional):**

Each field accepts array of choices (0-50 selections):

**Geographic:**
- \`osot_location_province\`: [1, 2, 3] (Ontario, Quebec, BC, etc.)
- \`osot_location_region\`: [1, 2] (Urban, Rural, etc.)

**Employment:**
- \`osot_employment_status\`: [1, 3] (Full-time, Part-time, etc.)
- \`osot_employment_sector\`: [2, 5] (Healthcare, Education, etc.)
- \`osot_employment_setting\`: [1, 4] (Hospital, Private Practice, etc.)

**Professional:**
- \`osot_registration_class\`: [1] (OT, OTA, Student)
- \`osot_practice_area\`: [2, 5, 8] (Pediatrics, Mental Health, etc.)
- \`osot_years_in_practice\`: [3] (0-2, 3-5, 6-10, etc.)

**...and 25+ more targeting fields** (see CreateAudienceTargetDto schema)

**Default Behavior:**
- **Omit field = null = open-to-all** for that criterion
- Example: If only \`osot_location_province: [1,2]\` is set, product is visible to all users in Ontario/Quebec regardless of other criteria

**Note:** Product must be added (Step 2) before configuring target.
`,
  })
  @ApiResponse({
    status: 200,
    description: 'Target configuration added successfully',
    type: ProductOrchestratorSessionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or product not added yet',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async addTargetConfiguration(
    @Param('sessionId') sessionId: string,
    @Body() targetDto: AddTargetToSessionDto,
    @Req() _req: AuthenticatedRequest,
  ): Promise<ProductOrchestratorSessionDto> {
    const operationId = `add-target-${sessionId}-${Date.now()}`;

    const session = await this.orchestratorService.addTargetConfiguration(
      sessionId,
      targetDto,
      operationId,
    );

    return mapSessionToDto(session);
  }

  /**
   * Step 4: Commit session to Dataverse
   *
   * @description Creates product and audience target in Dataverse atomically.
   * Includes retry logic and rollback on failure.
   */
  @Post('session/:sessionId/commit')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'sessionId',
    description: 'Session identifier from Step 1',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Commit session to Dataverse',
    description: `
**Atomic Commit Process:**

1. **Create Product** in Dataverse
2. **Create Audience Target** linked to product
3. **If target creation fails** → Rollback product (delete)
4. **Retry logic**: 3 attempts with 1s delay
5. **Cleanup Redis** session after success

**Requirements:**
- Product data must be added (Step 2)
- Target configuration optional (Step 3)
- Session must be in valid state (product-added or target-configured)

**Result:**
- \`success: true\` → Product + Target created, GUIDs returned
- \`success: false\` → Commit failed, errors returned, session marked failed

**Auto-cleanup:**
- Successful sessions deleted from Redis after 5 seconds
- Failed sessions remain for debugging (expire after 2h)
`,
  })
  @ApiResponse({
    status: 200,
    description: 'Commit completed (check success field)',
    type: ProductOrchestratorResponseDto,
    schema: {
      example: {
        success: true,
        productGuid: '123e4567-e89b-12d3-a456-426614174000',
        targetGuid: '234e5678-f89b-12d3-a456-426614174111',
        productCode: 'osot-prd-000123',
        operationId: 'commit-product-1705415400000',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid state or missing product data',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async commitSession(
    @Param('sessionId') sessionId: string,
    @Req() _req: AuthenticatedRequest,
  ): Promise<ProductOrchestratorResponseDto> {
    const operationId = `commit-product-${sessionId}-${Date.now()}`;

    const result = await this.orchestratorService.commitSession(
      sessionId,
      operationId,
    );

    return result;
  }

  /**
   * Get session progress
   *
   * @description Check workflow progress and validation status
   */
  @Get('session/:sessionId/progress')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'sessionId',
    description: 'Session identifier from Step 1',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get session progress',
    description: `
**Progress Information:**

- \`state\`: Current workflow state (initiated → product-added → target-configured → committed)
- \`steps\`: Boolean flags for each completed step
- \`errors\`: Validation errors (if any)
- \`canCommit\`: Whether session is ready for commit
- \`expiresAt\`: Session expiration timestamp (2h from creation)

**Use case:** Frontend polls this endpoint to show progress UI
`,
  })
  @ApiResponse({
    status: 200,
    description: 'Session progress retrieved',
    type: ProductProgressDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found or expired' })
  async getSessionProgress(
    @Param('sessionId') sessionId: string,
  ): Promise<ProductProgressDto> {
    const session =
      await this.orchestratorService.getSessionProgress(sessionId);

    return mapSessionToProgressDto(session);
  }
}
