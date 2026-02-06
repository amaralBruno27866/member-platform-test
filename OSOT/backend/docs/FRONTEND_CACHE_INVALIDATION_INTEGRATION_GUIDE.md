# Cache Invalidation Integration Guide - Frontend

**Data:** 21 de Janeiro de 2026  
**Status:** 🔄 Implementado no Backend  
**Objetivo:** Orientar o frontend a consumir corretamente a API com o novo sistema de cache invalidation

---

## 📋 O Que Mudou no Backend

### Cache Invalidation Automático
O backend agora **invalida automaticamente o cache** quando dados são modificados via API:

- ✅ **CREATE** → Cache populado
- ✅ **UPDATE** → Cache invalidado após sucesso
- ✅ **DELETE** → Cache invalidado após sucesso

**Comportamento esperado:**

```
User updates Account Name
↓
[PATCH /accounts/{id}] → 200 OK
↓
Backend invalida cache no Redis (~2-3 segundos)
↓
Próxima requisição GET retorna dados atualizados
```

---

## 🎯 Como o Frontend Deve Consumir

### ❌ **Comportamento ANTIGO (não funciona mais)**

Antes, o frontend precisava esperar ~60s (TTL do cache) para ver atualizações:

```javascript
// ❌ EVITAR ISSO
const updateAccount = async (id, data) => {
  const response = await api.patch(`/accounts/${id}`, data);
  // Esperava 60s para cache expirar
  await sleep(60000); // NÃO FAÇA ISSO!
  const updated = await api.get(`/accounts/${id}`);
};
```

### ✅ **Comportamento NOVO (use AGORA)**

Após UPDATE/DELETE, o cache é invalidado **imediatamente**. Você pode fazer refresh em ~2-3 segundos:

```javascript
// ✅ FAZER ISSO
const updateAccount = async (id, data) => {
  const response = await api.patch(`/accounts/${id}`, data);
  
  // Cache já foi invalidado no backend
  // Aguarde apenas 2-3 segundos antes de refetch
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const updated = await api.get(`/accounts/${id}`);
  return updated;
};
```

---

## 📊 Endpoints Afetados

### Invalidação de Cache por Endpoint

| Endpoint | Método | Cache Invalidado | TTL Original |
|----------|--------|------------------|--------------|
| `/accounts/{id}` | PATCH/PUT | ✅ Sim | 60s |
| `/accounts/{id}` | DELETE | ✅ Sim | 60s |
| `/accounts/{id}/address` | PATCH/PUT | ✅ Sim | 60s |
| `/accounts/{id}/address` | DELETE | ✅ Sim | 60s |
| `/accounts/{id}/contact` | PATCH/PUT | ✅ Sim | 60s |
| `/accounts/{id}/contact` | DELETE | ✅ Sim | 60s |
| `/accounts/{id}/identity` | PATCH/PUT | ✅ Sim | 60s |
| `/accounts/{id}/identity` | DELETE | ✅ Sim | 60s |
| `/accounts/{id}/ot-education` | PATCH/PUT | ✅ Sim | 60s |
| `/accounts/{id}/ot-education` | DELETE | ✅ Sim | 60s |
| `/accounts/{id}/ata-education` | PATCH/PUT | ✅ Sim | 60s |
| `/accounts/{id}/ata-education` | DELETE | ✅ Sim | 60s |

---

## 🔄 Padrões Recomendados para Frontend

### Pattern 1: Simple Refetch com Delay

**Melhor para:** Atualizações simples e diretas

