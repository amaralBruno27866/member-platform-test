# OT Education Category Auto-Update Scheduler

## Purpose

Provides automated lifecycle management for education categories based on natural user progression over time. Handles the automatic transition of users from STUDENT → NEW_GRADUATED → GRADUATED as their circumstances change.

## Business Logic

### Natural Progression Flow

```
STUDENT (graduation year > current year)
    ↓ (when graduation year arrives)
NEW_GRADUATED (recent grad + active membership)
    ↓ (when membership expires or too much time passes)
GRADUATED (standard status)
```

### Update Rules

1. **STUDENT → NEW_GRADUATED**
   - Graduation year reaches current year or previous year
   - Active membership period available
   - Based on admin-controlled membership expiration dates

2. **NEW_GRADUATED → GRADUATED**
   - Membership expires
   - More than 1 year since graduation
   - No longer eligible for new graduate benefits

3. **GRADUATED (Remains)**
   - Standard status for established professionals
   - No further automatic transitions

## Scheduler Configuration

### Daily Check

```typescript
@Cron('0 2 * * *', {
  name: 'daily-education-category-check',
  timeZone: 'America/Toronto',
})
```

- **Time**: 2:00 AM Toronto time
- **Purpose**: Check during membership transition periods
- **Frequency**: Daily, but only processes during specific months

### Annual Update

```typescript
@Cron('0 3 1 1 *', {
  name: 'annual-education-category-update',
  timeZone: 'America/Toronto',
})
```

- **Time**: January 1st, 3:00 AM Toronto time
- **Purpose**: Handle year transitions
- **Frequency**: Once per year

### Update Periods

The scheduler only performs full updates during:

- **January**: New year transitions
- **June**: Mid-year membership periods
- **December**: End-of-year processing

## Safety Features

### Data Integrity

- **Idempotent**: Safe to run multiple times
- **Batch Processing**: Processes in groups of 50 to avoid API limits
- **Rate Limiting**: 1-second delays between batches
- **Comprehensive Logging**: Full audit trail of all changes

### Error Handling

- **Graceful Degradation**: Continues processing if individual records fail
- **Detailed Error Reporting**: Captures specific failures for investigation
- **Rollback Ready**: Changes can be reverted if needed

### Permission Model

- **System Role**: Uses 'system' role for automated updates
- **Admin Access**: Manual triggers require admin privileges
- **Audit Trail**: All operations logged with operation IDs

## API Endpoints

### Admin Controls

#### Trigger Manual Update

```http
POST /admin/ot-education/scheduler/trigger-update?reason=Emergency%20fix
Authorization: Bearer <admin-jwt>
```

#### Get Statistics

```http
GET /admin/ot-education/scheduler/stats
Authorization: Bearer <admin-jwt>
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

## Integration Points

### Cross-Domain Dependencies

```typescript
// Education Business Rules
OtEducationBusinessRuleService.determineEducationCategory();

// Membership Integration
EducationMembershipIntegrationService.determineEducationCategory();

// Membership Settings Query
MembershipSettingsUtilsService.getCurrentActiveMembershipExpiresDate();
```

### Data Sources

- **OT Education Records**: Source records to update
- **Membership Settings**: Active membership expiration dates
- **Business Rules**: Same logic as manual determination

## Monitoring & Observability

### Statistics Tracking

```typescript
interface CategoryUpdateStats {
  totalProcessed: number;
  studentsToNewGrad: number; // Student → New Graduate
  newGradToGraduated: number; // New Graduate → Graduate
  graduatedRemaining: number; // Already Graduate
  errors: number; // Failed updates
  skipped: number; // No change needed
}
```

### Logging Structure

```typescript
{
  operationId: "daily-category-check-1730419200000",
  reason: "daily-automatic",
  stats: { /* CategoryUpdateStats */ },
  timestamp: "2025-10-31T06:00:00.000Z"
}
```

## Usage Examples

### Manual Emergency Update

```typescript
// Trigger manual update with reason
const stats = await categoryScheduler.triggerManualCategoryUpdate(
  'Emergency update after membership data correction',
);

console.log(`Updated ${stats.totalProcessed} records`);
console.log(`${stats.studentsToNewGrad} students became new graduates`);
```

### Monitor Distribution

```typescript
// Get current category distribution
const distribution = await categoryScheduler.getCategoryDistributionStats();

console.log(`Students: ${distribution.students}`);
console.log(`New Grads: ${distribution.newGraduated}`);
console.log(`Graduates: ${distribution.graduated}`);
```

## Implementation Benefits

### User Experience

- **Automatic Benefits**: Users automatically receive appropriate benefits
- **No Manual Action**: Seamless transition without user intervention
- **Accurate Classification**: Always reflects current status

### Administrative Benefits

- **Fraud Prevention**: Uses admin-controlled data sources
- **Audit Compliance**: Complete change history
- **Operational Efficiency**: Reduces manual maintenance

### Technical Benefits

- **Scalable**: Handles large user bases efficiently
- **Reliable**: Robust error handling and recovery
- **Maintainable**: Clear separation of concerns

## Future Enhancements

### Potential Additions

- **Notification System**: Email users about status changes
- **Advanced Scheduling**: More granular timing controls
- **Dashboard Integration**: Real-time monitoring interface
- **Webhook Support**: External system notifications
- **Bulk Operations**: Admin tools for mass updates

### Performance Optimizations

- **Incremental Updates**: Only process changed records
- **Parallel Processing**: Multi-threaded batch operations
- **Caching Layer**: Reduce database queries
- **Database Indexes**: Optimize query performance

This scheduler represents a significant automation improvement for the OSOT platform, ensuring accurate user classification while reducing administrative overhead.
