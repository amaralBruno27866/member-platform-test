# Cross-Machine Network Configuration Guide

## 🎯 Problema Identificado

A solução de **auto-detecção via `window.location.hostname`** que recomendamos inicialmente **NÃO funciona quando frontend e backend estão em máquinas diferentes**.

### Cenário Real:
```
Máquina A (Frontend Dev):  192.168.10.50 → React (porta 5173)
Máquina B (Backend Dev):   192.168.10.66 → NestJS (porta 3000)
```

### Por que auto-detecção falha:
```typescript
// Frontend rodando em 192.168.10.50
const API_BASE_URL = `http://${window.location.hostname}:3000`;
// Resultado: http://192.168.10.50:3000 ❌
// Backend está em: http://192.168.10.66:3000 ✅
```

---

## ✅ Soluções para Máquinas Diferentes

### **Solução 1: Variável de Ambiente Manual** (MAIS SIMPLES)

#### Configuração Frontend:
```bash
# Frontend: .env.local
VITE_API_BASE_URL=http://192.168.10.66:3000
```

#### Vantagens:
- ✅ Simples e direto
- ✅ Funciona imediatamente
- ✅ Sem código adicional necessário
- ✅ Controle total sobre URL

#### Desvantagens:
- ❌ Precisa atualizar quando IP do backend mudar
- ❌ Cada desenvolvedor frontend precisa configurar

#### Quando usar:
- Equipe pequena (2-5 pessoas)
- Backend com IP relativamente estável
- Desenvolvimento local simples

---

### **Solução 2: Endpoint de Descoberta** (RECOMENDADA PARA EQUIPES)

Backend expõe endpoint público com configuração.

#### Backend (IMPLEMENTADO AGORA):
```typescript
// GET http://192.168.10.66:3000/config
{
  "apiUrl": "http://192.168.10.66:3000",
  "version": "1.0.0",
  "environment": "development"
}
```

#### Frontend Implementation:
```typescript
// src/config/api.config.ts
const BACKEND_DISCOVERY_IP = process.env.VITE_BACKEND_IP || '192.168.10.66';

async function discoverBackendUrl(): Promise<string> {
  try {
    const configUrl = `http://${BACKEND_DISCOVERY_IP}:3000/config`;
    const response = await fetch(configUrl);
    const config = await response.json();
    
    // Cache in localStorage para evitar chamadas repetidas
    localStorage.setItem('api_url', config.apiUrl);
    
    return config.apiUrl;
  } catch (error) {
    console.error('Failed to discover backend, using fallback:', error);
    // Fallback para IP padrão
    return `http://${BACKEND_DISCOVERY_IP}:3000`;
  }
}

