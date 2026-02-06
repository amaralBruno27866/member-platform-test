# OTA Education Orchestrator Module

## Overview

The OTA Education Orchestrator module provides a comprehensive framework for managing complex OTA Education workflows through Redis-based session management, step-by-step validation, and coordinated service interactions.

## ⚠️ Important Note

**This module contains DEMONSTRATION implementations** showing patterns and architecture for the future OtaEducationOrchestrator. The services shown here use mock implementations to illustrate the intended workflow structure, error handling patterns, and integration approach.

## Architecture

### Core Components

- **Interface Contracts**: Define orchestrator service contracts and session management interfaces
- **Session DTOs**: Provide data structures for Redis session storage and API communication
- **Workflow Result DTOs**: Define comprehensive result structures for all orchestrator operations
- **Session Service**: Demonstration service showing orchestrator patterns and workflows

### Key Features

- **Redis Session Management**: Persistent session storage with expiration handling
- **Step-by-Step Validation**: Coordinated validation across multiple service layers
- **Education Category Determination**: Intelligent categorization based on graduation year and membership status
- **Account Linking Validation**: Secure association between education records and user accounts
- **Event-Driven Architecture**: Comprehensive audit trail and notification system
- **Error Handling**: Structured error management with detailed context
- **Workflow Coordination**: Complex multi-step process management

## Module Structure

```
orchestrator/
├── interfaces/
│   └── ota-education-orchestrator-contracts.interface.ts  # Service contracts
├── dto/
│   ├── ota-education-session.dto.ts                      # Session management DTOs
│   └── ota-education-workflow-results.dto.ts             # Workflow result DTOs
├── services/
│   └── ota-education-session.service.ts                  # Demonstration session service
├── index.ts                                             # Module exports
└── README.md                                            # This documentation
```

## Session Management

### Registration Session Structure

```typescript
interface OtaEducationRegistrationSession {
  sessionId: string;
  userBusinessId: string;
  status: OtaEducationRegistrationStatus;
  createdAt: string;
  lastUpdatedAt: string;
  expiresAt?: string;
  educationData: OtaEducationSessionData;
  progress: OtaEducationProgressState;
  validation: OtaEducationValidationMetadata;
  linkedAccountId?: string;
  createdEducationId?: string;
  errorMessage?: string;
  userPrivilege?: Privilege;
}
```

### Session Status Flow

1. **PENDING** → Initial state when session is created
2. **STAGED** → Education data successfully stored in Redis
3. **VALIDATED** → All validation checks passed
4. **CATEGORY_DETERMINED** → Education category assigned
5. **ACCOUNT_LINKED** → Associated with user account
6. **EDUCATION_CREATED** → Record persisted to Dataverse
7. **WORKFLOW_COMPLETED** → All steps completed successfully
8. **CREATION_FAILED** → Error occurred during workflow

## Validation Workflow

### College-Country Alignment

The orchestrator validates that the specified college is geographically consistent with the selected country:

```typescript
interface CollegeCountryValidation {
  college: string; // College name
  country: number; // Country enum value
  isValid: boolean; // Alignment validation result
  confidence: number; // Validation confidence (0-100)
  suggestions?: string[]; // Alternative college suggestions
}
```

### University-Country Pairing

Validates that the university and country combination is valid:

```typescript
interface UniversityCountryValidation {
  university: OtUniversity; // University enum value
  country: Country; // Country enum value
  isValid: boolean; // Pairing validation result
  reasons?: string[]; // Validation failure reasons
}
```

### User Business ID Uniqueness

Ensures the user business ID is unique across the system:

```typescript
interface UserBusinessIdValidation {
  userBusinessId: string; // Business ID to validate
  isUnique: boolean; // Uniqueness check result
  existingRecords?: any[]; // Conflicting records if any
}
```

## Workflow Steps

### 1. Stage Education Data

```typescript
// Create session with education data
const stageRequest: OtaEducationStageRequest = {
  userBusinessId: 'user-123',
  educationData: {
    userBusinessId: 'user-123',
    graduationYear: 2024,
    university: OtUniversity.UNIVERSITY_OF_TORONTO,
    country: Country.CANADA,
    degreeType: DegreeType.MASTERS,
    college: 'College of Health Sciences',
    accessModifier: AccessModifier.PRIVATE,
  },
  options: {
    expirationHours: 24,
    skipValidation: false,
    priority: 'normal',
  },
};

const stageResponse =
  await orchestrator.stageEducationRegistration(stageRequest);
```

### 2. Validate Education Data

```typescript
// Perform comprehensive validation
const validationResult = await orchestrator.validateEducationData(sessionId);

if (validationResult.isValid) {
  console.log(
    `Validation passed with score: ${validationResult.validationScore}`,
  );
} else {
  console.log('Validation failed:', validationResult.criticalFailures);
}
```

### 3. Link to Account

```typescript
// Associate session with user account
const linkingResult = await orchestrator.linkEducationToAccount(
  sessionId,
  accountId,
);

if (linkingResult.linked) {
  console.log(`Linked to account: ${linkingResult.linkedAccountId}`);
}
```

### 4. Create Education Record

```typescript
// Create final education record
const creationResult = await orchestrator.createEducationRecord(sessionId);

if (creationResult.created) {
  console.log(`Education created: ${creationResult.createdEducationId}`);
}
```

### 5. Complete Workflow

```typescript
// Finalize the workflow
const completionResult = await orchestrator.completeWorkflow(sessionId);

console.log('Workflow completed:', completionResult.metadata);
```

