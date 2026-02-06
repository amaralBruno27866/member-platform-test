# Insurance Entity - Deep Analysis

## 1. Overview & Relationships

### Entity Diagram
```
Order (DRAFT)
  ↓
Order Product (Membership) ← [DETERMINED BY LOGIC, NOT USER SELECTION]
  + Order Product (Insurance 1) ← [OPTIONAL - user selects type]
  + Order Product (Insurance 2) ← [OPTIONAL - user selects type]
  + Order Product (Insurance N) ← [OPTIONAL - user selects type]
    + Insurance ← [entity created after payment, represents policy]
      + Additional Insured ← [OPTIONAL - can add later via dashboard]
      + Insurance Report ← [audit/approval workflow for high-risk]
```

**⚠️ IMPORTANT CORRECTION:**
- **Membership Category is NOT selected by user**
- **Determined by business logic based on:**
  - Account data (account_group, education records)
  - User-provided data (eligibility, employment, practices)
  - Business rules (OT → category determination, OTA → category determination)
- **Insurance types ARE selected by user** (Professional, General, Property, etc.)

### Key Relationship Rules
- **1:N relationship** - One Order can have multiple Insurance items (multiple types selected)
- **Each Insurance is independent** - Different status, effective dates, expiry dates
- **Additional Insured is 1:N to Insurance** - One Insurance can have multiple companies added (via dashboard later)
- **Insurance Type determines workflow**:
  - **Professional**: High-risk questions required, declaration mandatory, enables other types
  - **General/Commercial**: Enabled after Professional selected, no additional insureds in MVP
  - **Other types**: Enabled based on rules

---

## 2. Insurance Entity Architecture

### A. Snapshot Pattern (21 immutable fields at creation)

Insurance creates a **frozen snapshot** of the insured person's details at purchase time:

#### Account Snapshot (6 fields)
```typescript
osot_account_group      // e.g., 'Individual', 'Organization'
osot_first_name         // Given name
osot_last_name          // Family name
osot_personal_corporation // Optional business name
osot_certificate        // Certificate ID (osot-acc-0000123)
osot_phone_number       // Contact phone
```

#### Address Snapshot (5 fields)
```typescript
osot_address_1          // Street address
osot_address_2          // Optional (suite/unit)
osot_city               // City name
osot_province           // Province code (ON, BC, QC)
osot_postal_code        // Postal code (stored as K1A0A6, no spaces)
```

#### Membership Snapshot (4 fields)
```typescript
osot_category           // Professional category (OT, OTA)
osot_membership         // Membership type (Standard, Premium)
osot_membership_year    // Academic year (2025, 2026)
osot_email              // Contact email at time of purchase
```

#### Insurance Coverage Snapshot (6 fields)
```typescript
osot_insurance_type     // Coverage name (Professional Liability, General)
osot_insurance_limit    // Coverage amount (50000.00, 100000.00, etc)
osot_insurance_price    // Premium at purchase (79.00, 149.00, etc)
osot_insurance_tax      // Tax rate % (13, 15, etc)
osot_total              // Total with tax (calculated: price + tax)
osot_effective_date     // When coverage starts (YYYY-MM-DD)
osot_expires_date       // When coverage ends (YYYY-MM-DD)
```

#### High-Risk Assessment (Optional - Professional only - 6 fields)
```typescript
osot_insurance_question_1         // Boolean: Allegations of negligence?
osot_insurance_question_1_explain // String (1-4000 chars): Explanation if Yes
osot_insurance_question_2         // Boolean: Insurer denial/cancellation?
osot_insurance_question_2_explain // String (1-4000 chars): Explanation if Yes
osot_insurance_question_3         // Boolean: Potential claims awareness?
osot_insurance_question_3_explain // String (1-4000 chars): Explanation if Yes
```

**Why Immutable?**
- **Audit trail**: Historical record of what was covered
- **Compliance**: Insurance declaration tied to specific conditions
- **Data integrity**: Cannot retroactively change coverage

---

### B. Status Lifecycle

```
DRAFT
  ↓ (on creation)
PENDING ──→ CANCELLED (explicit cancellation before activation)
  ↓ (effective_date reached)
ACTIVE ──→ EXPIRED (expiry_date < today) or CANCELLED (explicit cancellation)
  ↓
EXPIRED (final state - cannot reactivate, must create new)
  
CANCELLED (final state - no reactivation possible)
```

