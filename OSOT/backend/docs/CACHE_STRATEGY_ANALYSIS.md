# Análise de Estratégia de Cache - OSOT Dataverse API

## Problema Atual

**Sintoma:** Mudanças no banco de dados Dataverse refletem com latência inconsistente no frontend:
- Algumas mudanças aparecem imediatamente
- Outras levam minutos para refletir
- Cria confusão para usuários sobre se a ação foi bem-sucedida

**Causas Raiz Identificadas:**

### 1. **TTLs Inconsistentes e Longos**
```
Product Catalog:        300s  (5 min)
Account Profile:       1800s  (30 min)
Education:            3600s  (1 hour)
Membership Settings:  3600s  (1 hour)
OT-Education Session: 7200s  (2 hours)
Contact Orchestrator: 7200s  (2 hours)
```

**Problema:** Sem invalidação após escrita, usuário espera até TTL expirar para ver mudanças.

### 2. **Falta de Invalidação de Cache em Operações de Escrita**
- ❌ `account.update()` → Não invalida `account:profile:{userId}`
- ❌ `product.create()` → Não invalida `products:catalog:*`
- ❌ `identity.update()` → Não invalida `account:identity:{userId}`
- ❌ `membership.update()` → Não invalida `membership:*`

Exemplo atual:
```typescript
// account-crud.service.ts - FALTA INVALIDAÇÃO
async update(dto: UpdateAccountDto, userId: string, userRole?: string) {
  const updated = await this.accountRepository.update(accountId, internal);
  
  // ❌ NÃO INVALIDA CACHE
  // await this.cacheService.invalidate(userId);
  
  return this.accountMapper.mapInternalToResponseDto(updated);
}
```

### 3. **Padrão "Fail Open" em Filtros de Audience Target**
```typescript
// product-lookup.service.ts
catch (error) {
  // Em erro, retorna TODOS os produtos (nenhum filtro)
  return products;  // ❌ Permite acesso a produtos bloqueados
}
```

---

## Opções de Melhoria (Ordenadas por Impacto + Esforço)

### **OPÇÃO 1: Invalidação Explícita Pós-Escrita** ⭐⭐⭐ (RECOMENDADO - Rápido)
**Impacto:** Alto | **Esforço:** Médio | **Tempo:** 2-3 horas

#### Como Funciona:
Toda operação de escrita (create/update/delete) invalida imediatamente o cache relacionado.

#### Implementação:
```typescript
// 1. Criar método de invalidação em CacheService
export class CacheService {
  async invalidateUser(userId: string): Promise<void> {
    // Invalida TODOS os caches de um usuário
    await this.redisService.deletePattern(`*:${userId}`);
  }
  
  async invalidateProduct(productId?: string): Promise<void> {
    if (productId) {
      await this.redisService.deletePattern(`products:*:${productId}`);
    } else {
      // Invalida todo o catálogo
      await this.redisService.deletePattern('products:*');
    }
  }
}

// 2. Usar em CRUD services
async update(dto: UpdateAccountDto) {
  const updated = await this.accountRepository.update(accountId, internal);
  
  // ✅ INVALIDA IMEDIATAMENTE
  await this.cacheService.invalidateUser(accountId);
  
  return mapper(updated);
}

// 3. Usar em Product CRUD
async createProduct(dto: CreateProductDto) {
  const created = await this.productRepository.create(internal);
  
  // ✅ INVALIDA TODO CATÁLOGO
  await this.cacheService.invalidateProduct();
  
  return mapper(created);
}
```

#### Vantagens:
- ✅ Implementação simples e rápida
- ✅ Sem overhead de comunicação (não precisa notificar frontend)
- ✅ Frontend vê mudanças na próxima requisição
- ✅ Funciona com arquitetura atual

#### Desvantagens:
- ❌ Frontend não sabe que dados mudaram (ainda faz requisição)
- ❌ Não resolve problema de **revalidação em tempo real**
- ❌ Pode ter "cache miss" desnecessário se ninguém acessar após update

