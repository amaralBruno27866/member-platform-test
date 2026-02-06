# OT Education Category Scheduler - Usage Guide

## 🎯 Overview

The OT Education Category Scheduler provides automated lifecycle management for education categories, handling the natural progression: **STUDENT → NEW_GRADUATED → GRADUATED**.

## 🔧 Setup & Configuration

### Module Integration

The scheduler is automatically included when you import `OtEducationModule`:

```typescript
import { OtEducationModule } from './classes/user-account/ot-education';

@Module({
  imports: [
    // ... other modules
    OtEducationModule, // Includes scheduler automatically
  ],
})
export class AppModule {}
```

### Dependencies Required

The scheduler requires these services to be available:

- `@nestjs/schedule` - For cron job scheduling
- `DataverseModule` - For data persistence
- `CommonServicesModule` - For cross-domain integration

## 📅 Automatic Schedules

### Daily Check (Conditional)

```typescript
@Cron('0 2 * * *', { timeZone: 'America/Toronto' })
```

- **Time**: 2:00 AM Toronto time
- **Frequency**: Daily
- **Condition**: Only runs during transition months (January, June, December)
- **Purpose**: Capture users whose circumstances have changed

### Annual Update (Guaranteed)

```typescript
@Cron('0 3 1 1 *', { timeZone: 'America/Toronto' })
```

- **Time**: January 1st, 3:00 AM Toronto time
- **Frequency**: Once per year
- **Purpose**: Handle year transitions for all users

## 🛠️ Manual Controls

### Admin API Endpoints

#### Trigger Manual Update

```http
POST /admin/ot-education/scheduler/trigger-update
Authorization: Bearer <admin-jwt>
Content-Type: application/json

# Optional query parameter
?reason=Emergency update after membership changes
```

**Response:**

```json
{
  "success": true,
  "message": "Education category update completed successfully",
  "stats": {
    "totalProcessed": 150,
    "studentsToNewGrad": 12,
    "newGradToGraduated": 8,
    "graduatedRemaining": 130,
    "errors": 0,
    "skipped": 0
  },
  "operationId": "manual-trigger-1730419200000"
}
```

#### Get Distribution Statistics

```http
GET /admin/ot-education/scheduler/stats
Authorization: Bearer <admin-jwt>
```

**Response:**

```json
{
  "students": 245,
  "newGraduated": 67,
  "graduated": 1834,
  "total": 2146,
  "percentages": {
    "students": 11.42,
    "newGraduated": 3.12,
    "graduated": 85.46
  },
  "lastUpdated": "2025-10-31T14:30:00.000Z"
}
```

#### Health Check

```http
GET /admin/ot-education/scheduler/health
Authorization: Bearer <admin-jwt>
```

#### Scheduler Status

```http
GET /admin/ot-education/scheduler/status
Authorization: Bearer <admin-jwt>
```

## 💻 Programmatic Usage

### Direct Service Injection

```typescript
import { OtEducationCategoryScheduler } from './classes/user-account/ot-education';

@Injectable()
export class AdminService {
  constructor(
    private readonly categoryScheduler: OtEducationCategoryScheduler,
  ) {}

  async performEmergencyUpdate() {
    const stats = await this.categoryScheduler.triggerManualCategoryUpdate(
      'Emergency update - membership data correction',
    );

    console.log(`Updated ${stats.totalProcessed} records`);
    console.log(`${stats.studentsToNewGrad} students became new graduates`);
    console.log(`${stats.newGradToGraduated} new grads became graduates`);

    return stats;
  }

  async getDistribution() {
    return await this.categoryScheduler.getCategoryDistributionStats();
  }
}
```

## 📊 Business Logic

### Category Progression Rules

1. **STUDENT → NEW_GRADUATED**
   - Graduation year reaches current year OR previous year
   - Active membership period available (admin-controlled)
   - Eligible for new graduate benefits (50% discount)

