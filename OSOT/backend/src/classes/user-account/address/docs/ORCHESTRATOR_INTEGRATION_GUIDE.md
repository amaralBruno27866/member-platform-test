# Address Orchestrator Integration Guide

## Overview

This guide provides comprehensive documentation for integrating the Address Orchestrator into the existing Address Module. The orchestrator provides workflow coordination, session management, and seamless integration with the Account registration process.

## Orchestrator Architecture

### Core Components

#### 1. IAddressOrchestrator Interface

The central contract defining all orchestrator operations:

```typescript
export interface IAddressOrchestrator {
  // Session Management
  createSession(data: Partial<CreateAddressDto>): Promise<AddressSessionDto>;
  getSession(sessionId: string): Promise<AddressSessionDto | null>;
  updateSession(
    sessionId: string,
    data: Partial<CreateAddressDto>,
  ): Promise<AddressSessionDto>;
  clearSession(sessionId: string): Promise<void>;

  // Workflow Operations
  stageAddress(data: Partial<CreateAddressDto>): Promise<AddressSessionDto>;
  validateAddress(sessionId: string): Promise<AddressWorkflowResultDto>;
  persistAddress(sessionId: string): Promise<AddressWorkflowResultDto>;

  // Status Management
  getWorkflowStatus(sessionId: string): Promise<AddressWorkflowResultDto>;
  markStepComplete(sessionId: string, step: string): Promise<void>;
}
```

#### 2. Session Management DTOs

**AddressSessionDto**

```typescript
export class AddressSessionDto {
  sessionId: string;
  accountGuid?: string;
  status:
    | 'staging'
    | 'validating'
    | 'validated'
    | 'persisting'
    | 'completed'
    | 'error';
  currentStep: string;
  nextStep?: string;
  data: Partial<CreateAddressDto>;
  completedSteps: string[];
  errors: string[];
  createdAt: Date;
  expiresAt: Date;
}
```

**AddressWorkflowResultDto**

```typescript
export class AddressWorkflowResultDto {
  sessionId: string;
  success: boolean;
  status:
    | 'staging'
    | 'validating'
    | 'validated'
    | 'persisting'
    | 'completed'
    | 'error';
  message: string;
  data?: any;
  errors: string[];
  currentStep: string;
  nextStep?: string;
  completedSteps: string[];
  addressId?: string;
}
```

#### 3. Demo Orchestrator Service

The `AddressOrchestratorDemoService` provides a reference implementation demonstrating:

- Redis-based session management
- Multi-step workflow coordination
- Error handling and recovery
- Progress tracking and status management

## Integration Patterns

### 1. Controller Integration

#### Public Controller Integration

The orchestrator integrates with the public controller for registration workflows:

```typescript
@Controller('api/address')
export class AddressPublicController {
  constructor(
    private readonly orchestrator: IAddressOrchestrator,
    private readonly logger: Logger,
  ) {}

  @Post('stage')
  async stageAddress(
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<AddressSessionDto> {
    this.logger.log('Staging address for registration workflow');
    return await this.orchestrator.stageAddress(createAddressDto);
  }

  @Put('validate/:sessionId')
  async validateAddress(
    @Param('sessionId') sessionId: string,
  ): Promise<AddressWorkflowResultDto> {
    this.logger.log(`Validating address for session: ${sessionId}`);
    return await this.orchestrator.validateAddress(sessionId);
  }

  @Post('persist/:sessionId')
  async persistAddress(
    @Param('sessionId') sessionId: string,
  ): Promise<AddressWorkflowResultDto> {
    this.logger.log(`Persisting address for session: ${sessionId}`);
    return await this.orchestrator.persistAddress(sessionId);
  }

  @Get('status/:sessionId')
  async getStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<AddressWorkflowResultDto> {
    return await this.orchestrator.getWorkflowStatus(sessionId);
  }
}
```

#### Private Controller Integration

Standard authenticated operations continue through existing patterns:

