# Password Recovery - Dual User Type Support

## Overview

O sistema de recuperação de senha foi refatorado para suportar **dois tipos de usuário**:
- 📋 **Account**: Usuários principais do sistema (profissionais, administradores)
- 🏢 **Affiliate**: Organizações afiliadas com representantes

## Architecture

### User Type Detection

O sistema usa `EnhancedUserRepositoryService.getUserType()` para detectar automaticamente o tipo de usuário baseado no email:

```typescript
const userLookupResult = await this.enhancedUserRepository.getUserType(email);
// Returns: { userType: 'account' | 'affiliate', found: boolean }
```

### Password Reset Flow

#### 1. **Request Password Recovery** (`POST /password-recovery/request`)
```typescript
// ✅ Já suportava ambos os tipos
await this.enhancedUserRepository.getUserType(dto.email);
// Envia email com contexto apropriado (organization context para affiliates)
```

#### 2. **Reset Password** (`POST /password-recovery/reset`)
```typescript
// ✅ REFATORADO para detectar tipo e processar adequadamente

if (isAffiliate) {
  // AFFILIATE: 
  // 1. Lookup usando AffiliateLookupService
  // 2. Update usando AffiliateRepository.updatePassword()
  const affiliate = await this.affiliateLookupService.findByEmail(email, Privilege.OWNER);
  const hashedPassword = await hashPassword(newPassword);
  await this.affiliateRepository.updatePassword(affiliateId, hashedPassword);
} else {
  // ACCOUNT:
  // 1. Lookup usando AccountLookupService  
  // 2. Update usando AccountCrudService.update()
  await this.accountLookupService.findByEmail(email, 'owner');
  await this.accountCrudService.update(email, { osot_password: newPassword });
}
```

## Technical Implementation

### Services Used

| Type | Lookup Service | Update Method | Privilege |
|------|---------------|---------------|-----------|
| **Account** | `AccountLookupService.findByEmail(email, 'owner')` | `AccountCrudService.update(email, dto)` | String `'owner'` |
| **Affiliate** | `AffiliateLookupService.findByEmail(email, Privilege.OWNER)` | `AffiliateRepository.updatePassword(id, hash)` | Enum `Privilege.OWNER` |

### Key Differences

#### Account Update
- ✅ Uses `AccountCrudService.update()` que aceita email como identificador
- ✅ Password hashing é feito internamente pelo service
- ✅ Role privilege como string: `'owner'`

#### Affiliate Update  
- ✅ Requires `osot_table_account_affiliateid` (GUID) como identificador
- ✅ Must hash password **antes** de passar ao repository
- ✅ Uses `AffiliateRepository.updatePassword()` diretamente
- ✅ Role privilege como enum: `Privilege.OWNER`

### Why Use Repository for Affiliate?

O `UpdateAffiliateDto` **intencionalmente exclui** `osot_password`:
```typescript
// ❌ Not in UpdateAffiliateDto
osot_password?: string; 

// ✅ Design decision: "use dedicated password change endpoint"
```

Portanto, usamos o repository pattern diretamente:
```typescript
await this.affiliateRepository.updatePassword(affiliateId, hashedPassword);
```

## System Role - Anonymous Operations

Password recovery é uma operação **anônima** (usuário não autenticado). Para operações de sistema, usamos:

- **Account**: String literal `'owner'` para máximo privilégio
- **Affiliate**: `Privilege.OWNER` enum para máximo privilégio

## Email Templates

Ambos os tipos recebem emails personalizados:

### Request Email
```handlebars
Subject: Password Recovery - OSOT{{ organizationContext }}
organizationContext = isAffiliate ? ' for YourOrg' : ''
```

### Confirmation Email  
```handlebars
Subject: Your password has been changed - OSOT
accountType: 'account' | 'affiliate'
organizationContext: isAffiliate ? ' for your organization' : ''
```

## Security Features

