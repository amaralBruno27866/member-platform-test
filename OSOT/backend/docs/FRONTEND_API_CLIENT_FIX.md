# 🔧 Frontend API Client Error Fix

## ❌ Erro Atual

```
Error fetching all enums: ReferenceError: api is not defined
    at EnumService.getAllEnums (enumService.ts:267:24)
```

**Status:** Backend está funcionando perfeitamente ✅  
**Causa:** Frontend não configurou/importou corretamente o cliente API

---

## ✅ Solução

### Passo 1: Criar Configuração de API

Crie o arquivo `src/config/api.config.ts`:

```typescript
// src/config/api.config.ts
import axios from 'axios';

/**
 * Configuração do Cliente API
 * 
 * OPÇÃO 1: Descoberta Automática (RECOMENDADA)
 * Frontend descobre URL do backend automaticamente
 */

const BACKEND_IP = import.meta.env.VITE_BACKEND_IP || '192.168.2.132';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3000';

let cachedApiUrl: string | null = null;

/**
 * Descobre URL do backend automaticamente
 */
async function discoverBackendUrl(): Promise<string> {
  // Verificar cache
  const cached = localStorage.getItem('osot_api_url');
  if (cached) {
    cachedApiUrl = cached;
    return cached;
  }

  try {
    const configUrl = `http://${BACKEND_IP}:${BACKEND_PORT}/config`;
    const response = await fetch(configUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error('Config fetch failed');

    const config = await response.json();
    const apiUrl = config.apiUrl;

    // Cache para evitar chamadas repetidas
    localStorage.setItem('osot_api_url', apiUrl);
    cachedApiUrl = apiUrl;

    console.log('✅ Backend discovered:', apiUrl);
    return apiUrl;
  } catch (error) {
    console.warn('⚠️ Backend discovery failed, using fallback:', error);
    const fallbackUrl = `http://${BACKEND_IP}:${BACKEND_PORT}`;
    localStorage.setItem('osot_api_url', fallbackUrl);
    cachedApiUrl = fallbackUrl;
    return fallbackUrl;
  }
}

/**
 * Cria instância do Axios com URL descoberta
 */
async function createApiClient() {
  const baseURL = await discoverBackendUrl();
  
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 segundos
  });
}

// Criar cliente (inicialização assíncrona)
let apiClientInstance: any = null;

export async function getApiClient() {
  if (!apiClientInstance) {
    apiClientInstance = await createApiClient();
  }
  return apiClientInstance;
}

/**
 * Para uso síncrono (após inicialização)
 * Usar apenas em código que executa DEPOIS do App inicializar
 */
export const API_BASE_URL = cachedApiUrl || 
  localStorage.getItem('osot_api_url') || 
  `http://${BACKEND_IP}:${BACKEND_PORT}`;

// Exportar cliente pré-configurado (fallback síncrono)
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
```

---

### Passo 2: Configurar .env.local

Crie ou atualize o arquivo `.env.local` na raiz do projeto frontend:

```bash
# .env.local

# IP do backend (mudar quando IP mudar)
VITE_BACKEND_IP=192.168.2.132
VITE_BACKEND_PORT=3000

# Ou para desenvolvimento local na mesma máquina
# VITE_BACKEND_IP=localhost
# VITE_BACKEND_PORT=3000
```

---

### Passo 3: Corrigir enumService.ts

No arquivo `src/services/enumService.ts` (ou onde está definido):

**❌ ANTES (Errado):**
```typescript
// enumService.ts
class EnumService {
  getAllEnums() {
    // ❌ 'api' não está definido
    return api.get('/public/enums/all');
  }
}
```

**✅ DEPOIS (Correto):**
```typescript
// enumService.ts
import { apiClient } from '../config/api.config'; // ← ADICIONAR ESTA LINHA

class EnumService {
  async getAllEnums() {
    try {
      const response = await apiClient.get('/public/enums/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching enums:', error);
      throw error;
    }
  }

