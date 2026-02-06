# OT Education Events

## Purpose

Contains domain events related to **Occupational Therapy Education** records. Events are simple payloads emitted by services when significant changes occur and can be used for asynchronous processing, notifications, auditing, and business intelligence.

## 📋 **Event Categories**

### **1. Lifecycle Events**

- `OtEducationCreatedEvent` - New OT education record created
- `OtEducationUpdatedEvent` - Existing education record modified
- `OtEducationDeletedEvent` - Education record removed

### **2. Validation Events**

- `OtEducationValidationEvent` - Validation results for education data
- `OtEducationBusinessRuleEvent` - Business rule compliance events

### **3. Business Process Events**

- `OtEducationCotoStatusEvent` - COTO status changes and registration updates
- `OtEducationGraduationEvent` - University, degree, and graduation tracking
- `OtEducationBulkEvent` - Bulk operation results

## 🔧 **Examples**

### **Core Lifecycle Events**

```typescript
// Education record created
OtEducationCreatedEvent {
  otEducationId: "osot-oted-1234567",
  accountId: "acc-12345",
  userBusinessId: "ub-67890",
  cotoStatus: CotoStatus.REGISTERED,
  degreeType: DegreeType.MASTERS,
  university: OtUniversity.UNIVERSITY_OF_TORONTO,
  graduationYear: GraduationYear.YEAR_2023,
  country: Country.CANADA,
  createdBy: "user-123",
  timestamp: new Date()
}

// Education record updated
OtEducationUpdatedEvent {
  otEducationId: "osot-oted-1234567",
  accountId: "acc-12345",
  changes: {
    old: { cotoStatus: CotoStatus.OTHER },
    new: { cotoStatus: CotoStatus.REGISTERED, cotoRegistration: "12345678" }
  },
  updatedBy: "user-123",
  timestamp: new Date()
}
```

### **COTO Status Events**

```typescript
// COTO status change
OtEducationCotoStatusEvent {
  otEducationId: "osot-oted-1234567",
  accountId: "acc-12345",
  oldCotoStatus: CotoStatus.OTHER,
  newCotoStatus: CotoStatus.REGISTERED,
  cotoRegistrationChanged: true,
  changeReason: "registration_completed",
  updatedBy: "user-123",
  timestamp: new Date()
}
```

### **Validation Events**

```typescript
// Validation results
OtEducationValidationEvent {
  otEducationId: "osot-oted-1234567",
  accountId: "acc-12345",
  validationType: "coto_registration_format",
  isValid: false,
  errors: ["COTO registration must be 8 digits"],
  timestamp: new Date()
}
```

## 🚀 **Integration**

### **Event Bus Integration**

- Events can be published to an in-process event bus
- Compatible with message brokers (RabbitMQ, Apache Kafka)
- Can trigger webhooks for external systems

### **Use Cases**

- **Auditing**: Track all changes to education records
- **Notifications**: Alert users of status changes
- **Analytics**: Monitor education trends and statistics
- **Compliance**: Ensure COTO registration requirements
- **Verification**: Trigger international education verification processes
- **Business Intelligence**: Generate reports on educational backgrounds

### **Event Service Usage**

```typescript
// Inject the events service
constructor(
  private readonly otEducationEventsService: OtEducationEventsService
) {}

// Publish events from your service methods
await this.otEducationEventsService.publishOtEducationCreated({
  otEducationId: newRecord.id,
  accountId: dto.accountId,
  // ... other event data
});
```

## 🎯 **Event Types Summary**

| Event Type        | Purpose              | Key Data                                 |
| ----------------- | -------------------- | ---------------------------------------- |
| **Created**       | New education record | University, degree, graduation year      |
| **Updated**       | Record modifications | Old vs new values, changed fields        |
| **Deleted**       | Record removal       | Reason for deletion                      |
| **COTO Status**   | Registration changes | Status transitions, registration numbers |
| **Graduation**    | Education tracking   | University changes, degree updates       |
| **Validation**    | Data quality         | Validation results, error messages       |
| **Business Rule** | Compliance           | Rule violations, requirements            |
| **Bulk**          | Mass operations      | Success/error counts, operation type     |
