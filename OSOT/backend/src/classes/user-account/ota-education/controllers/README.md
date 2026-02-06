# OTA Education Controllers

This module contains the controllers for managing Occupational Therapy Assistant (OTA) Education records, providing both public and private API endpoints with comprehensive validation, lookup operations, and CRUD functionality.

## Controllers Overview

### Public Controller (`ota-education-public.controller.ts`)

**Route**: `/public/ota-educations`

The public controller provides **unauthenticated** endpoints for validation and lookup operations. These endpoints are designed for form validation, business rule checking, and data lookup without requiring user authentication.

#### Key Features

- ✅ **Data validation without persistence** - Multiple validation endpoints
- ✅ **College-country alignment validation** - Business rule enforcement
- ✅ **User Business ID uniqueness checking** - Prevent duplicates
- ✅ **Enum conversion utilities** - Standardized data formatting
- ✅ **Lookup operations** for colleges, countries, graduation years, degree types
- ✅ **Education category determination** - Automated categorization logic
- ✅ **Statistics and analytics** - Comprehensive data insights
- ✅ **Comprehensive Swagger documentation** - Full API documentation
- ✅ **Error handling with structured responses** - Consistent error format
- ✅ **Organized route sections** - VALIDATION and LOOKUP operations grouped

#### Public Endpoints

##### Validation Operations

```typescript
// Create/Validate education data
POST /public/ota-educations/create
Body: CreateOtaEducationDto
Response: { isValid: boolean, errors: string[], warnings: string[] }

// Validate college-country alignment
POST /public/ota-educations/validate-college-country
Body: { college: OtaCollege, country: Country }
Response: { isValid: boolean, message?: string }

// Check User Business ID uniqueness
POST /public/ota-educations/check-user-business-id
Body: { userBusinessId: string, excludeEducationId?: string }
Response: { isUnique: boolean, conflictId?: string }
```

##### Lookup Operations

```typescript
// Get list of OTA colleges
GET /public/ota-educations/colleges
Response: Array<{ value: number, label: string, country: string, type: string }>

// Get list of countries
GET /public/ota-educations/countries
Response: Array<{ value: number, label: string, code: string }>

// Get valid graduation years
GET /public/ota-educations/graduation-years?currentYear=2024
Response: Array<{ value: number, label: string, category: string }>

// Get valid degree types
GET /public/ota-educations/degree-types
Response: Array<{ value: number, label: string, description: string }>
```

##### Utility Operations

```typescript
// Determine education category
GET /public/ota-educations/category/:college/:country
Params: college (OtaCollege enum), country (Country enum)
Response: { category: EducationCategory, categoryLabel: string, reasoning: string }

// Get education statistics
GET /public/ota-educations/statistics
Response: {
  totalRecords: number,
  byWorkDeclarationStatus: Record<string, number>,
  byCollege: Record<string, number>,
  byCountry: Record<string, number>,
  byEducationCategory: Record<string, number>,
  byDegreeType: Record<string, number>,
  byGraduationYear: Record<string, number>,
  internationalEducationCount: number,
  verificationRequiredCount: number
}
```

### Private Controller (`ota-education-private.controller.ts`)

**Route**: `/private/ota-educations`

The private controller provides **authenticated** endpoints for full CRUD operations with role-based access control. All routes require JWT authentication and proper user context.

#### Key Features

- 🔐 **JWT Authentication required** - Secure access control
- 👤 **User context and role-based permissions** - Granular access control
- 🔧 **Full CRUD operations** - Complete data management
- 🔍 **Advanced lookup and search capabilities** - Comprehensive querying
- ✅ **Data validation and completeness checking** - Quality assurance
- 📊 **User-specific data access** - Privacy and data ownership
- 🛡️ **Permission-based operations** (main, admin, owner) - Role hierarchy
- 🏗️ **Consistent architecture** - Standardized with OT Education patterns
- 📋 **Organized operation sections** - CRUD, Administrative, Validation, Lookup

#### Authentication

All private endpoints require:

- Valid JWT token in Authorization header: `Bearer <token>`
- User context with business ID and privilege level

#### Private Endpoints

##### Core CRUD Operations

```typescript
// Get my education records
GET /private/ota-educations/me
Headers: Authorization: Bearer <token>
Response: OtaEducationResponseDto[]

// Create new education record
POST /private/ota-educations
Headers: Authorization: Bearer <token>
Body: CreateOtaEducationDto
Response: OtaEducationResponseDto

// Get specific education record
GET /private/ota-educations/:id
Headers: Authorization: Bearer <token>
Params: id (UUID)
Response: OtaEducationResponseDto

// Update education record
PATCH /private/ota-educations/:id
Headers: Authorization: Bearer <token>
Params: id (UUID)
Body: UpdateOtaEducationDto
Response: OtaEducationResponseDto

// Delete education record (main users only)
DELETE /private/ota-educations/:id
Headers: Authorization: Bearer <token>
Params: id (UUID)
Response: 204 No Content
```

##### Lookup and Search Operations

```typescript
// Get records by account (admin/main only)
GET /private/ota-educations/account/:accountId
Headers: Authorization: Bearer <token>
Params: accountId (UUID)
Privileges: admin, main
Response: OtaEducationResponseDto[]

// Get records by user business ID
GET /private/ota-educations/user/:userBusinessId
Headers: Authorization: Bearer <token>
Params: userBusinessId (string)
Response: OtaEducationResponseDto[]

// Validate record completeness
POST /private/ota-educations/:id/validate
Headers: Authorization: Bearer <token>
Params: id (UUID)
Response: {
  isValid: boolean,
  completionPercentage: number,
  missingFields: string[],
  errors: string[],
  warnings: string[]
}
```

##### Specialized Lookup Operations

```typescript
// Find by college
GET /private/ota-educations/lookup/college/:college
Headers: Authorization: Bearer <token>
Params: college (OtaCollege enum)
Response: OtaEducationResponseDto[]

// Find by graduation year
GET /private/ota-educations/lookup/graduation-year/:year
Headers: Authorization: Bearer <token>
Params: year (GraduationYear enum)
Response: OtaEducationResponseDto[]

// Find by country
GET /private/ota-educations/lookup/country/:country
Headers: Authorization: Bearer <token>
Params: country (Country enum)
Response: OtaEducationResponseDto[]

// Find by degree type
GET /private/ota-educations/lookup/degree-type/:type
Headers: Authorization: Bearer <token>
Params: type (DegreeType enum)
Response: OtaEducationResponseDto[]
```

## Security Model

### Public Controller Security

- ❌ No authentication required
- ✅ Rate limiting applied
- ✅ Input validation and sanitization
- ✅ No sensitive data exposure
- ✅ Read-only operations only

### Private Controller Security

- 🔐 JWT authentication required
- 👤 User context validation
- 🛡️ Role-based access control
- 🔒 Data ownership verification
- 📝 Audit logging for all operations

### Permission Levels

#### Owner (Default)

- ✅ Access own records
- ✅ Create new records
- ✅ Update own records
- ❌ Delete records
- ❌ Access other user's records

#### Admin

- ✅ All Owner permissions
- ✅ Access any user's records by account ID
- ✅ View system-wide data
- ❌ Delete records

#### Main

- ✅ All Admin permissions
- ✅ Delete any records
- ✅ Full system access
- ✅ Administrative operations

## Data Models

### Request DTOs

#### CreateOtaEducationDto

```typescript
{
  osot_user_business_id: string;           // Required, max 20 chars
  osot_work_declaration: boolean;          // Required, explicit true/false
  osot_ota_degree_type?: DegreeType;      // Optional, default: DIPLOMA_CREDENTIAL
  osot_ota_college?: OtaCollege;          // Optional, must align with country
  osot_ota_grad_year?: GraduationYear;    // Optional
  osot_education_category?: EducationCategory; // Optional
  osot_ota_country?: Country;             // Optional, default: CANADA
  osot_ota_other?: string;                // Optional, max 100 chars
  osot_access_modifiers?: AccessModifier; // Optional, default: PRIVATE
  osot_privilege?: Privilege;             // Optional, default: OWNER
  'osot_Table_Account@odata.bind'?: string; // OData binding for Account
  osot_table_ota_educationid?: string;    // Optional UUID v4
}
```

