# Guia: Testando a Aplicação em Dispositivos Móveis

## Problema Identificado

Quando você acessa a aplicação pelo seu telefone usando o IP da rede local (ex: `http://192.168.2.73:5173`), o frontend carrega, mas o login falha.

**Causa:** O frontend está configurado para fazer chamadas de API para `http://localhost:3000`, que só funciona no laptop. O telefone não consegue acessar "localhost" do laptop.

## Solução

### 1. Configuração do Frontend (Já Aplicada ✅)

Criei o arquivo `.env.local` com a configuração para usar o IP da rede:

```env
VITE_API_URL=http://192.168.2.73:3000
```

### 2. Configuração do Backend (Necessária)

O backend NestJS precisa ser configurado para:
- Aceitar conexões externas (não só localhost)
- Permitir CORS do frontend acessado via IP da rede

#### Passos:

**a) Verifique se existe o arquivo `osot_api/.env`**

Se não existir, crie um arquivo `.env` dentro da pasta `osot_api/` com as seguintes configurações:

```env
# Backend Configuration
PORT=3000

# CORS - Frontend URLs permitidas (separadas por vírgula)
WP_FRONTEND_URL=http://localhost:5173,http://192.168.2.73:5173

# API URL
API_URL=http://192.168.2.73:3000

# Suas outras variáveis de ambiente (JWT, Dataverse, etc.)
# ... cole aqui as demais variáveis que você usa
```

**b) Se o arquivo já existir:**

Adicione/atualize as seguintes linhas:

```env
WP_FRONTEND_URL=http://localhost:5173,http://192.168.2.73:5173
API_URL=http://192.168.2.73:3000
```

### 3. Iniciar o Backend com Bind Correto

O NestJS por padrão escuta apenas em `localhost`. Para aceitar conexões externas, inicie com:

```powershell
cd osot_api
npm run start:dev -- --host 0.0.0.0
```

Ou atualize o `package.json` do backend para incluir o host:

```json
{
  "scripts": {
    "start:dev": "nest start --watch --host 0.0.0.0"
  }
}
```

### 4. Firewall do Windows

Certifique-se de que o firewall permite conexões na porta 3000:

```powershell
# Executar como Administrador
New-NetFirewallRule -DisplayName "NestJS Dev Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 5. Reiniciar Ambos os Servidores

**Terminal 1 - Backend:**
```powershell
cd osot_api
npm run start:dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

### 6. Testar no Telefone

1. Certifique-se de que o telefone está na mesma rede Wi-Fi que o laptop
2. Acesse: `http://192.168.2.73:5173`
3. Tente fazer login

## Verificação

### Teste se o backend está acessível:

**No navegador do telefone, acesse:**
```
http://192.168.2.73:3000/api-docs
```

Se carregar a documentação Swagger, o backend está acessível! ✅

### Verifique o IP correto:

O Vite mostra vários IPs. Use o IP da sua rede principal (geralmente o da forma `192.168.x.x`):

```
✅ Network: http://192.168.2.73:5173/     <- Use este
❌ Network: http://192.168.56.1:5173/     <- Rede virtual (VirtualBox/VMware)
❌ Network: http://172.27.240.1:5173/     <- WSL ou Docker
```

## Troubleshooting

### Login ainda falha?

1. **Abra o DevTools do navegador móvel** (Chrome: `chrome://inspect` no desktop)
2. Verifique os erros de console
3. Veja se as requisições estão indo para o IP correto

### CORS Error?

Verifique se o `WP_FRONTEND_URL` no `.env` do backend inclui o IP com a porta:
```env
WP_FRONTEND_URL=http://localhost:5173,http://192.168.2.73:5173
```

### Connection Refused?

- Verifique se o backend está rodando com `--host 0.0.0.0`
- Verifique o firewall do Windows
- Tente acessar `http://192.168.2.73:3000/api-docs` do telefone

## Nota Importante

⚠️ **IP Dinâmico:** O IP `192.168.2.73` pode mudar se você reiniciar o roteador ou laptop. Se isso acontecer:

1. Execute `ipconfig` no PowerShell para ver o novo IP
2. Atualize o `.env.local` do frontend
3. Atualize o `.env` do backend
4. Reinicie ambos os servidores

## Alternativa: Usar um IP Estático Local

Configure um IP estático no Windows para evitar mudanças:
1. Painel de Controle → Rede → Propriedades do Adaptador
2. IPv4 → Propriedades
3. Definir IP manualmente (ex: 192.168.2.100)
