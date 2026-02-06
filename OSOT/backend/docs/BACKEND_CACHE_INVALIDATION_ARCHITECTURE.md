# Cache Invalidation Architecture - Backend Implementation

**Data:** 21 de Janeiro de 2026  
**Audience:** Frontend Team (para entender o que o backend está fazendo)  
**Status:** ✅ Implementado e Testado

---

## 🏗️ O Que Foi Implementado

### Redis Cache System

**Centralização:** `src/cache/cache.service.ts`

```
┌─────────────────────────────────────────┐
│         Frontend Request                 │
└────────────────┬────────────────────────┘
                 ↓
        ┌─────────────────┐
        │  Check Redis    │ (Cache Layer)
        │   Cache Hit?    │
        └────────┬────────┘
         ┌───────┴────────┐
         ↓ YES            ↓ NO
    Return data    Query Dataverse
    (Fast!)       (Slower, then cache)
         │              │
         └──────┬───────┘
                ↓
       ┌──────────────────┐
       │   Return Data    │
       │  to Frontend     │
       └──────────────────┘
```

**Endpoints com Cache:**
- `GET /accounts/{id}` - Cache por 60s
- `GET /accounts/{id}/address` - Cache por 60s
- `GET /accounts/{id}/contact` - Cache por 60s
- `GET /accounts/{id}/identity` - Cache por 60s
- `GET /accounts/{id}/ot-education` - Cache por 60s
- `GET /accounts/{id}/ota-education` - Cache por 60s

---

## 🗑️ Cache Invalidation Flow

### Quando Cache é Invalidado

**1. UPDATE (PATCH/PUT)**

```
┌─────────────────────────────────────┐
│   PATCH /accounts/{id}              │
│   { firstName: "João" }             │
└────────┬────────────────────────────┘
         ↓
  ┌─────────────────────┐
  │ 1. Validate DTO     │
  │ 2. Get from DB      │
  │ 3. Apply changes    │
  │ 4. Save to DB       │
  │ 5. Extract user ID  │ ← IMPORTANTE!
  │ 6. Invalidate cache │ ← AQUI!
  │ 7. Return 200 OK    │
  └────────┬────────────┘
           ↓
   ┌──────────────────┐
   │  Redis DELETED   │ ← account:identity:{userId}
   │  account:*       │ ← account:address:{userId}
   │  contact:*       │ ← account:contact:{userId}
   │  identity:*      │ ← account:account:{userId}
   └──────────────────┘
           ↓
   Log: 🗑️ [CACHE INVALIDATION]
```

**2. DELETE**

```
DELETE /accounts/{id}
   ↓
Delete from Dataverse
   ↓
Extract user ID
   ↓
Invalidate ALL cache keys for that user
   ↓
Return 200 OK
```

**3. CREATE**

```
POST /accounts (new account)
   ↓
Create in Dataverse
   ↓
Populate cache for new user
   ↓
Return 201 Created with data
```

---

## 📋 Implementação por Serviço

### Identity Service Example

**Arquivo:** `src/classes/user-account/identity/services/identity-crud.service.ts`

```typescript
// Phase 6: Extrair Account GUID (para cache invalidation)
const accountGuid = this.extractAccountGuid(updatedRecord, existingIdentity);

// Phase 7: Invalidar cache após sucesso
if (updatedRecord && accountGuid) {
  await this.cacheService.invalidateIdentity(accountGuid);
  // Log: 🗑️ [CACHE INVALIDATION] Identity cache cleared for user abc123***
}

return AccountMapper.mapInternalToResponseDto(updatedRecord);
```

**Cache Invalidation Method:**

```typescript
// Em cache.service.ts
async invalidateIdentity(accountGuid: string): Promise<void> {
  const cacheKey = this.buildAccountIdentityKey(accountGuid);
  await this.redis.del(cacheKey);
  
  this.logger.warn(
    `🗑️ [CACHE INVALIDATION] Identity cache cleared for user ${accountGuid.substring(0, 8)}***`,
    { cacheKey }
  );
}
```

