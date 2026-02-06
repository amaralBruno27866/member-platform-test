# Insurance Schedulers

Background jobs and scheduled tasks for Insurance operations.

## Overview

Schedulers automatically perform recurring operations without user intervention:
- **Expiration Management** - Mark insurances as EXPIRED when membership year changes
- **Audit Trails** - Comprehensive logging for compliance
- **Batch Processing** - Efficient handling of large datasets

## Files

### insurance-expiration.scheduler.ts

**Purpose:** Automatically expire insurance certificates based on membership year transitions.

**Triggers:**
1. **Daily Check** - 1 AM every day (detect year transitions)
2. **Annual Check** - 3 AM on January 1st (catch any missed expirations)
3. **Manual Trigger** - Admin can call `triggerManualExpiration()` programmatically

**Business Logic:**
```
Membership Year Changes (e.g., 2024-2025 → 2025-2026)
    ↓
Scheduler finds all ACTIVE insurances from PREVIOUS year (2024-2025)
    ↓
Updates status: ACTIVE → EXPIRED
    ↓
User can now purchase NEW insurances for NEW year (2025-2026)
```

**Key Features:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Only affects ACTIVE insurances
- ✅ Batch processing (avoids Dataverse throttling)
- ✅ Comprehensive audit logging
- ✅ Organization-level filtering

**Usage Examples:**

Manual trigger (all organizations):
```typescript
const stats = await insuranceExpirationScheduler.triggerManualExpiration();
console.log(stats.totalExpired); // Number of expired insurances
```

Manual trigger (specific organization):
```typescript
const stats = await insuranceExpirationScheduler.triggerManualExpiration(
  'org-guid-123',
  'maintenance-cleanup'
);
```

**Statistics Output:**
```typescript
{
  totalProcessed: 150,
  totalExpired: 45,
  totalSkipped: 105,
  errors: 0,
  organizations: {
    'org-1': { accountsChecked: 50, insurancesExpired: 25, errors: 0 },
    'org-2': { accountsChecked: 40, insurancesExpired: 20, errors: 0 }
  }
}
```

## Integration Points

### Required Services

1. **InsuranceLookupService**
   - `findByYear()` - Find insurances for specific academic year
   - `findActiveByAccountAndType()` - Check active coverage

2. **InsuranceCrudService**
   - `update()` - Change insurance status to EXPIRED

3. **MembershipSettingsLookupService**
   - Get current membership year for accounts
   - Determine year transitions

### Event Emissions (Future)

When insurances are expired, could emit:
```typescript
InsuranceExpirationEvent {
  insuranceId: string;
  oldYear: string;
  newYear: string;
  timestamp: Date;
}
```

This could trigger:
- Renewal notifications to users
- Audit trail logging
- Email notifications (expired coverage)

## Configuration

### NestJS Schedule Module

Schedulers use `@nestjs/schedule` decorators:

```typescript
@Cron('0 1 * * *', {
  name: 'daily-insurance-expiration-check',
  timeZone: 'America/Toronto', // OSOT timezone
})
async handleDailyExpirationCheck() {
  // Runs every day at 1 AM EST
}
```

**Cron Pattern:** `second minute hour day month dayOfWeek`
- `0 1 * * *` = Every day at 1:00 AM
- `0 3 1 1 *` = January 1st at 3:00 AM

**Timezone:** America/Toronto (OSOT's location)

### Disabling Schedulers

If needed, disable via environment:
```env
ENABLE_INSURANCE_EXPIRATION_SCHEDULER=false
```

Then in scheduler:
```typescript
@Cron('...')
async handle() {
  if (process.env.ENABLE_INSURANCE_EXPIRATION_SCHEDULER === 'false') {
    return;
  }
  // ... logic
}
```

## Implementation Status

**Phase 1 (Current - Etapa 3):**
- ✅ Scheduler structure created
- ✅ Cron triggers defined
- ⏳ Core algorithm (TODOs marked in code)

**Phase 2 (Next):**
- Implement `performBulkExpiration()` algorithm
- Integrate with MembershipSettingsLookupService
- Full batch processing and error handling
- Testing and edge cases

**Phase 3:**
- Event emission for renewal notifications
- Email notifications to users
- Admin dashboard for scheduler monitoring
- Manual expiration triggers in admin console

## Testing Notes

```typescript
// Manual test - expire all insurances from 2024-2025 in test org
const stats = await scheduler.triggerManualExpiration(
  'test-org-guid',
  'unit-test'
);

expect(stats.totalExpired).toBeGreaterThan(0);
expect(stats.errors).toBe(0);
```

## Logging

All operations logged with `operationId` for traceability:
```
Operation: daily-expiration-check-1706425200000
Trigger: daily-automatic
Organizations Processed: 3
Total Expired: 45
Duration: ~2.5 seconds
```

## Performance Considerations

- **Batch Size:** 50 records per batch (configurable)
- **Rate Limiting:** 1 second delay between batches
- **Scope:** Daily checks limit to recent transitions (optimizable)
- **Scalability:** Can handle thousands of insurances

## Future Enhancements

1. **Selective Expiration**
   - Only expire insurances past expiry_date (not just year-based)
   - Add grace period before marking EXPIRED

2. **Notification Pipeline**
   - Send email to users: "Your insurance for [year] has expired"
   - Suggest renewal action

3. **Metrics & Monitoring**
   - Track execution time
   - Alert if scheduler fails
   - Dashboard showing expiration rates

4. **Bulk Operations API**
   - Admin endpoint to trigger expiration
   - Filter by organization, type, status
   - Preview changes before commit
