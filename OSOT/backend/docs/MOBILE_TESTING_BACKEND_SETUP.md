# ✅ Mobile Testing - Configuração Backend Completa

## 📋 O Que Foi Implementado

### 1. ✅ Variáveis de Ambiente (`.env`)

Adicionadas as seguintes configurações:

```env
# Mobile Testing Configuration
WP_FRONTEND_URL=http://localhost:5173,http://192.168.10.61:5173
API_URL=http://192.168.10.61:3000
```

**Importante**: O IP `192.168.10.61` é o seu IP atual na rede. Se ele mudar:
- Execute `ipconfig` para ver o novo IP
- Atualize essas variáveis no `.env`
- Reinicie o servidor

---

### 2. ✅ CORS Configurado (Dinâmico)

**Arquivo**: `src/main.ts`

O CORS agora aceita **múltiplos IPs** automaticamente via `WP_FRONTEND_URL`:

```typescript
origin: [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...process.env.WP_FRONTEND_URL.split(',').map(url => url.trim())
]
```

**Benefício**: Você pode adicionar múltiplos IPs separados por vírgula no `.env` sem modificar código.

---

### 3. ✅ Servidor Escutando em `0.0.0.0`

**Arquivo**: `src/main.ts`

```typescript
await app.listen(port, '0.0.0.0');
```

**O que isso faz**:
- ❌ Antes: `localhost` (apenas acesso local)
- ✅ Agora: `0.0.0.0` (aceita conexões de qualquer IP da rede)

---

### 4. ✅ Logs Informativos

Ao iniciar o servidor, você verá:

```
🚀 Application is running on: http://localhost:3000
📱 Mobile access: http://192.168.10.61:3000
📚 API Docs: http://localhost:3000/api-docs
```

---

### 5. ⚠️ Firewall do Windows

A regra de firewall pode precisar de **privilégios de administrador**.

**Se não funcionou automaticamente, execute manualmente**:

1. Abra PowerShell **como Administrador**
2. Execute:
   ```powershell
   New-NetFirewallRule -DisplayName "NestJS Dev Server - Mobile Testing" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

**Alternativa**: Windows Defender Firewall → Regras de Entrada → Nova Regra → Porta TCP 3000 → Permitir

---

## 🚀 Como Testar

### 1️⃣ Reinicie o Backend

```powershell
# O servidor já vai iniciar com 0.0.0.0 automaticamente
npm run start:dev
```

### 2️⃣ Verifique os Logs

Deve aparecer:
```
🚀 Application is running on: http://localhost:3000
📱 Mobile access: http://192.168.10.61:3000
```

### 3️⃣ Teste no Navegador do Telefone

**Acesse no navegador móvel**:
```
http://192.168.10.61:3000/api-docs
```

**✅ Se carregar o Swagger**: Backend acessível!  
**❌ Se não carregar**: Verifique firewall ou IP.

### 4️⃣ Teste a Aplicação

1. Certifique-se de que o **frontend está rodando** e configurado com `VITE_API_URL=http://192.168.10.61:3000`
2. Acesse o frontend no telefone: `http://192.168.10.61:5173`
3. Tente fazer login
4. Verifique se as requisições chegam no backend (logs do console)

---

## 🔍 Troubleshooting

### ❌ "Connection Refused" no telefone

**Causas possíveis**:
1. Firewall bloqueando porta 3000
2. Servidor não está rodando com `0.0.0.0`
3. IP mudou

**Solução**:
```powershell
# 1. Verifique se servidor está rodando
# 2. Confirme IP atual
ipconfig | Select-String "IPv4"

# 3. Teste conectividade
# No telefone, acesse: http://192.168.10.61:3000/api-docs
```

---

### ❌ CORS Error

**Erro no console do navegador móvel**:
```
Access to fetch at 'http://192.168.10.61:3000/auth/login' from origin 'http://192.168.10.61:5173' has been blocked by CORS policy
```

**Solução**:

1. Verifique o `.env`:
   ```env
   WP_FRONTEND_URL=http://localhost:5173,http://192.168.10.61:5173
   ```

2. Verifique os logs do backend ao iniciar:
   ```
   [CORS] Allowed origins: http://localhost:5173, http://192.168.10.61:5173
   ```

3. Reinicie o backend

---

### ❌ IP Mudou

**Sintoma**: Funcionava ontem, hoje não funciona mais.

**Causa**: Roteador pode ter atribuído novo IP ao laptop.

**Solução**:

1. Descubra novo IP:
   ```powershell
   ipconfig
   # Procure por "Wireless LAN adapter Wi-Fi" ou "Ethernet adapter"
   # Anote o IPv4 (ex: 192.168.10.XX)
   ```

2. Atualize `.env`:
   ```env
   WP_FRONTEND_URL=http://localhost:5173,http://192.168.10.XX:5173
   API_URL=http://192.168.10.XX:3000
   ```

3. Reinicie backend

4. Atualize `.env.local` do frontend também

---

### ❌ Firewall Bloqueando

**Teste rápido**:
```powershell
# Desabilite temporariamente o firewall (apenas para teste)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Se funcionar, o problema é o firewall
# Reative o firewall:
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# E adicione a regra correta (como admin):
New-NetFirewallRule -DisplayName "NestJS Dev Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

## 📱 Checklist Completo

### Backend (✅ Completo)
- [x] `.env` com `WP_FRONTEND_URL` e `API_URL`
- [x] `main.ts` configurado para `0.0.0.0`
- [x] CORS dinâmico via `.env`
- [x] Logs informativos no console
- [x] Tentativa de criar regra de firewall

### Frontend (📋 Pendente - Time do Front)
- [ ] `.env.local` com `VITE_API_URL=http://192.168.10.61:3000`
- [ ] Reiniciar servidor Vite
- [ ] Testar no telefone

### Rede (📋 Verificar)
- [ ] Laptop e telefone na mesma rede Wi-Fi
- [ ] Firewall do Windows permite porta 3000
- [ ] IP do laptop não mudou

---

## 🎯 Próximos Passos

1. **Reinicie o backend** (se ainda não fez)
2. **Teste o Swagger no telefone**: `http://192.168.10.61:3000/api-docs`
3. **Configure o frontend** (seguindo o guia deles)
4. **Teste a aplicação** completa no mobile

---

## 📝 Notas Adicionais

### IP Estático (Opcional)

Para evitar que o IP mude toda hora:

**Windows 11/10**:
1. Configurações → Rede e Internet → Wi-Fi
2. Propriedades da rede conectada
3. Configurações de IP → Editar
4. Manual → IPv4
5. Definir IP fixo: `192.168.10.61`
6. Gateway: `192.168.10.1` (geralmente)
7. DNS: `8.8.8.8` (Google) ou `192.168.10.1`

**Benefício**: Não precisa atualizar `.env` constantemente.

---

## 🐛 Se Ainda Não Funcionar

1. **Capture logs do backend**:
   ```
   npm run start:dev > backend.log 2>&1
   ```

2. **Verifique no telefone** (Chrome DevTools via USB):
   - Conecte telefone no laptop via USB
   - Abra `chrome://inspect` no Chrome do laptop
   - Veja erros de console/rede do navegador móvel

3. **Teste com curl** (no PowerShell):
   ```powershell
   curl http://192.168.10.61:3000/api-docs
   ```
   Se retornar HTML, servidor está acessível.

---

**🚀 Status**: Backend 100% configurado e pronto para acesso mobile!

**📞 Suporte**: Se tiver problemas, verifique firewall e IP atual.