// Exportar URL descoberta
export const API_BASE_URL = await discoverBackendUrl();
```

#### Frontend: .env.local (apenas precisa do IP inicial)
```bash
# Apenas IP do backend (sem porta ou http://)
VITE_BACKEND_IP=192.168.10.66
```

#### Vantagens:
- ✅ Frontend descobre URL automaticamente
- ✅ Backend pode trocar porta sem quebrar frontend
- ✅ Cache em localStorage reduz chamadas
- ✅ Funciona em produção e desenvolvimento
- ✅ Cada dev frontend só precisa configurar IP uma vez

#### Desvantagens:
- 🟡 Requer chamada assíncrona na inicialização
- 🟡 Precisa configurar IP inicial (`VITE_BACKEND_IP`)

#### Quando usar:
- Equipe média/grande (5+ pessoas)
- Backend pode mudar porta ou configuração
- Ambiente com múltiplos backends (dev, staging, prod)

---

### **Solução 3: mDNS/Bonjour** (AVANÇADA)

Usar hostnames em vez de IPs.

#### Configuração Backend (Windows - PowerShell Admin):
```powershell
# Configurar hostname local
netsh interface ip set address name="Wi-Fi" source=dhcp
# Adicionar hostname
New-NetFirewallRule -DisplayName "mDNS" -Direction Inbound -Protocol UDP -LocalPort 5353 -Action Allow
```

#### Frontend:
```bash
# .env.local
VITE_API_BASE_URL=http://backend-dev.local:3000
```

#### Vantagens:
- ✅ Funciona mesmo quando IP muda
- ✅ Nomes legíveis (backend-dev.local)
- ✅ Zero configuração após setup inicial

#### Desvantagens:
- ❌ Requer configuração de rede complexa
- ❌ Depende de suporte mDNS no Windows
- ❌ Pode não funcionar em redes corporativas

#### Quando usar:
- Equipe permanente trabalhando sempre juntos
- Infraestrutura de rede controlada
- Tempo para configuração inicial

---

### **Solução 4: Proxy Reverso (NGINX)** (PRODUÇÃO)

Ambos frontend e backend atrás do mesmo servidor.

#### NGINX Config:
```nginx
server {
  listen 80;
  server_name osot-dev.local;

  # Frontend
  location / {
    proxy_pass http://192.168.10.50:5173;
  }

  # Backend API
  location /api/ {
    proxy_pass http://192.168.10.66:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

#### Frontend:
```typescript
// Tudo vai para /api
const API_BASE_URL = '/api';
```

#### Vantagens:
- ✅ Frontend e backend parecem estar no mesmo host
- ✅ Zero configuração de CORS
- ✅ Pronto para produção
- ✅ Facilita load balancing

#### Desvantagens:
- ❌ Requer NGINX instalado e configurado
- ❌ Complexidade adicional para desenvolvimento
- ❌ Precisa reiniciar NGINX ao trocar IPs

#### Quando usar:
- Ambiente de staging/produção
- Equipe grande com DevOps dedicado
- Requisitos de segurança/caching

---

## 📋 Matriz de Decisão

| Solução | Simplicidade | Flexibilidade | Produção | Equipe | Setup |
|---------|--------------|---------------|----------|--------|-------|
| **Variável Manual** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ❌ | 2-3 | 1 min |
| **Descoberta API** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 5+ | 10 min |
| **mDNS** | ⭐⭐ | ⭐⭐⭐⭐ | ❌ | 3-5 | 30 min |
| **Proxy (NGINX)** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 10+ | 60 min |

---

## 🚀 Recomendação Final

### **Para sua equipe (Backend + Frontend em máquinas diferentes):**

**Use Solução 2: Endpoint de Descoberta**

#### Backend (PRONTO - implementado agora):
- ✅ Endpoint `/config` já disponível
- ✅ Retorna API_URL do .env
- ✅ Funciona com `setup-backend-network.ps1`

#### Frontend (próximos passos):

**1. Criar arquivo de configuração:**
```typescript
// src/config/api.config.ts
const BACKEND_IP = import.meta.env.VITE_BACKEND_IP || 'localhost';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3000';

async function fetchBackendConfig(): Promise<string> {
  const cachedUrl = localStorage.getItem('osot_api_url');
  if (cachedUrl) return cachedUrl;

  try {
    const configUrl = `http://${BACKEND_IP}:${BACKEND_PORT}/config`;
    const response = await fetch(configUrl, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Config fetch failed');
    
    const config = await response.json();
    localStorage.setItem('osot_api_url', config.apiUrl);
    
    return config.apiUrl;
  } catch (error) {
    console.warn('Backend discovery failed, using fallback:', error);
    const fallbackUrl = `http://${BACKEND_IP}:${BACKEND_PORT}`;
    localStorage.setItem('osot_api_url', fallbackUrl);
    return fallbackUrl;
  }
}

// Cache da URL descoberta
let apiBaseUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (!apiBaseUrl) {
    apiBaseUrl = await fetchBackendConfig();
  }
  return apiBaseUrl;
}

// Para uso síncrono após inicialização
export const API_BASE_URL = localStorage.getItem('osot_api_url') || 
  `http://${BACKEND_IP}:${BACKEND_PORT}`;
```

**2. Configurar .env.local (frontend):**
```bash
# Apenas IP do backend (atualizar quando mudar)
VITE_BACKEND_IP=192.168.10.66
VITE_BACKEND_PORT=3000
```

**3. Inicializar no App.tsx:**
```typescript
// src/App.tsx
import { useEffect, useState } from 'react';
import { getApiBaseUrl } from './config/api.config';

function App() {
  const [isConfigReady, setIsConfigReady] = useState(false);

  useEffect(() => {
    getApiBaseUrl().then(() => {
      setIsConfigReady(true);
    });
  }, []);

  if (!isConfigReady) {
    return <div>Loading configuration...</div>;
  }

  return (
    // Resto da aplicação
  );
}
```

**4. Usar em services:**
```typescript
// src/services/api.service.ts
import { API_BASE_URL } from '../config/api.config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## 🧪 Testando a Solução

### Backend (você):
```powershell
# 1. Garanta que backend está rodando
npm run start:dev

# 2. Teste endpoint de configuração
Invoke-RestMethod http://localhost:3000/config

# Deve retornar:
# apiUrl      : http://192.168.10.66:3000
# version     : 1.0.0
# environment : development

# 3. Verifique na rede local
Invoke-RestMethod http://192.168.10.66:3000/config
```