```typescript
@Controller('api/address/private')
@UseGuards(JwtAuthGuard)
export class AddressPrivateController {
  constructor(
    private readonly addressCrudService: AddressCrudService,
    private readonly logger: Logger,
  ) {}

  @Get()
  async getAllAddresses(@User() user: any): Promise<AddressResponseDto[]> {
    return await this.addressCrudService.findByAccountGuid(user.accountGuid);
  }

  @Post()
  async createAddress(
    @Body() createAddressDto: CreateAddressDto,
    @User() user: any,
  ): Promise<AddressResponseDto> {
    return await this.addressCrudService.create({
      ...createAddressDto,
      accountGuid: user.accountGuid,
    });
  }
}
```

### 2. Service Layer Integration

#### Redis Session Management

The orchestrator leverages Redis for temporary session storage:

```typescript
// Session Creation
const sessionId = uuidv4();
const sessionKey = `address:session:${sessionId}`;
const sessionData = {
  sessionId,
  status: 'staging',
  currentStep: 'data-collection',
  nextStep: 'validation',
  data: addressData,
  completedSteps: [],
  errors: [],
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
};

await this.redisService.setex(sessionKey, 1800, JSON.stringify(sessionData));
```

#### Business Rule Integration

The orchestrator coordinates with existing business rule services:

```typescript
// Validation Workflow Step
async validateAddress(sessionId: string): Promise<AddressWorkflowResultDto> {
  const session = await this.getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found or expired`);
  }

  try {
    // Use existing business rule service
    const validationResult = await this.businessRuleService.validateAddressData(session.data);

    if (validationResult.isValid) {
      session.status = 'validated';
      session.currentStep = 'validation-complete';
      session.nextStep = 'persistence';
      session.completedSteps.push('validation');

      // Normalize data using existing utilities
      const normalizedData = await this.businessRuleService.normalizeAddressData(session.data);
      session.data = { ...session.data, ...normalizedData };
    } else {
      session.status = 'error';
      session.errors = validationResult.errors;
    }

    await this.updateSession(sessionId, session);

    return {
      sessionId,
      success: validationResult.isValid,
      status: session.status,
      message: validationResult.isValid ? 'Address validated successfully' : 'Validation failed',
      errors: session.errors,
      currentStep: session.currentStep,
      nextStep: session.nextStep,
      completedSteps: session.completedSteps
    };
  } catch (error) {
    this.logger.error(`Validation failed for session ${sessionId}:`, error);
    session.status = 'error';
    session.errors.push(`Validation error: ${error.message}`);
    await this.updateSession(sessionId, session);
    throw error;
  }
}
```

#### CRUD Service Integration

Final persistence leverages existing CRUD operations:

```typescript
// Persistence Workflow Step
async persistAddress(sessionId: string): Promise<AddressWorkflowResultDto> {
  const session = await this.getSession(sessionId);
  if (!session || session.status !== 'validated') {
    throw new Error(`Session ${sessionId} not ready for persistence`);
  }

  try {
    session.status = 'persisting';
    session.currentStep = 'data-persistence';
    await this.updateSession(sessionId, session);

    // Use existing CRUD service
    const createdAddress = await this.addressCrudService.create(session.data as CreateAddressDto);

    session.status = 'completed';
    session.currentStep = 'workflow-complete';
    session.completedSteps.push('persistence');
    session.data.id = createdAddress.id;

    await this.updateSession(sessionId, session);

    return {
      sessionId,
      success: true,
      status: 'completed',
      message: 'Address created successfully',
      data: createdAddress,
      errors: [],
      currentStep: session.currentStep,
      completedSteps: session.completedSteps,
      addressId: createdAddress.id
    };
  } catch (error) {
    this.logger.error(`Persistence failed for session ${sessionId}:`, error);
    session.status = 'error';
    session.errors.push(`Persistence error: ${error.message}`);
    await this.updateSession(sessionId, session);
    throw error;
  }
}
```

## Workflow Coordination

### Complete Address Registration Flow

#### Step 1: Address Staging

```http
POST /api/address/stage
Content-Type: application/json