```typescript
async updateAccountAndRefresh(id: string, data: any) {
  // 1. Fazer update
  const response = await this.api.patch(`/accounts/${id}`, data);
  
  // 2. Aguardar invalidação do cache (2-3s)
  await this.delay(2500);
  
  // 3. Refetch dados atualizados
  this.account = await this.api.get(`/accounts/${id}`);
  
  return this.account;
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Pattern 2: Optimistic Update + Fallback

**Melhor para:** UX responsivo com fallback seguro

```typescript
async updateAccountOptimistic(id: string, newData: any) {
  const originalData = { ...this.account };
  
  try {
    // 1. Atualizar UI imediatamente (optimistic)
    this.account = { ...this.account, ...newData };
    this.notifyUI('Atualizando...', 'info');
    
    // 2. Fazer request
    const response = await this.api.patch(`/accounts/${id}`, newData);
    
    // 3. Aguardar invalidação
    await this.delay(2500);
    
    // 4. Refetch para garantir consistência
    const verified = await this.api.get(`/accounts/${id}`);
    this.account = verified;
    
    this.notifyUI('Atualizado com sucesso!', 'success');
  } catch (error) {
    // Restaurar dados originais em caso de erro
    this.account = originalData;
    this.notifyUI('Erro ao atualizar. Dados restaurados.', 'error');
    throw error;
  }
}
```

### Pattern 3: Multi-Field Update com Validação

**Melhor para:** Formulários complexos com múltiplos campos

```typescript
async updateMultipleFields(accountId: string, updates: {
  address?: any;
  contact?: any;
  identity?: any;
}) {
  const updatePromises = [];
  
  // Fazer todos os updates em paralelo
  if (updates.address) {
    updatePromises.push(
      this.api.patch(`/accounts/${accountId}/address`, updates.address)
    );
  }
  if (updates.contact) {
    updatePromises.push(
      this.api.patch(`/accounts/${accountId}/contact`, updates.contact)
    );
  }
  if (updates.identity) {
    updatePromises.push(
      this.api.patch(`/accounts/${accountId}/identity`, updates.identity)
    );
  }
  
  // Aguardar todos os updates
  await Promise.all(updatePromises);
  
  // IMPORTANTE: Aguardar invalidação do cache
  await this.delay(3000); // 3s para garantir todos os caches foram invalidados
  
  // Refetch tudo
  const [account, address, contact, identity] = await Promise.all([
    this.api.get(`/accounts/${accountId}`),
    this.api.get(`/accounts/${accountId}/address`),
    this.api.get(`/accounts/${accountId}/contact`),
    this.api.get(`/accounts/${accountId}/identity`),
  ]);
  
  return { account, address, contact, identity };
}
```

---

## ⚙️ Configuração Recomendada no Frontend

### Angular HTTP Interceptor (Exemplo)

```typescript
@Injectable()
export class CacheInvalidationInterceptor implements HttpInterceptor {
  constructor(private cacheService: ClientCacheService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpResponse<any>> {
    // Se é UPDATE/DELETE, limpar cache do cliente também
    if (['PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      return next.handle(req).pipe(
        tap(event => {
          if (event instanceof HttpResponse && event.ok) {
            // Limpar cache local imediatamente
            this.cacheService.invalidateAllAccountData();
            
            // Log para debugging
            console.log(
              `[CACHE] Invalidando após ${req.method} ${req.url}`
            );
          }
        })
      );
    }
    
    return next.handle(req);
  }
}
```

### Service com Gerenciamento de Cache Local

```typescript
@Injectable({ providedIn: 'root' })
export class AccountService {
  private accountCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 60 segundos
  
  constructor(private api: ApiService) {}
  
