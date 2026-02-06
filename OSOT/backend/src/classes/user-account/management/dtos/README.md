# Management DTOs

This directory contains all Data Transfer Objects (DTOs) for the Management module, designed for seamless integration with Microsoft Dataverse and comprehensive business rule validation.

## Overview

The Management DTOs provide a complete set of type-safe data structures for handling account management operations, including:

- **Account Configuration**: User business identity and management settings
- **Lifecycle Management**: Member status tracking and retirement management
- **Business Services**: Vendor, advertising, recruitment, and rehabilitation services
- **Access Control**: Privilege levels and visibility settings
- **Administrative Operations**: Creation, updates, queries, and reporting

## DTO Structure

### Core DTOs

#### 1. ManagementBasicDto

The foundation DTO containing all management fields with comprehensive validation.

**Key Features:**

- Complete field structure aligned with Table Account Management.csv
- Business rule validation through custom validators
- Enum integration for AccessModifier and Privilege
- Swagger API documentation

**Usage:**

```typescript
import { ManagementBasicDto } from './management-basic.dto';

// Example field structure
const management: ManagementBasicDto = {
  osot_user_business_id: 'USR-BUSINESS-001-2024',
  osot_life_member_retired: false,
  osot_shadowing: false,
  osot_passed_away: false,
  osot_vendor: false,
  osot_advertising: false,
  osot_recruitment: false,
  osot_driver_rehab: false,
  osot_access_modifiers: AccessModifier.PROTECTED,
  osot_privilege: Privilege.MAIN,
};
```

#### 2. CreateManagementDto

Extends ManagementBasicDto for creating new management accounts.

**Key Features:**

- Inherits all validation from ManagementBasicDto
- Creation-specific business rule enforcement
- Required field validation for user business ID
- Default value handling for optional fields

**Usage:**

```typescript
import { CreateManagementDto } from './create-management.dto';

const newManagement: CreateManagementDto = {
  osot_user_business_id: 'USR-BUSINESS-002-2024',
  // All other fields optional with sensible defaults
};
```

#### 3. UpdateManagementDto

Partial type of ManagementBasicDto for flexible updates.

**Key Features:**

- All fields optional for granular updates
- Maintains business rule validation
- Excludes system-generated fields
- Supports partial modifications

**Usage:**

```typescript
import { UpdateManagementDto } from './update-management.dto';

const updateData: UpdateManagementDto = {
  osot_vendor: true,
  osot_advertising: true,
  // Only specified fields will be updated
};
```

#### 4. ManagementResponseDto

Enhanced response DTO with computed fields and formatted display values.

**Key Features:**

- Extends ManagementBasicDto with additional display fields
- Formatted enum values for user-friendly display
- Business status summaries and service lists
- Access control information and security levels

**Computed Fields:**

- `accessModifierDisplayName`: Human-readable access modifier
- `privilegeDisplayName`: Human-readable privilege level
- `lifecycleStatus`: Account lifecycle summary
- `activeServices`: List of active business services
- `businessSummary`: Business capabilities summary
- `hasAdminPrivileges`: Administrative access indicator
- `securityLevel`: Security classification
- `formattedCreatedDate`: Formatted creation date
- `formattedModifiedDate`: Formatted modification date

### Query DTOs

#### 5. ListManagementQueryDto

Comprehensive filtering and pagination for management account listings.

**Key Features:**

- Pagination support (skip/top parameters)
- Full-text search across user business IDs
- Lifecycle status filtering
- Business service filtering
- Access control filtering
- Date range filtering
- Sorting capabilities
- Aggregation filters

## Business Rule Validation

All DTOs include comprehensive business rule validation through custom validators:

### Key Business Rules

1. **User Business ID Format**: Must follow OSOT format standards
2. **Vendor-Recruitment Mutual Exclusivity**: Vendors cannot have recruitment permissions
3. **Lifecycle Flag Validation**: Cannot be both passed away and life member retired
4. **Active Service Restrictions**: Deceased members cannot have active services
5. **Access Control Validation**: Proper enum value validation for privileges and access modifiers

## Integration with Dataverse

### Field Mapping

All DTOs align with the Table Account Management.csv schema:

- **Field Names**: Use `osot_` prefix matching Dataverse entity
- **Data Types**: Match Dataverse field types (Text, Choice, Boolean)
- **Choice Fields**: Use enum values synchronized with Dataverse global choices
- **System Fields**: Include Dataverse system fields (createdon, modifiedon, ownerid)

## Usage Examples

### Service Layer Integration

```typescript
import {
  CreateManagementDto,
  UpdateManagementDto,
  ManagementResponseDto,
  ListManagementQueryDto,
} from './index';

@Injectable()
export class ManagementService {
  async createManagement(
    createDto: CreateManagementDto,
  ): Promise<ManagementResponseDto> {
    // Business logic and Dataverse integration
  }

  async updateManagement(
    id: string,
    updateDto: UpdateManagementDto,
  ): Promise<ManagementResponseDto> {
    // Partial update logic
  }

  async listManagement(
    queryDto: ListManagementQueryDto,
  ): Promise<ManagementResponseDto[]> {
    // Query processing and filtering
  }
}
```

### Controller Integration

```typescript
import {
  CreateManagementDto,
  UpdateManagementDto,
  ManagementResponseDto,
  ListManagementQueryDto,
} from '../dtos';

@Controller('management')
export class ManagementController {
  @Post()
  async create(
    @Body() createDto: CreateManagementDto,
  ): Promise<ManagementResponseDto> {
    return this.managementService.create(createDto);
  }

  @Get()
  async list(
    @Query() queryDto: ListManagementQueryDto,
  ): Promise<ManagementResponseDto[]> {
    return this.managementService.list(queryDto);
  }
}
```

## Error Handling

DTOs include comprehensive validation error handling:

```typescript
// Example validation errors
{
  "statusCode": 400,
  "message": [
    "User Business ID must be 1-20 alphanumeric characters, underscores, or hyphens",
    "Vendors cannot have recruitment permissions",
    "Cannot be both passed away and life member retired"
  ],
  "error": "Bad Request"
}
```

## Best Practices

1. **Always use DTOs** for API endpoints and service boundaries
2. **Leverage validation decorators** for automatic business rule enforcement
3. **Use ManagementResponseDto** for all API responses to include computed fields
4. **Apply proper filtering** through ListManagementQueryDto for efficient queries
5. **Handle validation errors** gracefully with user-friendly messages
6. **Follow naming conventions** with `osot_` prefix for Dataverse field alignment

## Dependencies

- **class-validator**: Field validation and business rule enforcement
- **class-transformer**: Data transformation and computed fields
- **@nestjs/swagger**: API documentation and schema generation
- **Common Enums**: AccessModifier and Privilege enum integration
- **Management Constants**: Field limits and validation rules
- **Management Validators**: Custom business rule validators