### Frontend (equipe frontend):
```bash
# 1. Configurar .env.local
echo "VITE_BACKEND_IP=192.168.10.66" > .env.local

# 2. Implementar api.config.ts (código acima)

# 3. Testar descoberta
# Abrir console do navegador em http://192.168.10.50:5173
fetch('http://192.168.10.66:3000/config')
  .then(r => r.json())
  .then(console.log);

# Deve mostrar: { apiUrl: "http://192.168.10.66:3000", ... }

# 4. Verificar localStorage
localStorage.getItem('osot_api_url');
// Deve ser: "http://192.168.10.66:3000"
```

---

## 📝 Documentação para Frontend Team

### Email Template:

```
Subject: [IMPORTANTE] Configuração de Rede Backend - Nova Solução

Olá equipe frontend,

Identificamos que a solução de auto-detecção proposta inicialmente NÃO funciona 
quando frontend e backend estão em máquinas diferentes na rede local.

PROBLEMA:
- Frontend em máquina A (192.168.10.50)
- Backend em máquina B (192.168.10.66)
- Auto-detecção via window.location.hostname resulta em URL errada

SOLUÇÃO IMPLEMENTADA:
Backend agora expõe endpoint /config que retorna a URL correta:

GET http://192.168.10.66:3000/config
Response: { "apiUrl": "http://192.168.10.66:3000", ... }

AÇÃO NECESSÁRIA:
1. Implementar descoberta de backend (ver código em CROSS_MACHINE_NETWORK_GUIDE.md)
2. Configurar .env.local com IP do backend: VITE_BACKEND_IP=192.168.10.66
3. Testar com backend rodando em 192.168.10.66

ESTIMATIVA: 15-20 minutos
PRIORIDADE: ALTA (bloqueia consumo de API em rede local)

Documentação completa: docs/CROSS_MACHINE_NETWORK_GUIDE.md

Qualquer dúvida, me avise!
Abraço,
Bruno
```

---

## 🔧 Troubleshooting

### Problema: Frontend não consegue acessar /config
**Solução:** Verificar CORS e firewall no backend
```powershell
# Verificar se backend permite CORS
# Em main.ts deve ter:
app.enableCors({
  origin: true, // Ou lista de IPs permitidos
  credentials: true,
});

# Verificar firewall Windows
.\setup-backend-firewall.ps1
```

### Problema: IP muda todo dia
**Solução:** Script automático + descoberta
```powershell
# Backend: Rodar todo dia ao ligar máquina
.\setup-backend-network.ps1

# Frontend: Limpar cache localStorage
localStorage.removeItem('osot_api_url');
# Recarregar página para re-descobrir
```

### Problema: Produção não deve usar IP
**Solução:** Variável de ambiente para produção
```bash
# Frontend .env.production
VITE_BACKEND_IP=api.osot.ca
VITE_BACKEND_PORT=443

# Código detecta automaticamente:
const isProd = import.meta.env.PROD;
const protocol = isProd ? 'https' : 'http';
const configUrl = `${protocol}://${BACKEND_IP}:${BACKEND_PORT}/config`;
```

---

## 📚 Referências

- Backend endpoint: `src/config/config.controller.ts`
- Network setup script: `setup-backend-network.ps1`
- Original auto-detection doc: `docs/ADMIN_APPROVAL_FRONTEND_IMPLEMENTATION.md` (Seção 3.2 - OBSOLETA para máquinas diferentes)

---

## ✅ Checklist de Implementação

### Backend (COMPLETO):
- [x] Criar ConfigController com endpoint /config
- [x] Registrar ConfigController em AppModule
- [x] Testar endpoint localmente
- [x] Testar endpoint na rede local
- [x] Verificar CORS permite acesso

### Frontend (PENDENTE):
- [ ] Criar src/config/api.config.ts
- [ ] Implementar descoberta assíncrona
- [ ] Adicionar cache em localStorage
- [ ] Configurar .env.local com VITE_BACKEND_IP
- [ ] Atualizar serviços API para usar nova configuração
- [ ] Testar descoberta na rede local
- [ ] Adicionar loading state durante descoberta
- [ ] Implementar fallback se descoberta falhar

### Testes (PENDENTE):
- [ ] Testar frontend e backend na mesma máquina
- [ ] Testar frontend e backend em máquinas diferentes
- [ ] Testar com IP do backend mudando
- [ ] Testar cache localStorage funcionando
- [ ] Testar fallback quando backend offline
- [ ] Testar em produção com domínio real

---

**Próximos Passos:**
1. Enviar este guia para equipe frontend
2. Frontend implementa descoberta (15-20 min)
3. Testar na rede local com máquinas diferentes
4. Validar fluxo completo de admin approval
