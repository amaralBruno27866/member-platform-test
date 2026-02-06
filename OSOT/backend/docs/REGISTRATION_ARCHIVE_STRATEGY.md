# Registration Archive Strategy
**Registration Session Archiving System**

## 📋 Table of Contents
- [Overview](#overview)
- [Current Problem](#current-problem)
- [Proposed Solution](#proposed-solution)
- [Size-Based Trigger](#size-based-trigger)
- [Architecture](#architecture)
- [Benefits](#benefits)
- [Implementation](#implementation)
- [Data Format](#data-format)
- [Estimated Costs](#estimated-costs)

---

## 🎯 Overview

Automated system for archiving, backup, and data governance of registration sessions (Professional Accounts and Affiliate Organizations) transitioning from Redis to permanent storage, with automatic exports based on **data volume** instead of time.

### Main Objective
Maintain complete registration history for:
- ✅ **Compliance and Audit** - Full traceability
- ✅ **Troubleshooting** - Investigate historical issues
- ✅ **Analytics** - Conversion and performance metrics
- ✅ **Secure Backup** - Data recovery in case of failures
- ✅ **Performance** - Clean Redis, optimized queries

---

## ❌ Current Problem

### Current System State
```
┌─────────────────────────────────────┐
│         Redis (In-Memory)           │
│  TTL: 48 hours                      │
│  ┌──────────────────────────┐       │
│  │ Session: aff_123         │       │
│  │ Status: completed        │       │
│  │ Data: {...}              │       │
│  └──────────────────────────┘       │
│              ↓                       │
│    ⏰ After 48h: DELETED            │
│    ❌ Data lost forever             │
└─────────────────────────────────────┘
```

### Identified Problems
1. **Historical Data Loss**
   - After 48 hours, completed sessions are eliminated
   - Impossible to audit old registrations
   - No traceability of approvals/rejections

2. **Lack of Audit Trail**
   - Who approved/rejected? (data lost)
   - How long did each step take? (not traceable)
   - Failure patterns? (no metrics)

3. **Compliance at Risk**
   - GDPR requires 7-year history in some cases
   - Internal audits without evidence
   - Troubleshooting past problems impossible

4. **Limited Analytics**
   - Unknown conversion rate
   - Average approval time not measurable
   - Process bottlenecks not identifiable

5. **Impossible Recovery**
   - Deleted data cannot be recovered
   - No backup of historical sessions
   - Risk of loss due to bugs/crashes

---

## ✅ Proposed Solution

### Complete Archiving Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    REDIS (Active Sessions)                       │
│                    TTL: 48 horas                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Session 1    │  │ Session 2    │  │ Session 3    │          │
│  │ Status: new  │  │ Status: pend │  │ Status: comp │          │
│  └──────────────┘  └──────────────┘  └──────┬───────┘          │
└─────────────────────────────────────────────┼───────────────────┘
                                               │
                                               │ Status: completed
                                               ↓
┌─────────────────────────────────────────────────────────────────┐
│              DATAVERSE (Archive Table)                           │
│              osot_registration_archive                           │
│              Retention: 1 year (Hot Data)                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Archive Record:                                      │       │
│  │ - session_id: aff_123                               │       │
│  │ - session_type: affiliate                           │       │
│  │ - session_data: {complete JSON}                     │       │
│  │ - approved_by: admin-001                            │       │
│  │ - approved_at: 2025-01-15                           │       │
│  │ - archived_at: 2025-01-15                           │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  Monitoring: Total size of records                              │
│  Trigger: When reaching 10,000 records OR 50 MB                 │
│                            ↓                                     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ Limite atingido
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│           AUTOMATIC EXPORT (Size-Based Trigger)                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Process:                                             │       │
│  │ 1. Query: First N oldest records                    │       │
│  │ 2. Generate: CSV + JSON + XML                       │       │
│  │ 3. Upload: Azure Blob Storage                       │       │
│  │ 4. Email: Link for admin to download               │       │
│  │ 5. Cleanup: Remove exported records from DB         │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│         AZURE BLOB STORAGE (Cold Storage)                        │
│         Retention: 7 years (Legal Compliance)                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ /archives/                                           │       │
│  │   /2025/                                            │       │
│  │     batch-001-2025-01-15.csv      (1.2 MB)         │       │
│  │     batch-001-2025-01-15.json     (3.8 MB)         │       │
│  │     batch-001-2025-01-15.xml      (4.5 MB)         │       │
│  │   /2025/                                            │       │
│  │     batch-002-2025-02-20.csv      (1.3 MB)         │       │
│  │     ...                                             │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  Cost: ~$0.01/GB/month (Cool Tier)                             │
│  Access: Via email with pre-signed link (24h)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Size-Based Trigger (Preferred Strategy)

### Why Size Instead of Time?

#### ❌ Problem with Time-Based Trigger
```
Scenario A (Low Volume):
- January: 50 records → 75 KB export
- February: 30 records → 45 KB export
- March: 100 records → 150 KB export

Scenario B (High Volume):
- January: 5,000 records → 7.5 MB export ⚠️
- February: 8,000 records → 12 MB export ⚠️
- March: 15,000 records → 22.5 MB export ⚠️

Problem: Unpredictable size, may exceed limits
```

#### ✅ Advantage with Size-Based Trigger
```
Scenario A (Low Volume):
- Batch 1: 10,000 records = 15 MB → Export (takes 4 months)
- Batch 2: 10,000 records = 15 MB → Export (takes 3 months)

Scenario B (High Volume):
- Batch 1: 10,000 records = 15 MB → Export (takes 2 weeks)
- Batch 2: 10,000 records = 15 MB → Export (takes 2 weeks)
- Batch 3: 10,000 records = 15 MB → Export (takes 2 weeks)

Advantage: Predictable size, time adjusts automatically
```

### Trigger Configuration

```typescript
const ARCHIVE_THRESHOLDS = {
  // Primary Trigger: Number of Records
  MAX_RECORDS_BEFORE_EXPORT: 10000,    // 10k records (~15 MB)
  
  // Secondary Trigger: Total Size (safety)
  MAX_SIZE_BEFORE_EXPORT_MB: 50,       // 50 MB (fallback)
  
  // Batch Size for Export
  EXPORT_BATCH_SIZE: 10000,            // Export 10k at a time
  
  // Monitoring (check triggers)
  CHECK_FREQUENCY: '0 */6 * * *',      // Every 6 hours (Cron)
  
  // Retention
  DATAVERSE_RETENTION_DAYS: 365,       // 1 year in database
  BLOB_RETENTION_YEARS: 7,             // 7 years in files
};
```

### Monitoring Logic

```typescript
// Job that runs every 6 hours
@Cron('0 */6 * * *')
async checkArchiveThresholds(): Promise<void> {
  const stats = await this.getArchiveStats();
  
  // Stats obtained:
  // - totalRecords: 15,432
  // - totalSizeMB: 23.1
  // - oldestRecord: 2024-11-10
  // - newestRecord: 2025-01-15
  
  const shouldExport = (
    stats.totalRecords >= ARCHIVE_THRESHOLDS.MAX_RECORDS_BEFORE_EXPORT ||
    stats.totalSizeMB >= ARCHIVE_THRESHOLDS.MAX_SIZE_BEFORE_EXPORT_MB
  );
  
  if (shouldExport) {
    this.logger.log(`🚨 Archive threshold reached!`);
    this.logger.log(`   Records: ${stats.totalRecords} (limit: ${ARCHIVE_THRESHOLDS.MAX_RECORDS_BEFORE_EXPORT})`);
    this.logger.log(`   Size: ${stats.totalSizeMB} MB (limit: ${ARCHIVE_THRESHOLDS.MAX_SIZE_BEFORE_EXPORT_MB} MB)`);
    
    // Trigger automatic export
    await this.exportAndCleanupArchive();
  } else {
    this.logger.debug(`✓ Archive within limits: ${stats.totalRecords} records, ${stats.totalSizeMB} MB`);
  }
}

async exportAndCleanupArchive(): Promise<void> {
  // 1. Fetch the 10,000 OLDEST records
  const records = await this.getOldestRecords(
    ARCHIVE_THRESHOLDS.EXPORT_BATCH_SIZE
  );
  
  this.logger.log(`📦 Exporting ${records.length} records...`);
  
  // 2. Generate files
  const batchId = `batch-${Date.now()}`;
  const files = {
    csv: await this.generateCSV(records, batchId),
    json: await this.generateJSON(records, batchId),
    xml: await this.generateXML(records, batchId),
  };
  
  // 3. Upload to Azure Blob
  const uploadedUrls = await this.uploadToBlobStorage(files);
  
  // 4. Notify admin
  await this.sendExportNotification({
    batchId,
    recordCount: records.length,
    files: uploadedUrls,
    dateRange: {
      from: records[0].createdAt,
      to: records[records.length - 1].createdAt,
    },
  });
  
  // 5. Delete exported records from DB
  const deletedIds = records.map(r => r.id);
  await this.deleteArchivedRecords(deletedIds);
  
  this.logger.log(`✅ Export completed and ${deletedIds.length} records cleaned up`);
}
```

### Advantages of Size-Based Trigger

| Aspect | Time-Based Trigger | **Size-Based Trigger** ✅ |
|---------|-------------------|----------------------------|
| **Predictability** | Size varies (10KB-100MB) | ✅ Fixed size (~15MB) |
| **Performance** | Inconsistent | ✅ Consistent (same batch) |
| **Costs** | Unpredictable | ✅ Predictable ($0.15/export) |
| **Storage** | Can fill quickly | ✅ Controlled (never > 50MB) |
| **Processing** | Can hang on peaks | ✅ Always same time |
| **Debugging** | Difficult (different sizes) | ✅ Easy (standardized batches) |
| **Scalability** | Limited | ✅ Automatic |

### Example Scenarios

#### Scenario 1: Startup (Low Volume)
```
Month 1: 200 records = 300 KB
Month 2: 150 records = 225 KB
Month 3: 300 records = 450 KB
...
Month 18: Total 10,000 records → 🚀 TRIGGER! 15 MB export
```
**Result:** One export every 1.5 years (low volume)

#### Scenario 2: Medium Growth
```
Week 1: 500 records
Week 2: 800 records
Week 3: 1,200 records
...
Week 20: Total 10,000 records → 🚀 TRIGGER! 15 MB export
```
**Result:** One export every 5 months (growth)

#### Scenario 3: High Demand
```
Week 1: 2,500 records
Week 2: 3,000 records
Week 3: 2,800 records
Week 4: 1,700 records → 🚀 TRIGGER! 15 MB export
```
**Result:** One export per month (high volume, but controlled size!)

---

## 🏭️ Architecture

### System Components

```typescript
┌────────────────────────────────────────────────────────────┐
│                    COMPONENTS                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. RegistrationArchiveService                            │
│     - archiveSession()         → Move Redis → DB          │
│     - checkThresholds()        → Monitor size           │
│     - exportBatch()            → Generate files          │
│     - uploadToBlob()           → Upload to Azure        │
│     - cleanup()                → Remove old records     │
│                                                            │
│  2. ArchiveScheduler (Cron)                               │
│     - @Cron('0 */6 * * *')     → Check every 6h        │
│     - checkArchiveThresholds() → Trigger export         │
│                                                            │
│  3. ExportService                                          │
│     - generateCSV()            → CSV for Excel          │
│     - generateJSON()           → JSON for APIs          │
│     - generateXML()            → XML for compliance     │
│                                                            │
│  4. BlobStorageService                                     │
│     - upload()                 → Azure Blob Upload     │
│     - generateSasUrl()         → Temporary link (24h)  │
│                                                            │
│  5. ArchiveRepository                                      │
│     - saveArchive()            → Save to Dataverse     │
│     - getStats()               → Stats (count/size)    │
│     - getOldestRecords()       → Batch for export      │
│     - deleteRecords()          → Post-export cleanup   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Dataverse Entity

```typescript
// osot_registration_archive
interface RegistrationArchive {
  osot_registration_archive_id: string;        // GUID (PK)
  osot_session_id: string;                     // "aff_1234567890_abc"
  osot_session_type: OptionSet;                // 1: Professional, 2: Affiliate
  osot_session_status: OptionSet;              // 1: Completed, 2: Rejected, 3: Expired
  osot_session_data: string;                   // Complete session JSON
  osot_session_size_bytes: number;             // JSON size
  
  // Relationships
  osot_affiliate_id?: string;                  // FK → osot_affiliate
  osot_account_id?: string;                    // FK → Account
  
  // Audit Trail
  osot_approved_by?: string;                   // Admin ID
  osot_rejected_by?: string;                   // Admin ID
  osot_approval_reason?: string;               // Reason
  
  // Timestamps
  osot_session_created_at: Date;               // When session was created
  osot_email_verified_at?: Date;               // When email was verified
  osot_approved_at?: Date;                     // When it was approved
  osot_rejected_at?: Date;                     // When it was rejected
  osot_archived_at: Date;                      // When moved from Redis
  osot_exported_at?: Date;                     // When exported (null = still in DB)
  osot_export_batch_id?: string;               // Export batch ID
  
  // Metadata
  osot_notes?: string;                         // Administrative notes
  osot_tags?: string;                          // Search tags (JSON array)
}
```

---

## 🎁 Benefits

### 1. **Compliance and Governance**
- ✅ **Full Traceability:** Who approved/rejected and when
- ✅ **Complete Audit:** 7-year history available
- ✅ **GDPR/LGPD:** Preserved consent evidence
- ✅ **SOX/HIPAA:** Compliance with data retention

### 2. **Troubleshooting and Support**
- ✅ **Problem Investigation:** Access old registrations
- ✅ **Bug Reproduction:** Exact data from moment of failure
- ✅ **Forensic Analysis:** Complete timeline of events
- ✅ **Data Recovery:** Restore registrations if needed

### 3. **Analytics and Insights**
- ✅ **Conversion Rate:** % of registrations that complete
- ✅ **Approval Time:** Average time until admin approves
- ✅ **Bottlenecks:** Where users abandon the process
- ✅ **Patterns:** Peak times, common rejections, etc.
- ✅ **Trends:** Growth over time

### 4. **Performance and Scalability**
- ✅ **Clean Redis:** Only active data (< 48h)
- ✅ **Fast Queries:** Dataverse indexed by date
- ✅ **Cheap Storage:** Azure Blob Cool Tier ($0.01/GB)
- ✅ **Controlled Batch:** Always ~15MB per export
- ✅ **Auto-scaling:** Size-based trigger adapts to volume

### 5. **Backup and Disaster Recovery**
- ✅ **Multiple Formats:** CSV, JSON, XML (redundancy)
- ✅ **Geo-replication:** Redundant Azure Blob
- ✅ **Versioning:** Monthly/batch backups
- ✅ **Easy Recovery:** Re-import from CSV if needed

### 6. **Cost-Effectiveness**
- ✅ **Minimal Storage:** ~15MB per controlled batch
- ✅ **Predictable Cost:** $0.15/15MB export
- ✅ **No Waste:** Export only when necessary
- ✅ **High ROI:** Prevents loss of valuable data

---

## 🔧 Implementation

### Phase 1: Foundation (Essential)
**Timeline:** 1-2 days  
**Priority:** 🔴 High

#### Tasks:
1. ✅ Create `osot_registration_archive` entity in Dataverse
2. ✅ Implement `RegistrationArchiveService`
3. ✅ Modify `processApproval()` to archive before completing
4. ✅ Add `deleteSessionFromRedis()` method after archiving
5. ✅ Unit tests

#### Essential Code:
```typescript
// affiliate-registration.service.ts
async processApproval(...) {
  // ... existing processing
  
  // ✅ NEW: Archive session before marking as completed
  await this.archiveService.archiveSession(
    session.sessionId,
    session,
    'affiliate'
  );
  
  // ✅ NEW: Delete from Redis (free memory)
  await this.deleteSession(session.sessionId);
  
  return { success: true, ... };
}
```

### Phase 2: Monitoring and Export (Core)
**Timeline:** 3-5 days  
**Priority:** 🟡 Medium

#### Tasks:
1. ✅ Implement `ArchiveScheduler` with Cron job
2. ✅ Method `checkArchiveThresholds()` (query count + size)
3. ✅ Method `exportBatch()` (generate CSV, JSON, XML)
4. ✅ Integration with Azure Blob Storage
5. ✅ Email notification for admin with links
6. ✅ Cleanup of exported records

### Phase 3: Analytics and Refinement (Optional)
**Timeline:** 1 week  
**Priority:** 🟢 Low

#### Tasks:
1. ✅ Metrics dashboard (total archived, exports, etc.)
2. ✅ API to search archived records
3. ✅ Backup re-import
4. ✅ Structured logs and alerts
5. ✅ Complete technical documentation

---

## 📊 Data Format

### CSV (Excel-friendly)
```csv
session_id,session_type,status,email,organization_name,representative_name,approved_by,created_at,email_verified_at,approved_at,archived_at
aff_1734123456_abc123,affiliate,completed,contact@org.com,ABC Organization,John Doe,admin-001,2025-01-10T10:00:00Z,2025-01-10T10:15:00Z,2025-01-11T14:30:00Z,2025-01-11T14:31:00Z
aff_1734234567_def456,affiliate,rejected,info@test.org,Test Corp,Jane Smith,admin-002,2025-01-12T09:00:00Z,2025-01-12T09:20:00Z,2025-01-13T11:00:00Z,2025-01-13T11:01:00Z
```

### JSON (API/Analytics)
```json
{
  "exportMetadata": {
    "batchId": "batch-1734567890",
    "exportDate": "2025-01-15T00:00:00Z",
    "recordCount": 10000,
    "totalSizeMB": 15.2,
    "dateRange": {
      "from": "2024-06-01T00:00:00Z",
      "to": "2025-01-15T00:00:00Z"
    }
  },
  "records": [
    {
      "sessionId": "aff_1734123456_abc123",
      "sessionType": "affiliate",
      "status": "completed",
      "affiliateData": {
        "organizationName": "ABC Organization",
        "email": "contact@org.com",
        "representativeName": "John Doe",
        "address": "..."
      },
      "timeline": {
        "createdAt": "2025-01-10T10:00:00Z",
        "emailVerifiedAt": "2025-01-10T10:15:00Z",
        "approvedAt": "2025-01-11T14:30:00Z",
        "archivedAt": "2025-01-11T14:31:00Z"
      },
      "approval": {
        "approvedBy": "admin-001",
        "reason": "All documentation verified"
      }
    }
  ]
}
```

### XML (Compliance/Legacy)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<archiveExport batchId="batch-1734567890" exportDate="2025-01-15T00:00:00Z">
  <metadata>
    <recordCount>10000</recordCount>
    <totalSizeMB>15.2</totalSizeMB>
    <dateRange from="2024-06-01" to="2025-01-15"/>
  </metadata>
  <records>
    <session id="aff_1734123456_abc123" type="affiliate" status="completed">
      <affiliateData>
        <organizationName>ABC Organization</organizationName>
        <email>contact@org.com</email>
        <representativeName>John Doe</representativeName>
      </affiliateData>
      <timeline>
        <createdAt>2025-01-10T10:00:00Z</createdAt>
        <emailVerifiedAt>2025-01-10T10:15:00Z</emailVerifiedAt>
        <approvedAt>2025-01-11T14:30:00Z</approvedAt>
      </timeline>
      <approval>
        <approvedBy>admin-001</approvedBy>
        <reason>All documentation verified</reason>
      </approval>
    </session>
  </records>
</archiveExport>
```

---

## 💰 Estimated Costs

### Scenario: 1,000 records/month (12,000/year)

#### Dataverse Storage (Hot Data)
```
First 10,000 records = 15 MB
Cost: Included in Dataverse (no additional cost)
Time in DB: Until reaching 10k records (~10 months)
```

#### Azure Blob Storage (Cold Storage)
```
Per Export (10,000 records):
- CSV: 1.2 MB
- JSON: 3.8 MB
- XML: 4.5 MB
Total: 9.5 MB per batch

Cool Tier Cost: $0.01/GB/month
- 1 export (9.5 MB): $0.0001/month = $0.001/year
- 10 exports (95 MB): $0.001/month = $0.01/year
- 7 years (70 exports = 665 MB): $0.007/month = $0.08/7 years

Total Cost 7 years: $0.08 (practically free!)
```

#### Bandwidth (Downloads)
```
Admin downloads 1x/month = 9.5 MB/month
Cost: $0.09/GB = $0.0009/month = $0.01/year

Total 7 years: $0.07
```

#### **Total Estimated Cost: $0.15 per 7 years** 🎉

### Cost Comparison

| Solution | Cost 7 years | Pros | Cons |
|---------|--------------|------|------|
| **Azure Blob (Cool)** ✅ | $0.15 | Cheap, scalable | Requires Azure |
| AWS S3 Glacier | $0.08 | Cheaper | Slow retrieval |
| Dataverse only | $0 | No extra infra | Storage limits |
| Local file system | $0 | Free | No redundancy |

**Recommendation:** Azure Blob Cool Tier (best cost-benefit)

---

## 📈 Metrics and Monitoring

### Important KPIs
```typescript
interface ArchiveMetrics {
  // Volume
  totalRecordsArchived: number;        // Historical total
  recordsInDatabase: number;            // Awaiting export
  recordsExported: number;              // Already exported
  
  // Size
  currentDatabaseSizeMB: number;        // Current size
  totalExportedSizeMB: number;          // Total exported
  averageRecordSizeKB: number;          // Average per record
  
  // Performance
  lastExportDate: Date;                 // Last export
  nextEstimatedExport: Date;            // Next forecast
  averageTimeToExport: number;          // Average time
  
  // Business
  conversionRate: number;               // % completed
  averageApprovalTimeHours: number;     // Time until approval
  rejectionRate: number;                // % rejected
}
```

### Structured Logs
```typescript
this.logger.log({
  event: 'archive_threshold_reached',
  recordCount: 10453,
  sizeMB: 15.7,
  threshold: 10000,
  action: 'triggering_export',
  estimatedTime: '2-3 minutes'
});

this.logger.log({
  event: 'export_completed',
  batchId: 'batch-1734567890',
  recordsExported: 10000,
  filesGenerated: ['csv', 'json', 'xml'],
  uploadedTo: 'azure-blob',
  cleanedRecords: 10000,
  duration: 125000, // ms
});
```

---

## 🔐 Security and Privacy

### Data Access
- ✅ **Dataverse:** Role-based access (admins only)
- ✅ **Azure Blob:** SAS URLs with 24h expiration
- ✅ **Email Links:** Pre-signed, single use
- ✅ **Audit Log:** All queries/downloads logged

### GDPR/LGPD Compliance
- ✅ **Right to Access:** Search specific user data
- ✅ **Right to Deletion:** Remove person's data (GDPR)
- ✅ **Data Minimization:** Only necessary data
- ✅ **Encryption:** At rest (Azure) and in transit (HTTPS)

### Legal Retention
```typescript
const LEGAL_REQUIREMENTS = {
  GDPR: 7, // years (Europe)
  LGPD: 5, // years (Brazil)
  SOX: 7, // years (Financial)
  HIPAA: 6, // years (Healthcare)
};

// Use the highest: 7 years
const RETENTION_YEARS = 7;
```

---

## 📝 Conclusion

### Executive Summary

**What is it?**  
Automated registration session archiving system with trigger based on **data volume** (10,000 records or 50 MB).

**Why do it?**  
- Legal compliance (7-year retention)
- Audit and troubleshooting
- Business analytics and insights
- Secure backup and data recovery
- Optimized performance (clean Redis)

**When to implement?**  
- **Phase 1 (Critical):** Immediately
- **Phase 2 (Core):** Next 2 weeks
- **Phase 3 (Optional):** As needed

**How much does it cost?**  
- **$0.15 per 7 years** (practically free!)

**Size-Based Trigger Advantage:**  
✅ Predictable size (~15 MB/batch)  
✅ Consistent performance  
✅ Controlled costs  
✅ Automatically scalable  
✅ Variable time is not a problem (adapts to volume)

---

## 📚 References

- [Azure Blob Storage Pricing](https://azure.microsoft.com/pricing/details/storage/blobs/)
- [GDPR Data Retention](https://gdpr-info.eu/)
- [NestJS Cron Jobs](https://docs.nestjs.com/techniques/task-scheduling)
- [Dataverse Best Practices](https://docs.microsoft.com/power-apps/developer/data-platform/)

---

**Document created on:** 2025-01-10  
**Last updated:** 2025-01-10  
**Author:** OSOT System - Backend Team  
**Status:** 📋 Planning - Awaiting Implementation