---

### **OPÇÃO 2: Event-Driven Cache Invalidation (Webhooks)**  ⭐⭐⭐⭐ (FUTURO)
**Impacto:** Muito Alto | **Esforço:** Alto | **Tempo:** 5-8 horas

#### Como Funciona:
Backend publica eventos de mudança via WebSocket/Server-Sent Events. Frontend se inscreve e invalida cache localmente.

#### Implementação Teórica:
```typescript
// 1. Backend publica evento
@Injectable()
export class ProductCrudService {
  constructor(
    private eventGateway: ProductEventGateway, // WebSocket
  ) {}
  
  async updateProduct(dto: UpdateProductDto) {
    const updated = await this.repo.update(id, internal);
    
    // ✅ NOTIFICA TODOS OS CLIENTES CONECTADOS
    this.eventGateway.broadcastProductUpdated({
      productId: updated.id,
      changes: dto,
      timestamp: new Date(),
    });
    
    return mapper(updated);
  }
}

// 2. Frontend recebe notificação em tempo real
useEffect(() => {
  socket.on('product:updated', (data) => {
    // ✅ INVALIDA CACHE LOCAL IMEDIATAMENTE
    queryClient.invalidateQueries(['product', data.productId]);
    queryClient.invalidateQueries(['products']); // Catálogo inteiro
    
    // Opcionalmente, mostra toast: "Produto atualizado!"
    showNotification('Produto atualizado com sucesso');
  });
}, []);
```

#### Vantagens:
- ✅ Revalidação em **tempo real** (não precisa esperar TTL)
- ✅ Frontend notificado imediatamente de mudanças
- ✅ Escalável: eventos podem ser usados para audit/analytics
- ✅ Múltiplos clientes sincronizados

#### Desvantagens:
- ❌ Implementação complexa (precisa WebSocket/SSE + gateway)
- ❌ Overhead de infraestrutura (conexões persistentes)
- ❌ Requer frontend atualizado (React Query invalidate)
- ❌ Precisa tratar desconexões/reconexões

---

### **OPÇÃO 3: TTL Adaptativo por Tipo de Dado** ⭐⭐ (SIMPLES)
**Impacto:** Médio | **Esforço:** Baixo | **Tempo:** 30 min

#### Como Funciona:
Usar TTLs menores para dados mutáveis, maiores para dados estáticos.

#### Implementação:
```typescript
export const CACHE_TTL = {
  // Dados críticos/mutáveis: 5-15 minutos
  PRODUCT_CATALOG:    300,  // 5 min  (produtos mudam preço/disponibilidade)
  ACCOUNT_PROFILE:    900,  // 15 min (perfil muda frequentemente)
  MEMBERSHIP_STATUS:  300,  // 5 min  (status crítico)
  
  // Dados semi-estáticos: 30-60 minutos
  PRODUCT_DETAILS:    1800, // 30 min (descrição, fotos)
  ADDRESS:            1800, // 30 min (muda menos)
  
  // Dados estáticos: 2+ horas
  IDENTITY:           3600, // 1 hour (muda raramente)
  EDUCATION:          7200, // 2 hours (muda raramente)
  AUDIENCE_TARGET:    7200, // 2 hours (estável)
};
```

#### Vantagens:
- ✅ Simples de implementar (muda constantes)
- ✅ Reduz espera para dados críticos
- ✅ Sem overhead arquitetural

#### Desvantagens:
- ❌ TTL ainda é "adivinha"
- ❌ Não resolve problema de revalidação
- ❌ Impacto limitado vs Opção 1

---

### **OPÇÃO 4: Cache com Etag/Versioning** ⭐⭐⭐ (MÉDIO-TERMO)
**Impacto:** Alto | **Esforço:** Médio | **Tempo:** 3-4 horas

#### Como Funciona:
Frontend envia `If-None-Match` com etag do cache. Backend retorna 304 (Not Modified) se não mudou.