---

## 🔑 Cache Key Strategy

### Key Structure

```
account:account:{accountGuid}      → Dados da conta
account:address:{accountGuid}      → Endereço (via account lookup)
account:contact:{accountGuid}      → Contatos
account:identity:{accountGuid}     → Identidades
account:ot-education:{accountGuid} → Educação OT
account:ota-education:{accountGuid}→ Educação OTA
```

### Key Building Functions

```typescript
class CacheService {
  buildAccountKey(guid: string): string {
    return `account:account:${guid}`;
  }
  
  buildAddressKey(guid: string): string {
    return `account:address:${guid}`;
  }
  
  buildIdentityKey(guid: string): string {
    return `account:identity:${guid}`;
  }
  
  // ... outros
}
```

---

## ⏱️ TTL (Time-To-Live)

**Configuração Atual:** 60 segundos (demo mode)

```typescript
const TTL_DEMO = 60; // 60 segundos

await this.redis.setex(
  cacheKey,
  TTL_DEMO, // TTL em segundos
  JSON.stringify(data)
);
```

**Recomendação para Produção:**

```typescript
const TTL_PRODUCTION = {
  account: 300,        // 5 minutos
  address: 300,        // 5 minutos
  contact: 300,        // 5 minutos
  identity: 300,       // 5 minutos
  education: 600,      // 10 minutos (menos mutável)
};
```

---

## 📊 Cache Performance

### Antes (sem cache)

```
GET /accounts/{id} → Dataverse query → ~500ms → Return
GET /accounts/{id} → Dataverse query → ~500ms → Return
GET /accounts/{id} → Dataverse query → ~500ms → Return
────────────────────────────────────────────────
Total: 1500ms para 3 requests
```

### Depois (com cache)

```
GET /accounts/{id} → Redis HIT → ~5ms → Return
GET /accounts/{id} → Redis HIT → ~5ms → Return
GET /accounts/{id} → Redis HIT → ~5ms → Return
────────────────────────────────────────────────
Total: 15ms para 3 requests (100x mais rápido!)
```

### PATCH + Invalidation

```
PATCH /accounts/{id} → Dataverse update → Invalidate cache → Return (200ms)
     ↓
GET /accounts/{id} → Redis MISS → Dataverse → Cache → Return (500ms)
     ↓
GET /accounts/{id} → Redis HIT → Return (5ms)
```

---

## 🔄 Complete Request Lifecycle

### GET Request (Read)

```
Frontend: GET /accounts/{id}
   ↓
Backend: Check Redis cache
   ↓ (MISS)
   Query Dataverse
   ↓
   Store in Redis (TTL: 60s)
   ↓
   Return 200 OK with data
   ↓
Frontend: Render data
```

### PATCH Request (Update + Invalidate)

```
Frontend: PATCH /accounts/{id} { name: "João" }
   ↓
Backend: Validate DTO
   ↓
   Get existing record from Dataverse
   ↓
   Apply changes
   ↓
   Save to Dataverse
   ↓
   Extract user GUID (accountGuid = abc123...)
   ↓
   INVALIDATE Redis keys:
     - account:account:abc123...
     - account:address:abc123...
     - account:contact:abc123...
     - account:identity:abc123...
     - account:ot-education:abc123...
     - account:ota-education:abc123...
   ↓
   Log: 🗑️ [CACHE INVALIDATION] cleared for user abc123***
   ↓
   Return 200 OK
   ↓
Frontend: Display success
   ↓
Frontend: Wait 2-3 seconds (allow invalidation to propagate)
   ↓
Frontend: GET /accounts/{id}
   ↓
Backend: Check Redis (MISS, foi invalidado)
   ↓
   Query Dataverse for updated data
   ↓
   Store in Redis
   ↓
   Return 200 OK with NEW data
   ↓
Frontend: Render updated data
```

---

## 🐛 Debugging: Como Verificar o Cache