2. **NEW_GRADUATED → GRADUATED**
   - Membership expires
   - More than 1 year since graduation
   - Standard professional status

3. **GRADUATED (Remains)**
   - Established professionals
   - No further automatic transitions

### Safety Features

- **Idempotent Operations**: Safe to run multiple times
- **Batch Processing**: Processes 50 records at a time
- **Rate Limiting**: 1-second delays between batches
- **Error Isolation**: Continues processing if individual records fail
- **Comprehensive Logging**: Full audit trail with operation IDs

## 🔍 Monitoring & Troubleshooting

### Log Structure

```typescript
{
  operationId: "daily-category-check-1730419200000",
  reason: "daily-automatic",
  stats: {
    totalProcessed: 150,
    studentsToNewGrad: 12,
    newGradToGraduated: 8,
    errors: 0
  },
  timestamp: "2025-10-31T06:00:00.000Z"
}
```

### Error Handling

Individual record failures are logged but don't stop the batch:

```typescript
{
  otEducationId: "osot-oted-0001234",
  userBusinessId: "USR-2024-001",
  success: false,
  error: "Update failed: Dataverse connection timeout",
  reason: "Processing error"
}
```

### Performance Monitoring

Monitor these metrics:

- **Processing Time**: Should complete within 5-10 minutes for typical loads
- **Error Rate**: Should be < 1% under normal conditions
- **Batch Size**: 50 records per batch with 1-second delays

## 🚨 Emergency Procedures

### If Scheduler Fails

1. **Check Health Endpoint**: `GET /admin/ot-education/scheduler/health`
2. **Review Logs**: Look for operation IDs and error patterns
3. **Manual Trigger**: Use admin API to run update manually
4. **Isolate Issues**: Process smaller batches if needed

### Rollback Procedures

While the scheduler doesn't have automatic rollback, you can:

1. **Query Audit Logs**: Find records changed in specific operation
2. **Manual Correction**: Use admin tools to revert specific changes
3. **Re-run Logic**: The same business rules will re-calculate correct categories

## 📈 Production Considerations

### Resource Usage

- **Database Queries**: Batch queries minimize load
- **Memory**: Processes in small batches to prevent memory issues
- **API Limits**: Rate limiting prevents Dataverse throttling

### Scaling

- **Large User Bases**: Adjust batch size if needed (currently 50)
- **Multiple Environments**: Ensure timezone settings are correct
- **Load Balancing**: Scheduler runs on single instance to prevent conflicts

### Maintenance Windows

- **Schedule Around**: Business hours and peak usage
- **Coordination**: Coordinate with membership setting updates
- **Testing**: Test in staging environment before production changes

## 🎛️ Configuration Options

### Environment Variables

```env
# Timezone for scheduler (default: America/Toronto)
SCHEDULER_TIMEZONE=America/Toronto

# Batch size for processing (default: 50)
EDUCATION_BATCH_SIZE=50

# Processing delay between batches in ms (default: 1000)
EDUCATION_BATCH_DELAY=1000

# Months to run daily updates (default: 1,6,12)
EDUCATION_UPDATE_MONTHS=1,6,12
```

### Advanced Configuration

To customize the scheduler behavior, extend the service:

```typescript
@Injectable()
export class CustomOtEducationScheduler extends OtEducationCategoryScheduler {
  protected shouldRunFullUpdate(): boolean {
    // Custom logic for when to run updates
    return super.shouldRunFullUpdate() || this.isSpecialCondition();
  }

  private isSpecialCondition(): boolean {
    // Your custom business logic
    return false;
  }
}
```

## 📚 Additional Resources

- **Business Rules**: See `ot-education-business-logic.util.ts`
- **Membership Integration**: See `education-membership-integration.service.ts`
- **API Documentation**: Auto-generated Swagger docs at `/api/docs`
- **Architecture Guide**: See main OT Education README.md

---

This scheduler represents a significant automation improvement for user lifecycle management, ensuring accurate categorization while reducing administrative overhead.
