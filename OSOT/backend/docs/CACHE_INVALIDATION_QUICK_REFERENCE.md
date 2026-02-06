# ⚡ Cache Invalidation - Quick Reference (Frontend)

**Documento curto** | Veja [FRONTEND_CACHE_INVALIDATION_INTEGRATION_GUIDE.md](FRONTEND_CACHE_INVALIDATION_INTEGRATION_GUIDE.md) para detalhes completos

---

## O Que Mudou?

**ANTES:** Cache expirava em 60 segundos  
**AGORA:** Cache é invalidado imediatamente após UPDATE/DELETE

---

## Como Usar

### ✅ Padrão Correto

```typescript
// 1. Fazer update
await api.patch(`/accounts/${id}`, data);

// 2. Aguardar 2-3 segundos (cache invalidation)
await delay(2500);

// 3. Refetch dados atualizados
const updated = await api.get(`/accounts/${id}`);
```

### ❌ Evitar

```typescript
// ❌ Não aguarde 60 segundos
await delay(60000); // NUNCA!

// ❌ Não confie em cache automático
// Sempre refetch após UPDATE/DELETE
```

---

## Timeline

```
UPDATE/DELETE → 200 OK
              ↓
         Cache invalidado no Redis (~500ms)
              ↓
    Frontend aguarda 2-3 segundos
              ↓
          GET /resource
              ↓
    Dados atualizados retornam
```

---

## Código Pronto para Copiar

### Service Simple

```typescript
async updateAndRefresh(id: string, data: any) {
  await api.patch(`/accounts/${id}`, data);
  await this.delay(2500); // Aguardar cache
  return api.get(`/accounts/${id}`);
}

private delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
```

### Optimistic Update

```typescript
async updateOptimistic(id: string, newData: any) {
  const original = { ...this.current };
  
  try {
    this.current = { ...this.current, ...newData }; // UI atualiza imediatamente
    
    await api.patch(`/accounts/${id}`, newData);
    await this.delay(2500);
    
    this.current = await api.get(`/accounts/${id}`); // Validar no servidor
    this.showSuccess('Atualizado!');
  } catch (e) {
    this.current = original; // Reverter em caso de erro
    this.showError('Erro ao atualizar');
    throw e;
  }
}
```

### Múltiplos Updates

```typescript
async updateMultiple(id: string, { address, contact, identity }) {
  // Fazer todos em paralelo
  await Promise.all([
    address && api.patch(`/accounts/${id}/address`, address),
    contact && api.patch(`/accounts/${id}/contact`, contact),
    identity && api.patch(`/accounts/${id}/identity`, identity),
  ]);
  
  // Aguardar todos os caches
  await this.delay(3000);
  
  // Refetch tudo
  return Promise.all([
    api.get(`/accounts/${id}`),
    api.get(`/accounts/${id}/address`),
    api.get(`/accounts/${id}/contact`),
    api.get(`/accounts/${id}/identity`),
  ]);
}
```

---

## Endpoints Afetados

Todos os endpoints com PATCH/PUT/DELETE:

- `/accounts/{id}` ✅
- `/accounts/{id}/address` ✅
- `/accounts/{id}/contact` ✅
- `/accounts/{id}/identity` ✅
- `/accounts/{id}/ot-education` ✅
- `/accounts/{id}/ota-education` ✅

---

## Debugging

**Verificar se cache foi invalidado:**

```javascript
// DevTools → Network → Fazer update
// Procurar por resposta 200 OK
// Backend logs devem mostrar: 🗑️ [CACHE INVALIDATION]
```

**Se dados não atualizarem:**

1. Limpar browser cache: `localStorage.clear()`
2. Verificar se está fazendo GET após UPDATE
3. Verificar se está aguardando 2-3 segundos
4. Ver logs: `[CACHE INVALIDATION]` deve aparecer no backend

---

## Perguntas?

→ Ver [FRONTEND_CACHE_INVALIDATION_INTEGRATION_GUIDE.md](FRONTEND_CACHE_INVALIDATION_INTEGRATION_GUIDE.md) para exemplos completos  
→ Procurar por `[CACHE INVALIDATION]` nos logs do backend