**Status Transition Rules** (from insurance-business-rules.constant.ts):
- DRAFT → PENDING, CANCELLED
- PENDING → ACTIVE, CANCELLED
- ACTIVE → EXPIRED (automatic), CANCELLED
- EXPIRED → (none - final)
- CANCELLED → (none - final)

**Auto-Expiration**: System scheduler marks ACTIVE as EXPIRED when `expiry_date < today`

---

## 3. Insurance Types & Question Rules

### Type 1: Professional Liability
```typescript
type: 'Professional'
questions: REQUIRED (all 3 high-risk questions must be answered)
additional_insureds: NOT ALLOWED
risk_assessment: HIGH (flagged for manual review if any question = Yes)

High-Risk Questions:
1. "Have there been any allegations of negligence or malpractice?"
2. "Has your insurer ever cancelled, denied, or refused to renew coverage?"
3. "Are you aware of any circumstances that may lead to future claims?"

Rule: If answer = Yes, explanation (1-4000 chars) is mandatory
```

### Type 2: General / Commercial
```typescript
type: 'General' or 'Commercial'
questions: OPTIONAL or LIMITED (fewer than Professional)
additional_insureds: ALLOWED
risk_assessment: MEDIUM

Example Use: Company has General insurance, can add ABC Corp, XYZ Inc as additional insureds
```

### Type 3: Other Types
```typescript
type: 'Property', 'Specialized', etc.
questions: NOT APPLICABLE
additional_insureds: DEPENDS on type
risk_assessment: LOW or NONE
```

---

## 4. Relationship with Additional Insured

### Business Rule
- **Only for General/Commercial insurance**
- **1:N relationship**: One Insurance → Multiple Additional Insureds
- **Company names unique per insurance**: Cannot add same company twice to same policy
- **Immutable insurance relationship**: Once assigned, cannot change parent insurance

### Additional Insured Data
```typescript
insuranceGuid           // Parent insurance (immutable)
organizationGuid        // Inherited from parent insurance
osot_company_name       // Company name (UPPERCASE, 255 chars max)
osot_address            // Street address (255 chars)
osot_city               // City (choice value)
osot_province           // Province (choice value)
osot_postal_code        // Postal code (K1A0A6 format, no spaces)
osot_privilege          // Access level (default: Owner)
osot_access_modifiers   // Access rules (default: Private)
```

### Validation
- Insurance must be type `GENERAL` and status `ACTIVE`
- Company name normalized to UPPERCASE
- Postal code stored without spaces (K1A 0A6 → K1A0A6)
- Unique company names per insurance (no duplicates)

---

## 5. Relationship with Insurance Report

### Purpose
Insurance Report is an **audit/approval workflow** document:
- Captures high-risk assessments (when questions answered "Yes")
- Tracks admin approvals or rejections
- Maintains compliance audit trail

### When Created
- Automatically when Insurance is created with high-risk answers
- Or manually triggered for review

### Status Workflow
```
SUBMITTED (initial)
  ↓
IN_REVIEW (admin reviewing)
  ↓
APPROVED (admin approved) or REJECTED (admin rejected)
```

---

## 6. Creation Flow for Membership Orchestrator

### What Needs to Happen (Step 6)

**User selects optional insurances during membership registration:**

```
Membership Registration
  → User selects Membership Category (OT_PR, OT_STU, etc.)
  → User OPTIONALLY selects insurance(s)
  
  Selection UI could present:
  ├─ Professional Liability ($79/year) ☐ Add?
  ├─ General Liability ($149/year) ☐ Add?
  ├─ Property Insurance ($249/year) ☐ Add?
  
  If Professional selected:
  └─ High-risk questions appear (3 yes/no with explanations if Yes)
  
  If General selected:
  └─ Can add additional insured companies (optional step)
```

### Data Flow in Orchestrator

**For EACH selected insurance:**

1. **Lookup insurance product** from Product table
   - Filter: `category = 'Insurance'`, `type matches selection`, `status = AVAILABLE`
   
