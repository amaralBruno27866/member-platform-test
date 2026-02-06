# Membership Preferences Business Rules Analysis

**Date:** November 21, 2025  
**Objective:** Define business rules for preference fields based on membership categories

---

## 📋 Available Preference Fields

### 1. **Auto-Renewal** (boolean)
Automatic annual membership renewal

### 2. **Third Parties** (enum)
Communication with third parties:
- RECRUITMENT
- PRODUCT
- PROFESSIONAL_DEVELOPMENT

### 3. **Practice Promotion** (enum)
Practice promotion:
- SELF
- EMPLOYER

### 4. **Members Search Tools** (enum)
Visibility in search tools:
- PROFESSIONAL_NETWORKS
- POTENTIAL_MENTORING
- SUPERVISING_CLINIC_PLACEMENTS
- EXAM_MENTORING

### 5. **Shadowing** (boolean)
Availability for professional shadowing

### 6. **Psychotherapy Supervision** (enum)
Type of psychotherapy supervision offered (15 options):
- Acceptance and Commitment
- Brief and Narrative
- Cognitive Behavioural
- Dialectical Behavioural
- Developmental Somatic
- Emotion Focused
- Eye Movement
- Gestalt
- Hypnotherapy
- Interpersonal
- Integrative
- Mindfulness
- Progressive Goal Attainment
- Relational
- Solution Focused Behaviour

---

## 🎯 Membership Categories

### **Paying Members**

#### **OT Categories (Occupational Therapist)**
1. **OT_PR** - OT Practicing
2. **OT_NP** - OT Non-Practicing
3. **OT_RET** - OT Retired
4. **OT_NG** - OT New Graduate
5. **OT_LIFE** - OT Life Member

#### **OTA Categories (Occupational Therapy Assistant)**
6. **OTA_PR** - OTA Practicing
7. **OTA_NP** - OTA Non-Practicing
8. **OTA_RET** - OTA Retired
9. **OTA_NG** - OTA New Graduate
10. **OTA_LIFE** - OTA Life Member

### **Non-Paying Members**

11. **OT_STU** - OT Student
12. **OTA_STU** - OTA Student

### **Special Categories**

13. **ASSOC** - Associate
14. **AFF_PRIM** - Affiliate Primary
15. **AFF_PREM** - Affiliate Premium

---

## 🔍 Analysis by Field

### **1. Auto-Renewal**

#### ✅ Applicable for:
- All PAYING categories
- OT_PR, OT_NP, OT_RET, OT_NG, OT_LIFE
- OTA_PR, OTA_NP, OTA_RET, OTA_NG, OTA_LIFE
- ASSOC, AFF_PRIM, AFF_PREM

#### ❌ NOT applicable for:
- OT_STU, OTA_STU (non-paying)

**Reason:** Students don't pay fees, so automatic renewal doesn't make sense.

---

### **2. Third Parties**

#### ✅ Applicable for:
- **ALL categories**
- All members can choose to receive communications about:
  - Recruitment
  - Products
  - Professional Development

**Reason:** Communication is relevant for everyone, including students (recruitment, development).

---

### **3. Practice Promotion**

#### ✅ Applicable ONLY for:
- **OT_LIFE** - OT Life Member
- **OT_NG** - OT New Graduate
- **OT_PR** - OT Practicing

#### ❌ NOT applicable for:
- All OTAs (work under OT supervision)
- OT_NP (not practicing)
- OT_RET (retired)
- OT_STU (student)
- ASSOC (associates, not practitioners)
- AFF_PRIM, AFF_PREM (affiliates, not therapists)

**Reason:** Only OT members who can independently promote their practice. OTAs work under OT supervision and cannot independently promote.

---

### **4. Members Search Tools**

#### ✅ Applicable for:

**ALL options (1,2,3,4,5) for:**
- **OT_LIFE** - Full access
- **OT_NG** - Full access
- **OT_PR** - Full access
- **OT_NP** - Full access

**All EXCEPT Presenter (1,2,3,4) for:**
- **OT_RET** - Retired OTs (cannot present)

**EXCEPT Exam and Supervising Clinical (1,2,5) for:**
- **OTA_LIFE, OTA_NG, OTA_NP, OTA_PR, OTA_RET** - OTAs cannot supervise clinical placements or mentor exams

**ONLY Professional Networks (1) for:**
- **ASSOC** - Associates (networking only)
- **OT_STU, OTA_STU** - Students (networking only)

#### ❌ NOT applicable for:
- **AFF_PRIM, AFF_PREM** - Affiliates (not OT/OTA professionals)

**Search Tools Options:**
1. PROFESSIONAL_NETWORKS
2. POTENTIAL_MENTORING
3. SUPERVISING_CLINIC_PLACEMENTS
4. EXAM_MENTORING
5. PRESENTER

**Reason:** Different levels of professional engagement and qualifications require different tools. OTAs work under supervision and cannot independently supervise clinical placements or mentor for certification exams.

---

### **5. Shadowing**

#### ✅ Applicable for:
- **OT_LIFE** - Experienced lifetime OT members
- **OT_NG** - New graduate OTs
- **OT_PR** - Practicing OTs

#### ❌ NOT applicable for:
- All OTAs (work under OT supervision, cannot independently offer shadowing)
- OT_NP (non-practicing)
- OT_RET (retired)
- OT_STU (student)
- ASSOC, AFF_PRIM, AFF_PREM (not OT professionals)

**Reason:** Only OT members can independently offer shadowing opportunities. OTAs work under OT supervision and cannot independently offer shadowing.

---

### **6. Psychotherapy Supervision**