#### Implementação:
```typescript
// 1. Backend adiciona versão/etag ao produto
@Get(':id')
async getProduct(@Param('id') id: string) {
  const product = await this.productService.findById(id);
  
  const version = crypto
    .createHash('md5')
    .update(JSON.stringify(product))
    .digest('hex');
  
  return {
    data: product,
    headers: {
      'ETag': `"${version}"`,
      'Cache-Control': 'public, max-age=3600', // 1 hour
    }
  };
}

// 2. Frontend envia etag em próxima requisição
const fetchProduct = async (id: string, cachedVersion?: string) => {
  const response = await fetch(`/api/products/${id}`, {
    headers: cachedVersion ? {
      'If-None-Match': cachedVersion,
    } : {},
  });
  
  if (response.status === 304) {
    // ✅ Usa dados do cache local
    return cachedData;
  }
  
  // ❌ Dados mudaram, retorna 200 com novos dados
  return response.json();
};
```

#### Vantagens:
- ✅ Frontend valida dados sem re-download (economia de banda)
- ✅ Compatível com HTTP caching padrão
- ✅ Funciona em qualquer navegador (sem WebSocket)
- ✅ Reduz payload se dados não mudaram

#### Desvantagens:
- ❌ Ainda precisa fazer requisição (não é em tempo real)
- ❌ Requer coordenação frontend (React Query custom)
- ❌ Necessário recalcular etag em cada requisição

---

### **OPÇÃO 5: Cache Warming + Preemptive Invalidation** ⭐⭐⭐ (PREVENTIVO)
**Impacto:** Médio | **Esforço:** Médio | **Tempo:** 2-3 horas

#### Como Funciona:
Ao fazer update/create, automaticamente recarrega dados relacionados em background (warm cache).

#### Implementação:
```typescript
@Injectable()
export class ProductCrudService {
  constructor(
    private productLookup: ProductLookupService,
    private cacheService: CacheService,
  ) {}
  
  async updateProduct(dto: UpdateProductDto, id: string) {
    // 1. Atualiza banco de dados
    const updated = await this.repo.update(id, internal);
    
    // 2. Invalida cache antigo
    await this.cacheService.invalidateProduct(id);
    
    // 3. ✅ Aquece cache novo (background)
    // Frontend já vai encontrar dados frescos na próxima requisição
    this.productLookup.findById(id).catch(err => {
      this.logger.warn(`Cache warming failed: ${err.message}`);
    });
    
    return mapper(updated);
  }
}
```

#### Vantagens:
- ✅ Próxima requisição já encontra cache quente
- ✅ Simples de implementar
- ✅ Sem overhead para operação original (background)
- ✅ Combinável com outras opções

#### Desvantagens:
- ❌ Race condition: frontend pode requisitar antes de warm
- ❌ Waste se ninguém acessar depois
- ❌ Overhead de I/O se muitos updates simultâneos

---

## Recomendação: Estratégia em Fases

### **Fase 1 (Curto Prazo - Esta Semana)**
Implementar **OPÇÃO 1** (Invalidação Explícita):
- Adicionar método `invalidateUser()`, `invalidateProduct()` em `CacheService`
- Chamar após cada operação de escrita em CRUD services
- **Impacto:** Usuários veem mudanças em 1-2 segundos (próxima requisição)
- **Esforço:** 2-3 horas
- **ROI:** Muito alto

```bash
Tempo: ~2-3 horas
Arquivos: 2-3 services (product, account, contact, etc)
Linhas: ~50-100 adicionadas
```

### **Fase 2 (Médio Prazo - 2-3 semanas)**
Adicionar **OPÇÃO 3** (TTL Adaptativo):
- Reduzir TTL para dados críticos (produto = 5 min, membership = 5 min)
- Manter TTL longo para dados estáticos (education = 2 hours)
- **Impacto:** Reduz espera para ~5 min nos piores casos
- **Esforço:** 30 minutos
- **Custo:** Negligível