  async getAccountGroups() {
    const response = await apiClient.get('/public/enums/account-groups');
    return response.data;
  }

  // ... outros métodos
}

export const enumService = new EnumService();
```

---

### Passo 4: Inicializar no App.tsx

Atualizar `src/main.tsx` ou `src/App.tsx` para inicializar descoberta:

```typescript
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getApiClient } from './config/api.config';
import { EnumService } from './services/enumService';

// Inicializar descoberta de backend
async function initializeApp() {
  try {
    // 1. Descobrir backend
    await getApiClient();
    console.log('✅ Backend API configured');

    // 2. Preload enums (opcional)
    const enumService = new EnumService();
    await enumService.preloadEnums();
    console.log('✅ Enums preloaded');

  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    // Continuar mesmo com erro (usar fallback)
  }

  // 3. Renderizar app
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Iniciar aplicação
initializeApp();
```

---

## 🧪 Testar a Correção

### 1. Verificar Backend Está Rodando
```bash
# Testar endpoint de configuração
curl http://192.168.2.132:3000/config

# Deve retornar:
# {
#   "apiUrl": "http://192.168.2.132:3000",
#   "version": "1.0.0",
#   "environment": "development"
# }
```

### 2. Testar Endpoint de Enums
```bash
curl http://192.168.2.132:3000/public/enums/account-groups

# Deve retornar lista de account groups
```

### 3. Verificar Console do Navegador
Após implementar as correções, o console deve mostrar:

```
✅ Backend discovered: http://192.168.2.132:3000
✅ Backend API configured
✅ Enums preloaded
```

---

## 📋 Checklist de Implementação

- [ ] Criar `src/config/api.config.ts` com código acima
- [ ] Criar/atualizar `.env.local` com `VITE_BACKEND_IP`
- [ ] Atualizar `enumService.ts` para importar `apiClient`
- [ ] Atualizar `main.tsx` para inicializar descoberta
- [ ] Remover qualquer referência a variável `api` não definida
- [ ] Testar em desenvolvimento local
- [ ] Testar com backend em máquina diferente

---

## 🔀 Alternativa: Configuração Manual (Mais Simples)

Se não quiserem implementar descoberta automática agora:

```typescript
// src/config/api.config.ts (versão simples)
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.132:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

```bash
# .env.local (versão simples)
VITE_API_BASE_URL=http://192.168.2.132:3000
```

Depois é só importar `apiClient` em todos os services.

---

## 🐛 Troubleshooting

### Erro persiste após mudanças
```bash
# Limpar cache do Vite
rm -rf node_modules/.vite
npm run dev
```

### Backend não conecta
```bash
# Verificar IP correto
ipconfig  # Windows
ifconfig  # Mac/Linux

# Atualizar .env.local com IP correto
VITE_BACKEND_IP=<seu-ip-aqui>
```

### CORS Error
Backend já está configurado para aceitar CORS. Se aparecer erro:
- Verificar se backend está rodando
- Confirmar firewall do Windows permite porta 3000
- Rodar `setup-backend-network.ps1` no backend

---

## 📞 Suporte

Se o problema persistir após implementar essas correções, favor enviar:

1. **Console errors completos** (F12 → Console)
2. **Network tab** (F12 → Network → filtrar por "Failed")
3. **Arquivo `.env.local`** (sem informações sensíveis)
4. **Código do `enumService.ts`** (linhas ao redor da linha 267)

---

## ✅ Validação Final

Após implementar, testar:

1. ✅ Frontend carrega sem erros no console
2. ✅ Enums aparecem nos dropdowns
3. ✅ Formulários de registro funcionam
4. ✅ Login funciona
5. ✅ Backend API responde corretamente

---

**Prioridade:** 🔴 ALTA - Bloqueia uso da aplicação  
**Tempo Estimado:** 15-20 minutos  
**Documentação Completa:** `docs/CROSS_MACHINE_NETWORK_GUIDE.md`