{
  "addressType": "primary",
  "address1": "123 Main Street",
  "address2": "Apt 4B",
  "city": "Ottawa",
  "province": "Ontario",
  "postalCode": "K1A 0A6",
  "country": "Canada",
  "accountGuid": "12345678-1234-1234-1234-123456789012"
}

Response:
{
  "sessionId": "addr_session_abc123",
  "status": "staging",
  "currentStep": "data-collection",
  "nextStep": "validation",
  "data": { ... },
  "completedSteps": [],
  "errors": [],
  "createdAt": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-15T10:30:00Z"
}
```

#### Step 2: Address Validation

```http
PUT /api/address/validate/addr_session_abc123

Response:
{
  "sessionId": "addr_session_abc123",
  "success": true,
  "status": "validated",
  "message": "Address validated successfully",
  "currentStep": "validation-complete",
  "nextStep": "persistence",
  "completedSteps": ["validation"],
  "errors": []
}
```

#### Step 3: Address Persistence

```http
POST /api/address/persist/addr_session_abc123

Response:
{
  "sessionId": "addr_session_abc123",
  "success": true,
  "status": "completed",
  "message": "Address created successfully",
  "data": {
    "id": "addr_67890",
    "addressType": "primary",
    "address1": "123 Main Street",
    "address2": "Apt 4B",
    "city": "Ottawa",
    "province": "Ontario",
    "postalCode": "K1A 0A6",
    "country": "Canada",
    "isPrimary": true,
    "createdAt": "2024-01-15T10:05:00Z"
  },
  "currentStep": "workflow-complete",
  "completedSteps": ["validation", "persistence"],
  "addressId": "addr_67890",
  "errors": []
}
```

#### Step 4: Status Monitoring

```http
GET /api/address/status/addr_session_abc123