2. **Create snapshot data** from current user context
   - Account info (first_name, last_name, certificate, account_group)
   - Address info (from User's current address)
   - Membership info (category, membership, membership_year)
   - Insurance info (from Product selected)
   
3. **Create Insurance entity** via InsuranceCrudService.create()
   - Input: CreateInsuranceDto with all snapshot fields
   - Service validates: declaration=true, questions (if Professional), dates valid
   - Output: Created Insurance with osot_insuranceid, status=PENDING
   
4. **IF Professional insurance AND questions answered "Yes"**
   - Trigger Insurance Report creation (automatic or via event)
   - Flag for admin review
   
5. **IF General insurance**
   - Wait for user to optionally add Additional Insureds (Step 6b)
   - Each Additional Insured is separate entity created after Insurance

6. **Store insurance guids in Redis** for later use
   - Key: `membership-orchestrator:insurances:{sessionId}` → [insurance_guid_1, insurance_guid_2, ...]

---

## 7. Validation Layers

### DTO-Level Validation (Decorators)
```typescript
@IsDeclarationTrue()                  // Must be true
@IsQuestionExplanationRequired()      // Yes answers need explanations
@IsValidEffectiveDate()               // Cannot be future date
@IsValidExpiryDate()                  // Must be after effective date
@IsValidInsuranceTotal()              // Total = price + tax (within $0.01)
```

### Service-Level Validation (Business Rules)
```typescript
// From insurance-business-rules.service.ts
- validateInsuranceForCreation()
- validateStatusTransition()
- validatePermissions()
- checkUniqueInsurancePerOrder()  // Cannot create duplicate types per order
```

### Mapper Validation
- Snapshot fields immutable (no null overwrites)
- @odata.bind for relationships (Insurance → Order, Order → Account)

---

## 8. ✅ ANSWERED Questions & Clarifications

### Q1: Multiple Insurance Selection ✅
**RESPOSTA:** ✅ SIM, usuário pode selecionar múltiplos tipos (Professional + General + Property)
**REGRA:** ❌ NÃO pode duplicar mesmo tipo (não pode 2x Professional ou 2x General)
**UI/UX:** Sem campo de quantidade, apenas checkbox de seleção para evitar duplicação

**Implementação:**
- Loop através das seleções (unique types only)
- Validar unicidade antes de criar Insurance records
- Criar N Insurance records (1 por tipo selecionado)

---

### Q2: Additional Insured Data Collection ✅
**RESPOSTA:** ✅ Opcional no workflow de membership registration
**QUANDO:** Pode ser adicionado DEPOIS no dashboard do usuário

**Implementação:**
- Step 6: NÃO coletar Additional Insured (skip)
- Criar Insurance sem companies
- Usuário adiciona companies posteriormente via dashboard
- **Vantagem:** Simplifica workflow inicial

---

### Q3: Question Handling (Professional Only) ✅
**RESPOSTA:** ✅ Modal aparece quando Professional é selecionado
**CONTEÚDO:** 3 perguntas SIM/NÃO + campo de explicação (obrigatório se SIM)

**DTO esperado:**
```typescript
interface InsuranceSelectionDto {
  insuranceType: 'Professional' | 'General' | 'Property'
  declaration: boolean  // Botão de aceite manual
  
  // Professional only:
  questions?: {
    question1: { answered: boolean; explanation?: string }
    question2: { answered: boolean; explanation?: string }
    question3: { answered: boolean; explanation?: string }
  }
}
```

---

### Q4: Declaration Field ✅
**RESPOSTA:** ✅ Botão manual de aceite na UI
**QUANDO:** Logo DEPOIS das perguntas (se Professional)
**REGRA:** ✅ Professional só fica selecionável DEPOIS de declaration = true
**SEQUÊNCIA:** Outros seguros ficam habilitados DEPOIS de Professional ser selecionado

**Implementação:**
- Frontend: Checkbox "Aceito declaração" após questões
- Backend: Validar declaration = true em CreateInsuranceDto
- Validator: `@IsDeclarationTrue()` já implementado

---

### Q5: Dates (Effective & Expiry) ✅
**RESPOSTA:** 
- ✅ **effective_date:** Data da transação (hoje)
- ⚠️ **expires_date:** PRECISA REVISÃO

**Lógica ATUAL (código existente):**
- Membership Year format: "2025-2026" ou "2025"
- Expiry calculado: August 31 do ano final
- Exemplo: membership_year = "2025-2026" → expires_date = "2026-08-31"

**Lógica OSOT (conforme relatado):**
- Período: October 1 até October 1 do próximo ano
- Exemplo: Compra hoje (2026-02-03), membership_year = 2025 → expires_date = "2026-10-01"

**⚠️ AÇÃO NECESSÁRIA:** 
- Revisar lógica de expiração
- Verificar se cada organização tem período diferente
- Ajustar método `calculateExpiryDate()` em `insurance-snapshot.orchestrator.service.ts`

---

### Q6: Tax Calculation ✅
**RESPOSTA:** ✅ Vem de Product (Product.osot_taxes)

**Implementação (igual ao Order Product):**
```typescript
osot_insurance_price = product.osot_insurance_price  // From Product
osot_insurance_tax = product.osot_taxes              // Tax % from Product
osot_total = price + (price * tax / 100)             // Calculated
```

---

### Q7: Insurance Status Workflow ✅
**RESPOSTA:** ✅ DRAFT primeiro, depois PENDING durante processamento de pagamento

**Status Flow:**
```
DRAFT (criado no Step 6)
  ↓ (payment submitted)
PENDING (durante processamento de pagamento)
  ↓ (payment approved + effective_date reached)
ACTIVE (scheduler ativa)
  ↓ (expires_date passed)
EXPIRED (scheduler expira)
```

**Implementação:**
- Step 6: Criar Insurance com status = DRAFT
- Step 9 (payment): Atualizar status = PENDING
- Scheduler (background): PENDING → ACTIVE (quando effective_date ≤ hoje)
- Scheduler (background): ACTIVE → EXPIRED (quando expires_date < hoje)

---

---

## 9. 🚨 Certificate Generation - MISSING IMPLEMENTATION

### Current State
**Certificate Number Generation:** ✅ IMPLEMENTED
- Método: `generateCertificateNumber()` em `insurance-snapshot.orchestrator.service.ts`
- Format: `CERT-{timestamp}-{random}` (e.g., `CERT-1738540234567-a1b2c3`)
- Armazenado em: `Insurance.osot_certificate` (snapshot field, immutable)

**Certificate PDF Generation:** ❌ NOT IMPLEMENTED
- **Problema:** Não há lógica para gerar certificado em PDF
- **O que existe:**
  - Templates HTML: `insurance-report-admin-approval.html`, `insurance-report-provider-notification.html`
  - Esses são para Insurance REPORT (workflow de aprovação), não para certificado do usuário
  
**O que FALTA:**
1. **Template HTML/PDF** para certificado de seguro (mostrando coverage details)
2. **Geração de PDF** usando biblioteca (pdfmake, puppeteer, etc.)
3. **Storage de PDF** (Dataverse attachments, Azure Blob, ou enviar por email)
4. **Trigger de geração** (quando? Step 11 após pagamento aprovado?)

### Expected Certificate Content
```
┌─────────────────────────────────────────────┐
│      CERTIFICATE OF INSURANCE               │
│      [Organization Logo]                    │
├─────────────────────────────────────────────┤
│ Certificate Number: CERT-1738540234567-a1b2 │
│ Insured Name: John Smith                    │
│ Certificate ID: osot-acc-0000123            │
│ Address: 123 Main St, Toronto, ON K1A 0A6  │
│                                             │
│ Insurance Type: Professional Liability      │
│ Coverage Limit: $50,000 CAD                │
│ Effective Date: 2026-02-03                 │
│ Expiry Date: 2026-10-01                    │
│                                             │
│ Membership Year: 2025                       │
│ Category: OT Professional                   │
│                                             │
│ [QR Code for verification]                  │
│ [Signature/Seal]                            │
└─────────────────────────────────────────────┘
```

### Proposed Implementation

**Option A: PDF Generation with Puppeteer**
```typescript
// insurance-certificate-generator.service.ts
import puppeteer from 'puppeteer';

async generateCertificatePDF(insurance: InsuranceInternal): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load HTML template with insurance data
  const html = this.renderCertificateHTML(insurance);
  await page.setContent(html);
  
  // Generate PDF
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  
  return pdfBuffer;
}
```

**Option B: PDF Generation with pdfmake**
```typescript
// insurance-certificate-generator.service.ts
import pdfMake from 'pdfmake';

async generateCertificatePDF(insurance: InsuranceInternal): Promise<Buffer> {
  const docDefinition = {
    content: [
      { text: 'CERTIFICATE OF INSURANCE', style: 'header' },
      { text: `Certificate Number: ${insurance.osot_certificate}` },
      { text: `Insured Name: ${insurance.osot_first_name} ${insurance.osot_last_name}` },
      // ... more fields
    ],
    styles: { header: { fontSize: 18, bold: true } }
  };
  
  const pdfDoc = pdfMake.createPdf(docDefinition);
  return new Promise((resolve) => {
    pdfDoc.getBuffer((buffer) => resolve(buffer));
  });
}
```

**Option C: Use Existing Email Template Engine (Handlebars)**
```typescript
// Reuse existing email service pattern
// Generate HTML with Handlebars, then convert to PDF via puppeteer
const html = this.templateEngine.render('certificate-insurance.hbs', {
  certificateNumber: insurance.osot_certificate,
  firstName: insurance.osot_first_name,
  lastName: insurance.osot_last_name,
  insuranceType: insurance.osot_insurance_type,
  insuranceLimit: insurance.osot_insurance_limit,
  effectiveDate: insurance.osot_effective_date,
  expiresDate: insurance.osot_expires_date,
  organizationLogo: organization.osot_logo_url
});

const pdfBuffer = await this.htmlToPdf(html);
```

### When to Generate Certificate?

**Timing Options:**
1. **Step 11 (Activate Insurance)** - After payment approved
   - Insurance status: PENDING → ACTIVE
   - Generate PDF and attach to Insurance record
   - Send email with PDF attachment

2. **On-Demand** - User requests via dashboard
   - Endpoint: `GET /api/insurance/:id/certificate`
   - Generate PDF on-the-fly
   - Return as download

3. **Background Job** - Async after payment
   - Queue job after payment approved
   - Generate PDF in background
   - Store in Dataverse/Blob
   - Notify user when ready

**Recommendation:** **Option 1 + Option 2**
- Generate automatically in Step 11 (send by email)
- Allow re-download via dashboard (on-demand)

### Storage Options

**Where to store PDF?**
1. **Dataverse Attachments** (Notes/Attachments entity)
2. **Azure Blob Storage** (separate bucket, URL stored in Insurance)
3. **Email Only** (don't store, regenerate on-demand)

**Recommendation:** **Azure Blob + Email**
- Store in Blob (permanent record)
- Send by email (user convenience)
- Link in dashboard (re-download anytime)

### Implementation Checklist

- [ ] **Create certificate HTML template** (`insurance-certificate.hbs`)
- [ ] **Add PDF generation service** (`insurance-certificate-generator.service.ts`)
- [ ] **Install dependencies** (`puppeteer` or `pdfmake`)
- [ ] **Integrate with Step 11** (activate insurance flow)
- [ ] **Store PDF** (Dataverse/Blob/Email)
- [ ] **Add download endpoint** (`GET /api/insurance/:id/certificate`)
- [ ] **Test PDF generation** (all insurance types)
- [ ] **Add QR code** (optional - for verification)

---

## 10. Implementation Checklist (Pending)

- [ ] Understand Q1: Single vs. Multiple insurance selection
- [ ] Understand Q2: When to collect Additional Insured data
- [ ] Understand Q3: Question presentation format
- [ ] Understand Q4: Declaration checkbox handling
- [ ] Understand Q5: Date logic (effective_date, expires_date)
- [ ] Understand Q6: Tax calculation source
- [ ] Understand Q7: DRAFT vs PENDING initial status

---

## 10. Related Entities Structure

### Insurance Module Files
- `insurance-crud.service.ts` - Create, Update, Delete operations
- `insurance-lookup.service.ts` - Find by ID, by Order, by Account
- `insurance-business-rules.service.ts` - Validation and permissions
- `insurance.mapper.ts` - DTO ↔ Internal ↔ Dataverse transformations
- `insurance-events.service.ts` - Event publishing (created, approved, etc)

### Additional Insured Module
- `additional-insured-crud.service.ts` - Create, Update, Delete
- `additional-insured-lookup.service.ts` - Find by Insurance
- `additional-insured.mapper.ts` - Transform company data

### Insurance Report Module
- `insurance-report.service.ts` - Create, Update reports
- `insurance-report-events.service.ts` - Event publishing

---

## Summary

Insurance is a **complex snapshot entity** with:
- ✅ Immutable coverage details (frozen at purchase)
- ✅ Status lifecycle (DRAFT → PENDING → ACTIVE → EXPIRED/CANCELLED)
- ✅ Optional high-risk assessment (Professional type only)
- ✅ Optional additional insureds (General type only)
- ✅ Integration with Order and Account for audit trail

**Next steps after Q&A:**
1. Define insurance selection DTO structure
2. Implement InsuranceSelection helper in MembershipOrchestratorService
3. Handle multiple insurance creation (loop pattern)
4. Store insurance GUIDs in Redis for later entity creation
5. Implement Additional Insured creation (if included in MVP)