## Service Integration

### OTA Education Services

The orchestrator coordinates with several OTA Education services:

- **OtaEducationCrudService**: Final record creation and management
- **OtaEducationBusinessRuleService**: Validation logic and business rules
- **OtaEducationLookupService**: Reference data queries and statistics
- **OtaEducationRepositoryService**: Data access layer operations
- **OtaEducationEventsService**: Audit trail and event notifications

### External Dependencies

- **RedisService**: Session persistence and management
- **DataverseModule**: External data integration
- **Common Enums**: Shared enumeration definitions
- **Error Factory**: Structured error handling

## Error Handling

### Error Categories

- **Session Errors**: Session not found, expired, or corrupted
- **Validation Errors**: Data validation failures
- **Business Rule Violations**: College-country misalignment, duplicate business IDs
- **Integration Errors**: External service communication failures
- **Workflow Errors**: Step transition failures

### Error Structure

```typescript
interface OtaEducationWorkflowError {
  code: string; // Error identifier
  message: string; // Human-readable message
  severity: 'warning' | 'error' | 'critical';
  field?: string; // Field that caused error
  context?: Record<string, any>; // Additional error context
}
```

## Usage Examples

### Complete Workflow Example

```typescript
import {
  OtaEducationSessionService,
  OtaEducationStageRequest,
  OtaEducationRegistrationStatus,
} from './orchestrator';

class OtaEducationWorkflowExample {
  constructor(private readonly sessionService: OtaEducationSessionService) {}

  async processEducationRegistration(educationData: any): Promise<string> {
    // 1. Stage the data
    const stageRequest: OtaEducationStageRequest = {
      userBusinessId: educationData.userBusinessId,
      educationData,
      options: { expirationHours: 24 },
    };

    const stageResponse =
      await this.sessionService.stageEducationRegistration(stageRequest);
    const sessionId = stageResponse.sessionId;

    // 2. Validate the education data
    const validationResult =
      await this.sessionService.validateEducationData(sessionId);
    if (!validationResult.isValid) {
      throw new Error(
        `Validation failed: ${validationResult.criticalFailures.map((e) => e.message).join(', ')}`,
      );
    }

    // 3. Link to account
    const linkingResult = await this.sessionService.linkEducationToAccount(
      sessionId,
      educationData.accountId,
    );
    if (!linkingResult.linked) {
      throw new Error('Account linking failed');
    }

    // 4. Create the education record
    const creationResult =
      await this.sessionService.createEducationRecord(sessionId);
    if (!creationResult.created) {
      throw new Error('Education record creation failed');
    }

    // 5. Complete the workflow
    await this.sessionService.completeWorkflow(sessionId);

    return creationResult.createdEducationId!;
  }
}
```

### Session Monitoring Example

```typescript
import { OtaEducationRegistrationStatus } from './orchestrator';

class SessionMonitor {
  async checkSessionProgress(sessionId: string) {
    const session = await sessionService.getSessionStatus(sessionId);

    console.log(`Session ${sessionId} status: ${session.status}`);
    console.log('Progress:', {
      staged: session.progress.staged,
      validated: session.progress.validated,
      accountLinked: session.progress.accountLinked,
      persisted: session.progress.persisted,
    });

    if (session.status === OtaEducationRegistrationStatus.WORKFLOW_COMPLETED) {
      console.log(`Education created: ${session.createdEducationId}`);
    }
  }
}
```

## Future Implementation

### Production Orchestrator

When implementing the production orchestrator:

1. **Replace Mock Storage**: Implement actual Redis-based session management
2. **Service Integration**: Connect to real OTA Education services
3. **Event System**: Implement comprehensive audit trail and notifications
4. **Error Recovery**: Add workflow rollback and recovery mechanisms
5. **Performance Monitoring**: Add metrics and monitoring capabilities
6. **Security**: Implement proper session security and validation

### Integration Points

- **Redis Configuration**: Session storage, expiration, and cleanup
- **Service Discovery**: Dynamic service registration and health checks
- **Event Bus**: Publish/subscribe for audit trail and notifications
- **Monitoring**: Application metrics, performance tracking, error rates
- **Security**: Session encryption, access control, audit logging

## API Reference

### Key Types

```typescript
// Session management
export type { OtaEducationRegistrationSession } from './dto/ota-education-session.dto';
export type { OtaEducationStageRequest } from './dto/ota-education-session.dto';
export type { OtaEducationStageResponse } from './dto/ota-education-session.dto';

// Workflow results
export type { OtaEducationWorkflowResult } from './dto/ota-education-workflow-results.dto';
export type { OtaEducationValidationResult } from './dto/ota-education-workflow-results.dto';
export type { OtaEducationCreationResult } from './dto/ota-education-workflow-results.dto';

// Service contracts
export type { OtaEducationOrchestrator } from './interfaces/ota-education-orchestrator-contracts.interface';
```

### Enums

```typescript
export { OtaEducationRegistrationStatus } from './dto/ota-education-session.dto';
export { OtaEducationWorkflowStep } from './dto/ota-education-workflow-results.dto';
export { OtaEducationWorkflowAction } from './dto/ota-education-workflow-results.dto';
```

## Version History

- **1.0.0**: Initial orchestrator implementation with demonstration patterns
- Future versions will include production-ready Redis integration and comprehensive service coordination

## Support

For questions about the OTA Education Orchestrator implementation, refer to:

- OTA Education Module documentation
- Common patterns in OT Education Orchestrator
- OSOT project architecture guidelines
