# STAFF Account Group - Implementation Guide

## Overview
STAFF (AccountGroup = 4) is a special account type for internal administrative users who do NOT require email verification or orchestrator workflows.

## Key Differences: STAFF vs Regular Users

| Feature | STAFF | OT/OTA/VENDOR/OTHER |
|---------|-------|-------------------|
| **Email Verification** | ❌ Not required | ✅ Required |
| **Orchestrator Flow** | ❌ Bypassed | ✅ Required |
| **Creation Method** | Direct (MAIN/ADMIN only) | Public registration |
| **Privilege Level** | MAIN or ADMIN only | Defaults to OWNER |
| **Visibility in UI** | Only for MAIN users | Public (all users) |
| **Email Type** | Corporate emails | Personal emails |

## Business Rules

### 1. Creation Restrictions
- **Only MAIN or ADMIN** can create STAFF accounts
- Validation enforced in `AccountBusinessRulesService.validateAccountCreation()`
- Attempting to create STAFF with OWNER privilege → Validation error

### 2. Privilege Requirements
- STAFF accounts **MUST** have `Privilege.MAIN` or `Privilege.ADMIN`
- Cannot create STAFF with `Privilege.OWNER`

### 3. Visibility Control
- Frontend dropdown filtered by backend
- `/public/enums/account-groups` endpoint checks JWT privilege
- Non-MAIN users receive filtered list (STAFF excluded)

## Implementation Details

### Backend Filtering (enums.controller.ts)
```typescript
@Get('account-groups')
getAccountGroups(@User() user?: Record<string, unknown>) {
  let groups = getAllAccountGroups();
  
  // Filter STAFF if user is not MAIN
  const userPrivilege = user?.privilege || user?.osot_privilege;
  if (userPrivilege !== Privilege.MAIN) {
    groups = groups.filter(g => g.value !== AccountGroup.STAFF);
  }
  
  return { success: true, data: groups };
}
```

### Business Rule Validation (account-business-rules.service.ts)
```typescript
// In validateAccountCreation()
if (createAccountDto.osot_account_group === AccountGroup.STAFF) {
  const userPrivilege = this.getUserPrivilegeFromRole(userRole);
  if (userPrivilege !== Privilege.MAIN && userPrivilege !== Privilege.ADMIN) {
    violations.push('Only MAIN or ADMIN users can create STAFF accounts');
  }
}
```

### Bootstrap Service
```typescript
// First-time setup creates STAFF user
const userPayload = {
  osot_account_group: AccountGroup.STAFF, // No email verification needed
  osot_privilege: Privilege.MAIN,
  osot_account_status: 1, // Active immediately
  osot_active_member: true,
  // ... other fields
};
```

## Endpoints

### Creating STAFF Users

**Option 1: Bootstrap (First-Time Setup)**
- Runs on first server startup
- No JWT required (uses MAIN credentials directly)
- Prompts for org + admin data
- Creates STAFF user automatically

**Option 2: MAIN Admin Creates STAFF (TODO)**
Create dedicated endpoint:
```typescript
// POST /private/accounts/staff (MAIN only)
@Post('staff')
@UseGuards(JwtAuthGuard, MainPrivilegeGuard)
async createStaffUser(@Body() dto: CreateStaffAccountDto) {
  // Bypass orchestrator
  // Create account directly with STAFF group
  // No email verification needed
}
```

### Regular User Creation
```typescript
// POST /public/registration (uses orchestrator)
// - Goes through email verification
// - Cannot create STAFF accounts
// - Always gets Privilege.OWNER
```

## Security Considerations

### Why STAFF Doesn't Need Email Verification
1. **Created by MAIN users** → Already trusted
2. **Corporate emails** → Domain controlled by organization
3. **Administrative purpose** → Internal team members
4. **Rapid onboarding** → No delays for support staff

### Why Filter STAFF from UI
1. **Security** → Prevent privilege escalation attempts
2. **UX** → Avoid confusion for regular users
3. **Compliance** → Only authorized admins can create internal accounts

## Testing Checklist

- [ ] Bootstrap creates STAFF user successfully
- [ ] Non-MAIN users don't see STAFF in dropdown
- [ ] MAIN users see STAFF in dropdown
- [ ] Attempting to create STAFF with OWNER privilege fails validation
- [ ] STAFF accounts created without email verification
- [ ] STAFF accounts have MAIN or ADMIN privilege
- [ ] Public registration cannot create STAFF accounts

## Future Enhancements

### Dedicated STAFF Creation Endpoint (Phase 2)
```typescript
// src/classes/user-account/account/controllers/account-private.controller.ts

@Post('staff')
@UseGuards(AuthGuard('jwt'))
@ApiOperation({ 
  summary: 'Create STAFF account (MAIN only)',
  description: 'Creates internal staff account without email verification'
})
async createStaffAccount(
  @Body() dto: CreateStaffAccountDto,
  @User() user: Record<string, unknown>
) {
  // 1. Validate user is MAIN
  const privilege = user.privilege || user.osot_privilege;
  if (privilege !== Privilege.MAIN) {
    throw new ForbiddenException('Only MAIN users can create STAFF accounts');
  }
  
  // 2. Validate DTO (must have STAFF group + MAIN/ADMIN privilege)
  if (dto.osot_account_group !== AccountGroup.STAFF) {
    throw new BadRequestException('This endpoint is for STAFF accounts only');
  }
  
  // 3. Create account directly (bypass orchestrator)
  const account = await this.accountCrudService.create(dto, 'main');
  
  // 4. Set account as Active immediately (no verification)
  await this.accountCrudService.update(
    account.osot_table_accountid,
    { osot_account_status: AccountStatus.ACTIVE },
    'main'
  );
  
  return { success: true, data: account };
}
```

### Email Templates
STAFF accounts could have custom welcome emails (no verification):
- `staff-account-created.html` → Welcome to the team
- No verification link needed
- Include login credentials info
- Corporate onboarding checklist

## Migration from Current System

If you have existing OT/OTA accounts that should be STAFF:
```sql
-- Dataverse: Update existing accounts to STAFF
UPDATE osot_table_accounts
SET osot_account_group = 4 -- STAFF
WHERE osot_privilege = 3 -- MAIN
AND osot_email LIKE '%@yourdomain.com' -- Corporate domain
```

## Related Files
- `src/common/enums/account-group.enum.ts` - STAFF enum definition
- `src/common/controllers/enums.controller.ts` - Backend filtering
- `src/classes/user-account/account/services/account-business-rules.service.ts` - Validation
- `src/bootstrap/bootstrap.service.ts` - First-time setup
- `src/classes/user-account/account/constants/account.constants.ts` - Constants

## Support
For questions about STAFF account management, refer to:
- `.github/copilot-instructions.md` - Organization hierarchy section
- `docs/ARCHITECTURE_OVERVIEW.md` - Multi-tenant architecture