Response:
{
  "sessionId": "addr_session_abc123",
  "success": true,
  "status": "completed",
  "message": "Address workflow completed successfully",
  "currentStep": "workflow-complete",
  "completedSteps": ["validation", "persistence"],
  "addressId": "addr_67890",
  "errors": []
}
```

## Error Handling and Recovery

### Session Management Errors

#### Expired Session Handling

```typescript
async getSession(sessionId: string): Promise<AddressSessionDto | null> {
  try {
    const sessionKey = `address:session:${sessionId}`;
    const sessionData = await this.redisService.get(sessionKey);

    if (!sessionData) {
      this.logger.warn(`Session ${sessionId} not found or expired`);
      return null;
    }

    const session = JSON.parse(sessionData) as AddressSessionDto;

    // Check manual expiration
    if (new Date() > new Date(session.expiresAt)) {
      this.logger.warn(`Session ${sessionId} has expired manually`);
      await this.clearSession(sessionId);
      return null;
    }

    return session;
  } catch (error) {
    this.logger.error(`Error retrieving session ${sessionId}:`, error);
    return null;
  }
}
```

#### Validation Error Recovery

```typescript
// Validation failures return structured errors
{
  "sessionId": "addr_session_abc123",
  "success": false,
  "status": "error",
  "message": "Address validation failed",
  "currentStep": "validation",
  "errors": [
    "Postal code K1A0A6 is invalid format. Expected: K1A 0A6",
    "Province 'ON' not recognized. Use full name: Ontario"
  ],
  "completedSteps": []
}
```

#### Persistence Error Recovery

```typescript
// Database errors during persistence
try {
  const createdAddress = await this.addressCrudService.create(session.data);
} catch (error) {
  if (error.code === 'DUPLICATE_ADDRESS') {
    session.status = 'error';
    session.errors.push('Address already exists for this account');
  } else if (error.code === 'VALIDATION_FAILED') {
    session.status = 'error';
    session.errors.push('Data validation failed during persistence');
  } else {
    session.status = 'error';
    session.errors.push(`Unexpected error: ${error.message}`);
  }
  await this.updateSession(sessionId, session);
  throw error;
}
```

## Testing and Validation

### Unit Testing Orchestrator Components

#### Session Management Tests

```typescript
describe('AddressOrchestrator Session Management', () => {
  it('should create session with proper expiration', async () => {
    const addressData = { address1: '123 Main St', city: 'Ottawa' };
    const session = await orchestrator.createSession(addressData);

    expect(session.sessionId).toBeDefined();
    expect(session.status).toBe('staging');
    expect(session.data).toEqual(addressData);
    expect(new Date(session.expiresAt)).toBeAfter(new Date());
  });

  it('should retrieve existing session', async () => {
    const session = await orchestrator.createSession({});
    const retrieved = await orchestrator.getSession(session.sessionId);

    expect(retrieved).toEqual(session);
  });

  it('should return null for expired session', async () => {
    // Test with mock expired session
    const expiredSessionId = 'expired_session';
    const result = await orchestrator.getSession(expiredSessionId);

    expect(result).toBeNull();
  });
});
```

#### Workflow Validation Tests

```typescript
describe('AddressOrchestrator Workflow', () => {
  it('should complete full address workflow', async () => {
    const addressData = {
      addressType: 'primary',
      address1: '123 Main Street',
      city: 'Ottawa',
      province: 'Ontario',
      postalCode: 'K1A 0A6',
      country: 'Canada',
    };

    // Stage address
    const session = await orchestrator.stageAddress(addressData);
    expect(session.status).toBe('staging');

    // Validate address
    const validationResult = await orchestrator.validateAddress(
      session.sessionId,
    );
    expect(validationResult.success).toBe(true);
    expect(validationResult.status).toBe('validated');

    // Persist address
    const persistResult = await orchestrator.persistAddress(session.sessionId);
    expect(persistResult.success).toBe(true);
    expect(persistResult.status).toBe('completed');
    expect(persistResult.addressId).toBeDefined();
  });

  it('should handle validation errors gracefully', async () => {
    const invalidAddressData = {
      addressType: 'primary',
      address1: '', // Invalid empty address
      postalCode: 'INVALID', // Invalid postal code
    };

    const session = await orchestrator.stageAddress(invalidAddressData);
    const validationResult = await orchestrator.validateAddress(
      session.sessionId,
    );

    expect(validationResult.success).toBe(false);
    expect(validationResult.status).toBe('error');
    expect(validationResult.errors).toHaveLength(2);
  });
});
```

### Integration Testing with Controllers

#### End-to-End Workflow Tests

```typescript
describe('Address Registration Integration', () => {
  it('should complete address registration workflow via API', async () => {
    // Stage address
    const stageResponse = await request(app)
      .post('/api/address/stage')
      .send({
        addressType: 'primary',
        address1: '123 Main Street',
        city: 'Ottawa',
        province: 'Ontario',
        postalCode: 'K1A 0A6',
        country: 'Canada',
      })
      .expect(201);

    const sessionId = stageResponse.body.sessionId;

    // Validate address
    const validateResponse = await request(app)
      .put(`/api/address/validate/${sessionId}`)
      .expect(200);

    expect(validateResponse.body.success).toBe(true);

    // Persist address
    const persistResponse = await request(app)
      .post(`/api/address/persist/${sessionId}`)
      .expect(201);

    expect(persistResponse.body.success).toBe(true);
    expect(persistResponse.body.addressId).toBeDefined();

    // Verify address created
    const address = await addressCrudService.findById(
      persistResponse.body.addressId,
    );
    expect(address).toBeDefined();
    expect(address.address1).toBe('123 Main Street');
  });
});
```

## Performance Considerations

### Session Management Optimization

#### Redis Configuration

```typescript
// Optimal Redis settings for address sessions
const redisConfig = {
  ttl: 1800, // 30 minutes default session TTL
  maxSessions: 10000, // Maximum concurrent sessions
  cleanupInterval: 300, // 5 minutes cleanup cycle
  keyPrefix: 'address:session:',
  serialization: 'json', // JSON serialization with Date handling
};
```

#### Memory Management

```typescript
// Automatic session cleanup
async cleanupExpiredSessions(): Promise<void> {
  const pattern = 'address:session:*';
  const keys = await this.redisService.keys(pattern);

  for (const key of keys) {
    const sessionData = await this.redisService.get(key);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (new Date() > new Date(session.expiresAt)) {
        await this.redisService.del(key);
        this.logger.debug(`Cleaned up expired session: ${key}`);
      }
    }
  }
}
```

### Workflow Performance

#### Batch Operations

```typescript
// Support for bulk address operations
async stageBatchAddresses(addresses: CreateAddressDto[]): Promise<AddressSessionDto[]> {
  const sessions = await Promise.all(
    addresses.map(address => this.stageAddress(address))
  );
  return sessions;
}