  async getAccount(id: string): Promise<Account> {
    // Verificar cache local
    const cached = this.accountCache.get(id);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[CACHE HIT] Account ${id}`);
      return cached.data;
    }
    
    // Buscar do servidor
    console.log(`[CACHE MISS] Account ${id}`);
    const data = await this.api.get(`/accounts/${id}`).toPromise();
    
    // Armazenar em cache
    this.accountCache.set(id, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  async updateAccount(id: string, data: any): Promise<Account> {
    // 1. Update
    const response = await this.api.patch(`/accounts/${id}`, data).toPromise();
    
    // 2. Invalidar cache local imediatamente
    this.accountCache.delete(id);
    console.log(`[LOCAL CACHE INVALIDATED] Account ${id}`);
    
    // 3. Aguardar invalidação do servidor
    await this.delay(2500);
    
    // 4. Refetch
    return this.getAccount(id);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 🔍 Debugging & Verificação

### Como Verificar se o Cache foi Invalidado

1. **Abrir Developer Tools (F12)**
2. **Ir para a aba Network**
3. **Fazer um UPDATE via API**
4. **Observar:**
   - Resposta deve ser `200 OK`
   - Log no backend: `🗑️ [CACHE INVALIDATION] ...`

### Logs Esperados no Backend

```
[Nest] 21/01/2026, 10:45:30 AM   [AccountCrudService] Account updated successfully
[Nest] 21/01/2026, 10:45:30 AM   [CacheService] 🗑️ [CACHE INVALIDATION] Account cache cleared for user abc123***
[Nest] 21/01/2026, 10:45:33 AM   [CacheService] ❌ [CACHE MISS] account:identity:abc123***, fetching from Dataverse
```

---

## ⏱️ Timeline Esperada

```
T=0s:    User clica em "Salvar"
T=0.1s:  [PATCH /accounts/{id}] enviado ao backend
T=0.5s:  Backend processa, atualiza Dataverse, invalida cache
T=2.5s:  Frontend aguarda aqui (invalida cache local também)
T=2.6s:  Frontend faz GET /accounts/{id}
T=2.7s:  [CACHE MISS] no backend, busca de Dataverse
T=3.0s:  Dados atualizados chegam ao frontend
T=3.1s:  UI atualiza com novos dados
```

---

## 🐛 Troubleshooting

### "Os dados ainda não mudaram após 3 segundos"

**Possíveis Causas:**

1. **Cache local do navegador** - Limpar `localStorage`/`sessionStorage`
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Browser cache HTTP** - Fazer requisição com `Cache-Control: no-cache`
   ```typescript
   this.api.get(`/accounts/${id}`, {
     headers: { 'Cache-Control': 'no-cache' }
   });
   ```

3. **Proxy/CDN** - Se usar proxy, verificar configuração de cache
   ```
   Cache-Control: no-store (para endpoints de mutação)
   ```

4. **Estado local da aplicação** - Verificar se está atualizando o estado
   ```typescript
   // ✅ Fazer isso
   this.account$.next(newData); // Atualizar Observable
   
   // ❌ Não fazer isso
   this.account = newData; // Apenas atualizar variável local
   ```

### "Recebendo erro 429 (Rate Limit)"

O backend limita requisições paralelas. Usar debounce:

```typescript
updateAccount$ = new Subject<any>();

constructor() {
  this.updateAccount$
    .pipe(
      debounceTime(500), // Aguardar 500ms sem novas requisições
      switchMap(data => this.updateAccountInternal(data))
    )
    .subscribe();
}
```

---

## 📝 Checklist para Frontend

- [ ] Remover sleeps de 60 segundos após UPDATE/DELETE
- [ ] Implementar delay de 2-3 segundos antes de refetch
- [ ] Implementar cache local no service
- [ ] Invalidar cache local após UPDATE/DELETE
- [ ] Usar `debounceTime` para múltiplas requisições
- [ ] Adicionar `Cache-Control: no-cache` em GET após mutações
- [ ] Testar com DevTools Network aberto
- [ ] Testar multi-field updates com delays apropriados
- [ ] Implementar Optimistic UI updates para melhor UX
- [ ] Adicionar logging para debugging

---

## 📞 Contato/Suporte

**Questões sobre cache invalidation?**
- Verificar logs em `/logs` (backend)
- Buscar por `[CACHE INVALIDATION]` nos logs
- Confirmar que cache foi invalidado antes de fazer refetch

**Dúvidas sobre implementação?**
- Ver exemplos em `src/classes/{entity}/controllers/*.controller.ts`
- Procurar por `updateAccount()` ou `updateAddress()` para ver pattern usado no teste

---

**Última Atualização:** 21 de Janeiro de 2026