#### UpdateOtaEducationDto

```typescript
// Partial version of CreateOtaEducationDto
// All fields optional except validation constraints
```

### Response DTOs

#### OtaEducationResponseDto

```typescript
{
  osot_table_ota_educationid: string;     // UUID primary key
  user_business_id: string;               // User business identifier
  work_declaration: boolean;              // Work declaration status
  ota_degree_type?: DegreeType;          // Degree type
  ota_college?: OtaCollege;              // OTA college
  ota_grad_year?: GraduationYear;        // Graduation year
  education_category?: EducationCategory; // Education category
  ota_country?: Country;                 // Country
  ota_other?: string;                    // Additional details
  access_modifiers?: AccessModifier;     // Access level
  privilege?: Privilege;                 // User privilege
  created_at: Date;                      // Creation timestamp
  updated_at: Date;                      // Last update timestamp
  created_by: string;                    // Creator user ID
  updated_by: string;                    // Last updater user ID
}
```

## Error Handling

### Standard Error Response

```typescript
{
  error: {
    code: string;           // Error code from ErrorCodes enum
    message: string;        // Human-readable error message
    details?: object;       // Additional error context
    timestamp: string;      // ISO timestamp
    path: string;          // Request path
    method: string;        // HTTP method
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `FORBIDDEN`: Insufficient privileges
- `UNAUTHORIZED`: Authentication required
- `CONFLICT`: Business rule violation
- `INTERNAL_ERROR`: Server error

## Usage Examples

### Frontend Integration

#### Public API Usage (No Auth)

```javascript
// Validate education data
const validateEducation = async (educationData) => {
  const response = await fetch('/api/public/ota-educations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(educationData),
  });
  return response.json();
};

// Validate college-country alignment
const validateCollegeCountry = async (college, country) => {
  const response = await fetch(
    '/api/public/ota-educations/validate-college-country',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ college, country }),
    },
  );
  return response.json();
};

// Check User Business ID uniqueness
const checkUserBusinessId = async (userBusinessId, excludeEducationId) => {
  const response = await fetch(
    '/api/public/ota-educations/check-user-business-id',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userBusinessId, excludeEducationId }),
    },
  );
  return response.json();
};

// Get colleges for dropdown
const getColleges = async () => {
  const response = await fetch('/api/public/ota-educations/colleges');
  return response.json();
};