### Command: Check Redis Key

```bash
# No backend (em redis-cli)
redis-cli GET account:account:abc123-def-456

# Output:
# (nil) - Cache foi invalidado
# ou
# "{...json data...}" - Cache ainda existe
```

### Check Cache Invalidation Logs

```bash
# Backend logs
grep "[CACHE INVALIDATION]" logs/*.log

# Output esperado:
# [Nest] 21/01/2026, 10:45:30 AM   
# 🗑️ [CACHE INVALIDATION] Account cache cleared for user abc123***
```

### Trace Complete Flow

```
1. Frontend faz PATCH
   → Network tab mostra 200 OK
   → Response time: ~200ms

2. Backend logs mostram:
   ✅ Account updated successfully
   🗑️ [CACHE INVALIDATION] Account cache cleared
   
3. Frontend aguarda 2-3 segundos

4. Frontend faz GET
   → Network tab mostra 200 OK
   → Response time: ~500ms (MISS, dados frescos)
   
5. Backend logs mostram:
   ❌ [CACHE MISS] account:account:abc123***
   Query from Dataverse
```

---

## ⚠️ Possíveis Problemas & Soluções

### Problema 1: Cache invalidado mas GET retorna dados antigos

**Causa:** Cache local do Frontend  
**Solução:** Adicionar `Cache-Control: no-cache` no GET

```typescript
// Frontend deve fazer:
api.get(`/accounts/${id}`, {
  headers: { 'Cache-Control': 'no-cache' }
});
```

### Problema 2: Múltiplos UPDATEs simultâneos

**Causa:** Dois PATCH ao mesmo tempo, cache pode ficar inconsistente  
**Solução:** Backend valida e invalida para cada PATCH

```
PATCH /accounts/{id} (update 1)  ← Invalidate cache
PATCH /accounts/{id} (update 2)  ← Invalidate cache (novamente, OK)
GET /accounts/{id}               ← Gets latest data
```

### Problema 3: Dados diferentes entre frontend e backend

**Causa:** Frontend fez GET antes do cache ser invalidado  
**Solução:** Frontend deve sempre aguardar 2-3s após PATCH

```typescript
// ✅ Correto
await patch(...);
await delay(2500);
await get(...);

// ❌ Incorreto
await patch(...);
await get(...); // Pode retornar dados antigos!
```

---

## 🔐 Security Considerations

### User Isolation

Cache keys são baseadas em **accountGuid** (GUID da conta Dataverse)

```typescript
// Cache é specific ao usuário
account:account:abc123... → user A only
account:account:def456... → user B only

// Ninguém consegue acessar cache de outro usuário
```

### No PII in Cache Keys

```typescript
// ✅ Bom: GUID apenas
`account:account:abc123-def-456-ghi`

// ❌ Ruim: Email exposado
`account:account:john@example.com`
```

### PII Redaction in Logs

```typescript
// Log seguro
🗑️ [CACHE INVALIDATION] Account cache cleared for user abc123***
   ↑ GUID truncado, não expõe informação sensível
```

---

## 📈 Metrics & Monitoring

### O Que Monitorar

1. **Cache Hit Rate**
   ```
   (Hits / Total Requests) * 100
   Target: > 80% hit rate
   ```

2. **Invalidation Latency**
   ```
   Time between PATCH response and cache deletion
   Target: < 100ms
   ```

3. **Query Performance**
   ```
   - With cache (MISS): ~500ms (Dataverse)
   - Without cache: ~500ms (same)
   - With cache (HIT): ~5ms (Redis)
   ```

---

## 🚀 Future Improvements

- [ ] Implement token caching in DataverseService (avoid redundant Azure AD calls)
- [ ] Add WebSocket for real-time invalidation notifications
- [ ] Implement cache warmup strategy
- [ ] Add cache metrics to monitoring dashboard
- [ ] Implement distributed cache invalidation (if multiple backend instances)

---

**Documento Criado:** 21 de Janeiro de 2026