### Anti-Enumeration
- ✅ Sempre retorna sucesso mesmo se usuário não existe
- ✅ Simula delay (500ms) para evitar timing attacks

### Token Security
- ✅ UUID tokens armazenados no Redis
- ✅ TTL de 30 minutos
- ✅ Tokens não removidos após uso (permite bloqueio posterior se necessário)

### Privilege Escalation Protection
- ✅ Account: usa `'owner'` role internamente, não exposto ao usuário
- ✅ Affiliate: usa `Privilege.OWNER` internamente, não exposto ao usuário
- ✅ Password hashing automático (bcrypt, SALT_ROUNDS=10)

## Dependencies

### Module Imports
```typescript
@Module({
  imports: [
    DataverseModule,
    AccountModule,      // ✅ Provides AccountLookupService, AccountCrudService
    AffiliateModule,    // ✅ Provides AffiliateLookupService, AFFILIATE_REPOSITORY
  ],
})
```

### Injected Services
```typescript
constructor(
  private readonly accountLookupService: AccountLookupService,
  private readonly accountCrudService: AccountCrudService,
  private readonly affiliateLookupService: AffiliateLookupService,
  @Inject(AFFILIATE_REPOSITORY)
  private readonly affiliateRepository: AffiliateRepository,
  private readonly enhancedUserRepository: EnhancedUserRepositoryService,
)
```

## Testing Checklist

### Account User Recovery
- [ ] Request password reset for account user
- [ ] Receive email with correct context (no organization)
- [ ] Click button in email
- [ ] Submit new password
- [ ] Verify password updated in Dataverse
- [ ] Login with new password

### Affiliate User Recovery  
- [ ] Request password reset for affiliate user
- [ ] Receive email with organization context
- [ ] Click button in email
- [ ] Submit new password
- [ ] Verify password updated in Dataverse (osot_table_account_affiliate)
- [ ] Login with new password

### Error Cases
- [ ] Invalid/expired token → 400 error
- [ ] Non-existent account → Success (anti-enumeration)
- [ ] Non-existent affiliate → Success (anti-enumeration)
- [ ] Invalid email format → Validation error

## Frontend Integration

### No Changes Required
Frontend não precisa saber o tipo de usuário. Backend detecta automaticamente:

```typescript
// Frontend envia apenas:
POST /password-recovery/request
{ "email": "user@example.com" }

// Backend detecta tipo automaticamente
POST /password-recovery/reset  
{ "token": "uuid", "newPassword": "NewPass123!" }
```

## Future Enhancements

### Phase 2 (Optional)
- [ ] Cache invalidation após password change (sessions/JWTs)
- [ ] Multi-factor authentication para password reset
- [ ] Rate limiting por email (não só por IP)
- [ ] Audit log de password changes

### Phase 3 (Long-term)
- [ ] CAPTCHA no request (já previsto no DTO)
- [ ] Security report page para mudanças não autorizadas
- [ ] Password strength indicator no frontend
- [ ] Password history (prevent reuse)

## Migration Notes

### Breaking Changes
- ✅ Nenhuma! Sistema continua funcionando para accounts existentes
- ✅ Adiciona suporte para affiliates sem modificar API pública

### Backward Compatibility
- ✅ `requestPasswordRecoveryLegacy()` mantido para compatibilidade
- ✅ Endpoints públicos não mudaram
- ✅ DTOs não mudaram

## Related Documentation
- [PASSWORD_RECOVERY_FLOW.md](./PASSWORD_RECOVERY_FLOW.md) - Fluxo técnico completo
- [PASSWORD_RECOVERY_FRONTEND_GUIDE.md](./PASSWORD_RECOVERY_FRONTEND_GUIDE.md) - Guia de integração frontend
- [FRONTEND_PASSWORD_RECOVERY_REQUIREMENTS.md](./FRONTEND_PASSWORD_RECOVERY_REQUIREMENTS.md) - Requisitos para frontend