#### ✅ Applicable ONLY for:
- **OT_LIFE** - Experienced lifetime OT members with certification
- **OT_PR** - Practicing OTs with psychotherapy certification

#### ❌ NOT applicable for:
- OT_NP (non-practicing, removed from eligibility)
- All OTAs (not qualified for psychotherapy supervision)
- OT_RET, OT_NG, OT_STU (retired, new graduates, students)
- ASSOC, AFF_PRIM, AFF_PREM (not therapists)

**Reason:** Psychotherapy supervision is an advanced specialization, only for certified OT members who can actively supervise. Non-practicing OTs are no longer eligible.

---

## 📊 Business Rules Matrix

| Category | Auto-Renewal | Third Parties | Practice Promotion | Search Tools | Shadowing | Psychotherapy |
|-----------|-------------|---------------|-------------------|--------------|-----------|---------------|
| **OT_PR** | ✅ | ✅ | ✅ | ✅ All | ✅ | ✅ |
| **OT_NP** | ✅ | ✅ | ❌ | ✅ All | ❌ | ❌ |
| **OT_RET** | ✅ | ✅ | ❌ | ⚠️ Except Presenter | ❌ | ❌ |
| **OT_NG** | ❌ | ✅ | ✅ | ✅ All | ✅ | ❌ |
| **OT_STU** | ❌ | ✅ | ❌ | ⚠️ Network Only | ❌ | ❌ |
| **OT_LIFE** | ✅ | ✅ | ✅ | ✅ All | ✅ | ✅ |
| **OTA_PR** | ✅ | ✅ | ❌ | ⚠️ Except Exam/Supervising | ❌ | ❌ |
| **OTA_NP** | ✅ | ✅ | ❌ | ⚠️ Except Exam/Supervising | ❌ | ❌ |
| **OTA_RET** | ✅ | ✅ | ❌ | ⚠️ Except Exam/Supervising | ❌ | ❌ |
| **OTA_NG** | ❌ | ✅ | ❌ | ⚠️ Except Exam/Supervising | ❌ | ❌ |
| **OTA_STU** | ❌ | ✅ | ❌ | ⚠️ Network Only | ❌ | ❌ |
| **OTA_LIFE** | ✅ | ✅ | ❌ | ⚠️ Except Exam/Supervising | ❌ | ❌ |
| **ASSOC** | ✅ | ✅ | ❌ | ⚠️ Network Only | ❌ | ❌ |
| **AFF_PRIM** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **AFF_PREM** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Fully applicable
- ❌ = Not applicable
- ⚠️ Except Presenter = All search tools except PRESENTER (1,2,3,4)
- ⚠️ Except Exam/Supervising = PROFESSIONAL_NETWORKS, POTENTIAL_MENTORING, PRESENTER only (1,2,5)
- ⚠️ Network Only = PROFESSIONAL_NETWORKS only (1)

---

## 💡 Implementation Recommendations

### **1. Multi-Layer Validation**

```typescript
// DTO Validation Layer
class CreateMembershipPreferenceDto {
  // Always allowed fields
  @IsOptional() thirdParties?: ThirdParties;
  
  // Conditional fields (dynamic validation)
  @ValidateIf(o => isPracticing(o.categoryId))
  practicePromotion?: PracticePromotion;
}

// Business Rules Layer
class MembershipPreferenceBusinessRulesService {
  validateFieldsForCategory(dto, category) {
    // Detailed validation logic
  }
}
```

### **2. Specific Error Messages**

```typescript
if (dto.practicePromotion && !canHavePracticePromotion(category)) {
  throw new Error(
    `Practice Promotion is only available for actively practicing members. 
     Your category (${getCategoryDisplayName(category)}) does not qualify.`
  );
}
```

### **3. UI/UX Considerations**

- **Dynamically disabled fields** based on category
- **Explanatory tooltips** for why a field is not available
- **Real-time validation** before submit

### **4. Category Change Handling**

```typescript
// If category changes (e.g., OT_STU → OT_PR)
async onCategoryChange(userId, oldCategory, newCategory) {
  // Clear fields that are no longer valid
  // Notify user of fields that are now available
}
```

---

## 🎓 Specific Use Cases

### **Use Case 1: Student Graduating**
```
OT_STU → OT_NG
- Auto-renewal becomes available
- Practice Promotion not yet (until employed)
- Search Tools changes from EXAM_MENTORING to PROFESSIONAL_NETWORKS
```

### **Use Case 2: Professional Retiring**
```
OT_PR → OT_RET
- Auto-renewal continues
- Practice Promotion becomes unavailable
- Shadowing becomes unavailable
- Psychotherapy Supervision becomes unavailable
- Search Tools limited to networking/mentoring
```

### **Use Case 3: Premium Affiliate**
```
AFF_PREM
- Auto-renewal available
- Third Parties available (receive communications)
- All other fields unavailable (not a therapist)
```

---

## 🔐 Security Rules

### **Least Privilege Principle**
- Users can only set fields allowed for their category
- Admin/Main can override with justification (audited)

### **Auditing**
- Log all attempts to set non-allowed fields
- Alert security on repeated attempts

### **Mandatory Backend Validation**
- NEVER trust frontend validation alone
- Always validate category vs fields on backend

---

## 📝 Next Steps

1. ✅ Create `MembershipPreferenceBusinessRulesService`
2. ✅ Implement field validation by category
3. ✅ Create helper functions for eligibility verification
4. ✅ Add unit tests for each rule
5. ✅ Document API endpoints with rules

---

**Author:** GitHub Copilot  
**Review:** Pending client approval
