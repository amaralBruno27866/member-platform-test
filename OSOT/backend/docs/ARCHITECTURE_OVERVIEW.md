# OSOT Dataverse API – System Architecture

## Overview

This document provides a visual and conceptual overview of the OSOT Dataverse API, including its security model, user roles, entity relationships, and data normalization. It is written for both technical and non-technical readers.

---

## 🏗️ System Structure & Main Entities

```
                        OSOT DATAVERSE SYSTEM
                        ══════════════════════
                                 │
                ┌────────────────┼───────────────┐
                │                                │
        ┌───────────────┐                ┌─────────────────┐
        │   Account     │                │ Account Affiliate│
        │ (Person)      │                │   (Company)     │
        └───────────────┘                └─────────────────┘
                │                                │
        ┌───────┼───────────────┐                │
        │       │       │       │                │
     Address  Contact  Identity  Education       │
      │        │        │     (OT/OTA)           │
      │        │        │        │               │
      └────────┴────────┴────────┴───────────────┘
```

### Entity Relationships

- **Account (Person)**
  - 1:1 → Address
  - 1:1 → Contact
  - 1:1 → Identity
  - 1:1 → OT Education (if user is OT)
  - 1:1 → OTA Education (if user is OTA)
- **Account Affiliate (Company)**
  - No direct child tables
- **Account Management**
  - Managed only by Admin/Main, not linked to user accounts

#### Relationship Types

- **1:1**: One record relates to one other record (e.g., one Account has one Address)
- **0:1**: Optional (e.g., Account may or may not have OT/OTA Education)

---

## 🔑 ID System & Entity Table

| Entity             | ID Prefix | Example ID | Description           |
| ------------------ | --------- | ---------- | --------------------- |
| Account            | 100000    | 100001     | Person user           |
| Account Affiliate  | 100000    | 100001     | Company profile       |
| Address            | 100000    | 100001     | User address          |
| Contact            | 100000    | 100001     | User contact info     |
| Identity           | 100000    | 100001     | User identity         |
| OT Education       | 100000    | 100001     | OT education record   |
| OTA Education      | 100000    | 100001     | OTA education record  |
| Account Management | 100000    | 100001     | Admin-only management |

---

## 👥 User Roles & Security Model

| Role  | Who Uses It?      | Access Scope      | Permissions Summary                |
| ----- | ----------------- | ----------------- | ---------------------------------- |
| Main  | System Owner      | Organization-wide | Full (CRUD, assign, share, delete) |
| Admin | Company Employees | Organization-wide | Manage (read, update, assign)      |
| Owner | Regular Users     | Own data only     | Create, read, update own data      |

**Note:** Only Main can delete records. Admin cannot create or delete, only manage existing data. Owner can only access their own records.

---

## 📊 Table Access Matrix

| Table              | Main App | Admin App | Owner App |
| ------------------ | -------- | --------- | --------- |
| Account            | Full     | Manage    | Own only  |
| Account Affiliate  | Full     | Manage    | Own only  |
| Account Management | Full     | Manage    | No access |
| Address            | Full     | Manage    | Own only  |
| Contact            | Full     | Manage    | Own only  |
| Identity           | Full     | Manage    | Own only  |
| OT Education       | Full     | Manage    | Own only  |
| OTA Education      | Full     | Manage    | Own only  |

---

## 🔄 Example User Flows

- **Person Account Creation:**

  1. User creates an Account (type: Person)
  2. Fills Address, Contact, Identity
  3. Selects OT or OTA → fills respective Education table

- **Company Account Creation:**
  1. User creates an Account Affiliate (type: Company)
  2. No additional tables required

---

## 🛡️ Data Normalization & Validation

- All text fields are stored in uppercase for consistency
- Phone numbers and postal codes are stored without spaces or formatting
- Email addresses are normalized to uppercase
- Referential integrity is enforced (e.g., address must belong to a valid account)

**Example Normalizations:**
| Input | Normalized Output |
|--------------|------------------------|
| " john doe " | "JOHN DOE" |
| "k1a 0a6" | "K1A0A6" |
| "6135551234" | "(613) 555-1234" |
| "ontario" | "ONTARIO" |

---

## 📁 File Structure (Project Overview)

```
osot-dataverse-api/
├── Documentation/
│   └── ARCHITECTURE_OVERVIEW.md
├── src/
│   ├── accounts/
│   ├── auth/
│   ├── integrations/
│   ├── util/
│   └── ...
├── test/
└── ...
```

---

## Summary

- Only three apps are needed: Main, Admin, Owner
- Table access is strictly controlled by user type
- Relationships between tables are simple and mostly one-to-one
- Security is enforced both at the Dataverse and API level

---

_This document is intended to help anyone understand the OSOT Dataverse API structure and security, regardless of technical background._

## Table Relationships (Simplified)

- **Account** (Person)

  - 1:1 → **Address** (Each account has one address)
  - 1:1 → **Contact** (Each account has one contact)
  - 1:1 → **Identity** (Each account has one identity)
  - 1:1 → **OT Education** (If user is OT)
  - 1:1 → **OTA Education** (If user is OTA)

- **Account Affiliate** (Company)

  - No direct child tables (company profile only)

- **Account Management**
  - Managed only by Admin/Main, not linked to user accounts

### Relationship Types

- **1:1**: One record relates to one other record (e.g., one Account has one Address)
- **0:1**: Optional relationship (e.g., Account may or may not have OT Education)
- **N:0**: Not used in this model

---

## Example User Flows

- **Person Account Creation:**

  1. User creates an Account (type: Person)
  2. Fills Address, Contact, Identity
  3. Selects OT or OTA → fills respective Education table

- **Company Account Creation:**
  1. User creates an Account Affiliate (type: Company)
  2. No additional tables required

---

## Summary

- Only three apps are needed: Main, Admin, Owner
- Table access is strictly controlled by user type
- Relationships between tables are simple and mostly one-to-one
- Security is enforced both at the Dataverse and API level

---

_This document is intended to help anyone understand the OSOT Dataverse API structure and security, regardless of technical background._