async validateBatchAddresses(sessionIds: string[]): Promise<AddressWorkflowResultDto[]> {
  const results = await Promise.all(
    sessionIds.map(sessionId => this.validateAddress(sessionId))
  );
  return results;
}
```

#### Monitoring and Metrics

```typescript
// Performance monitoring integration
private trackWorkflowMetrics(sessionId: string, step: string, duration: number): void {
  this.metricsService.timing('address.workflow.step.duration', duration, {
    step,
    sessionId: sessionId.substring(0, 8) // Truncated for privacy
  });
}

private trackSessionLifecycle(sessionId: string, event: string): void {
  this.metricsService.increment('address.session.lifecycle', 1, {
    event,
    sessionId: sessionId.substring(0, 8)
  });
}
```

## Security and Best Practices

### Session Security

- **Session IDs**: Use cryptographically secure UUIDs
- **Expiration**: Enforce both Redis TTL and manual expiration checking
- **Data Sanitization**: Sanitize all address data before storage
- **Access Control**: Validate session ownership where applicable

### Error Handling Best Practices

- **Structured Errors**: Return consistent error format across all operations
- **Error Logging**: Log errors with sufficient context for debugging
- **Recovery Mechanisms**: Provide clear guidance for error recovery
- **Rate Limiting**: Implement rate limiting on orchestrator endpoints

### Data Management

- **Session Cleanup**: Implement automatic cleanup of expired sessions
- **Data Retention**: Define clear data retention policies
- **Audit Trail**: Log all orchestrator operations for audit purposes
- **Backup Strategy**: Ensure Redis sessions can be restored if needed

## Migration and Deployment

### Existing System Integration

The orchestrator is designed for backward compatibility:

- **Existing CRUD operations** continue to work unchanged
- **Private controller endpoints** remain fully functional
- **Database schema** requires no modifications
- **Service dependencies** are preserved and leveraged

### Deployment Strategy

1. **Phase 1**: Deploy orchestrator components without breaking existing functionality
2. **Phase 2**: Enable orchestrator endpoints alongside existing endpoints
3. **Phase 3**: Migrate registration workflows to use orchestrator pattern
4. **Phase 4**: Monitor and optimize orchestrator performance

### Configuration Management

```typescript
// Environment-specific orchestrator configuration
export const orchestratorConfig = {
  redis: {
    sessionTtl: parseInt(process.env.ADDRESS_SESSION_TTL) || 1800,
    keyPrefix: process.env.ADDRESS_SESSION_PREFIX || 'address:session:',
    maxSessions: parseInt(process.env.ADDRESS_MAX_SESSIONS) || 10000,
  },
  workflow: {
    enableValidation: process.env.ADDRESS_ENABLE_VALIDATION !== 'false',
    enablePersistence: process.env.ADDRESS_ENABLE_PERSISTENCE !== 'false',
    allowSkipSteps: process.env.ADDRESS_ALLOW_SKIP_STEPS === 'true',
  },
  monitoring: {
    enableMetrics: process.env.ADDRESS_ENABLE_METRICS !== 'false',
    logLevel: process.env.ADDRESS_LOG_LEVEL || 'info',
  },
};
```

This comprehensive integration guide ensures the Address Orchestrator seamlessly extends existing Address Module capabilities while providing powerful workflow coordination for complex registration scenarios.