### **Fase 3 (Longo Prazo - 1-2 meses)**
Implementar **OPÇÃO 2** (Event-Driven):
- Adicionar WebSocket gateway para notificações em tempo real
- Frontend invalida cache ao receber evento
- **Impacto:** Mudanças refletem em <1 segundo
- **Esforço:** 5-8 horas + testes
- **Custo:** Infraestrutura WebSocket

---

## Implementação da Fase 1 (Hoje)

### Mudança 1: Estender `CacheService`

```typescript
// cache.service.ts - Adicionar métodos

async invalidateUser(userId: string): Promise<void> {
  const patterns = [
    `${CachePrefix.ACCOUNT_PROFILE}:${userId}`,
    `${CachePrefix.ACCOUNT_ADDRESS}:${userId}`,
    `${CachePrefix.ACCOUNT_CONTACT}:${userId}`,
    `${CachePrefix.ACCOUNT_IDENTITY}:${userId}`,
    `${CachePrefix.EDUCATION_OT}:${userId}`,
    `${CachePrefix.EDUCATION_OTA}:${userId}`,
    `${CachePrefix.MEMBERSHIP_EXPIRATION}:${userId}`,
    `${CachePrefix.MEMBERSHIP_SETTINGS}:${userId}`,
  ];
  
  for (const pattern of patterns) {
    await this.redisService.deletePattern(`${pattern}:*`);
  }
  
  this.logger.log(`Invalidated cache for user ${userId}`);
}

async invalidateProduct(productId?: string): Promise<void> {
  if (productId) {
    await this.redisService.deletePattern(`products:*:${productId}:*`);
  } else {
    // Invalida TODO catálogo
    await this.redisService.deletePattern('products:*');
  }
  
  this.logger.log(`Invalidated cache for product ${productId || 'ALL'}`);
}

async invalidateMembership(userId: string): Promise<void> {
  await this.redisService.deletePattern(
    `${CachePrefix.MEMBERSHIP_SETTINGS}:${userId}:*`
  );
  await this.redisService.deletePattern(
    `${CachePrefix.MEMBERSHIP_EXPIRATION}:${userId}:*`
  );
  
  this.logger.log(`Invalidated membership cache for user ${userId}`);
}
```

### Mudança 2: Usar em CRUD Services

```typescript
// product-crud.service.ts

async create(dto: CreateProductDto, organizationGuid?: string) {
  const created = await this.productRepository.create(internal);
  
  // ✅ Invalida todo catálogo de produtos
  await this.cacheService.invalidateProduct();
  
  return mapper(created);
}

async update(id: string, dto: UpdateProductDto) {
  const updated = await this.productRepository.update(id, internal);
  
  // ✅ Invalida cache de produto específico e catálogo
  await this.cacheService.invalidateProduct(id);
  
  return mapper(updated);
}
```

---

## Impacto Esperado

| Métrica | Antes | Depois (Fase 1) | Depois (Fase 2) |
|---------|-------|-----------------|-----------------|
| Latência visível | 5-60 min | **1-2 seg** | <1 seg |
| Requisições ao Dataverse | Menos (mas espera) | Mesmas | Reduzidas 30% |
| Limite 100 req/user | Respeitado | Respeitado | Respeitado |
| Satisfação do usuário | Baixa | **Alta** | Muito Alta |
| Esforço de implementação | — | 2-3h | +30min |

---

## Próximas Ações

1. ✅ Analisar atuais operações de escrita (que não invalidam cache)
2. ✅ Identificar todos CRUD services que precisam de invalidação
3. ✅ Implementar métodos de invalidação em CacheService
4. ✅ Adicionar chamadas em account, product, contact, identity, education services
5. ✅ Testar com cenários reais (update → refresh → verificar dados)
6. ✅ Documentar padrão para futuros services

Quer que eu implemente a **Fase 1** agora? Estimativa: **2-3 horas** para todos os CRUD services.