// Determine education category
const determineCategory = async (college, country) => {
  const response = await fetch(
    `/api/public/ota-educations/category/${college}/${country}`,
  );
  return response.json();
};
```

#### Private API Usage (With Auth)

```javascript
// Get my education records
const getMyEducation = async (token) => {
  const response = await fetch('/api/private/ota-educations/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// Create new education record
const createEducation = async (educationData, token) => {
  const response = await fetch('/api/private/ota-educations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(educationData),
  });
  return response.json();
};

// Update education record
const updateEducation = async (id, updateData, token) => {
  const response = await fetch(`/api/private/ota-educations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
  return response.json();
};
```

### Backend Integration

#### Service Dependencies

```typescript
// Required services for controllers
import { OtaEducationCrudService } from '../services/ota-education-crud.service';
import { OtaEducationLookupService } from '../services/ota-education-lookup.service';

// Optional for advanced business rules
import { OtaEducationBusinessRuleService } from '../services/ota-education-business-rule.service';
```

#### Module Integration

```typescript
@Module({
  imports: [
    // Required modules
    AuthModule,
    CommonModule,
  ],
  controllers: [OtaEducationPublicController, OtaEducationPrivateController],
  providers: [
    OtaEducationCrudService,
    OtaEducationLookupService,
    // Optional: OtaEducationBusinessRuleService,
  ],
})
export class OtaEducationModule {}
```

## Testing

### Unit Tests

```typescript
describe('OtaEducationPublicController', () => {
  it('should validate education data correctly', async () => {
    const result = await controller.validateEducationData(mockEducationData);
    expect(result.isValid).toBeDefined();
    expect(result.errors).toBeArray();
  });

  it('should return colleges list', async () => {
    const colleges = await controller.getColleges();
    expect(colleges).toBeArray();
    expect(colleges[0]).toHaveProperty('value');
    expect(colleges[0]).toHaveProperty('label');
  });
});

describe('OtaEducationPrivateController', () => {
  it('should require authentication', async () => {
    // Test authentication middleware
  });

  it('should get user education records', async () => {
    const records = await controller.getMyEducationRecords(mockUser);
    expect(records).toBeArray();
  });
});
```

### Integration Tests

```typescript
describe('OTA Education API Integration', () => {
  it('should complete full CRUD cycle', async () => {
    // Create → Read → Update → Delete workflow
  });

  it('should enforce permissions correctly', async () => {
    // Test role-based access control
  });
});
```

## Performance Considerations

### Optimization Strategies

- **Caching**: Static lookup data (colleges, countries) cached
- **Pagination**: Large result sets paginated automatically
- **Indexing**: Database indexes on frequently queried fields
- **Rate Limiting**: Public endpoints rate-limited
- **Connection Pooling**: Database connections managed efficiently

### Monitoring

- **Logging**: Structured logging for all operations
- **Metrics**: Performance metrics tracked
- **Alerts**: Error rate and latency monitoring
- **Health Checks**: Endpoint health monitoring

## Migration and Compatibility

### Version Compatibility

- ✅ Backward compatible with existing OT Education patterns
- ✅ Forward compatible with planned enhancements
- ✅ Database schema migration support
- ✅ API versioning strategy

### Recent Architectural Improvements (v1.1.0)

#### Public Controller Enhancements

- ✅ **Added college-country validation endpoint** - Ensures data integrity
- ✅ **Added User Business ID uniqueness checking** - Prevents duplicates
- ✅ **Organized route sections** - Clear VALIDATION and LOOKUP groupings
- ✅ **Removed private helper methods** - Streamlined inline logic
- ✅ **Enhanced error handling** - More robust validation responses

#### Private Controller Standardization

- ✅ **Complete CRUD operations** - findOne, update, remove methods added
- ✅ **Administrative operations** - findByAccount, findByUserBusinessId
- ✅ **Validation operations** - validateDataCompleteness with scenarios
- ✅ **Specialized lookup operations** - By college, graduation year, country, degree type
- ✅ **Consistent permission model** - Aligned with OT Education patterns
- ✅ **Structured operation sections** - CRUD, Administrative, Validation, Lookup

#### Architectural Consistency

- ✅ **Standardized with OT Education** - Same patterns and structure across both domains
- ✅ **Consistent error handling** - Unified error response format
- ✅ **Uniform documentation** - Swagger docs follow same conventions
- ✅ **Aligned security model** - Same authentication and authorization patterns

### Deployment Notes

- 🔄 Rolling deployment supported
- 🔒 Environment-specific configurations
- 📊 Database migration scripts included
- 🧪 Comprehensive test coverage

---

## Related Documentation

- [OTA Education Services](../services/README.md) - Service layer documentation
- [OTA Education DTOs](../dtos/README.md) - Data transfer objects
- [OTA Education Validators](../validators/README.md) - Validation rules
- [Authentication Guide](../../../../auth/README.md) - JWT authentication
- [Error Handling Guide](../../../../common/errors/README.md) - Error management

## Support

For questions or issues with the OTA Education controllers:

1. Check the error logs for detailed error information
2. Verify authentication tokens and permissions
3. Validate input data against DTO schemas
4. Review business rule constraints
5. Check service dependencies and configuration

**Last Updated**: October 2025
**Version**: 1.1.0
**Status**: ✅ Production Ready - Fully Standardized with OT Education Architecture
