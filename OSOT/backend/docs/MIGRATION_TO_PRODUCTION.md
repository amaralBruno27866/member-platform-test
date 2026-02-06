MIGRATION_TO_PRODUCTION.md

md
# 🚀 Guia Completo de Migração para Produção - OSOT Dataverse API

**Data de Criação:** 05 de Janeiro de 2026  
**Versão:** 1.0  
**Autor:** Documentação Técnica OSOT

---

## 📊 ANÁLISE DO PROJETO

### O que temos:
✅ **Backend NestJS** com autenticação JWT  
✅ **Integração com Microsoft Dataverse** via OAuth2  
✅ **Sistema de cache com Redis**  
✅ **Autenticação multi-aplicação** (Main, Public, Viewer, Owner, Admin)  
✅ **CORS configurado dinamicamente via `.env`**  
✅ **Sistema de privilégios** (Owner, Admin, Main)  
✅ **Documentação Swagger** em `/api-docs`  

### Configurações Críticas Identificadas:
🔑 **Variáveis de ambiente** no `.env` (credenciais Dataverse, JWT, Redis)  
🌐 **URLs dinâmicas** configuráveis  
🔐 **Múltiplas aplicações OAuth** (5 apps diferentes)  
📡 **CORS multi-origem** via `WP_FRONTEND_URL`  

---

## 🚀 PLANO DE MIGRAÇÃO SEGURA PARA PRODUÇÃO

### FASE 1: Preparação (Não Quebrará o DEV)

#### 1.1 Criar Ambiente de Produção no Dataverse

⚠️ **IMPORTANTE:** Crie um ambiente SEPARADO no Power Platform

No Power Platform Admin Center:
1. Acesse: https://admin.powerplatform.microsoft.com/
2. Ambientes → Novo ambiente
3. Configure:
   - Nome: "OSOT Production"
   - Tipo: Production
   - Região: Mesma do DEV para compatibilidade
   - Database: Sim, copiar estrutura do DEV

#### 1.2 Registrar App Registrations de Produção

No Azure AD, crie NOVOS registros para produção:

1. osot-main-app-prod
2. osot-public-app-prod
3. osot-viewer-app-prod
4. osot-owner-app-prod
5. osot-admin-app-prod

⚠️ **NÃO** reutilize as credenciais de DEV  
✅ Configure URLs de redirect para produção  
✅ Gere novos Client IDs e Secrets

**Passo a passo para cada App Registration:**
1. Azure Portal → Azure Active Directory → App registrations → New registration
2. Nome: osot-[tipo]-app-prod (ex: osot-main-app-prod)
3. Supported account types: "Accounts in this organizational directory only"
4. Redirect URI: Leave blank for now
5. Register

Após criar cada app:
6. Overview → Copie "Application (client) ID"
7. Certificates & secrets → New client secret
   - Description: "Production secret"
   - Expires: 24 months
   - Copie o VALUE (não o Secret ID)
8. API permissions → Add a permission
   - APIs my organization uses → Search "Dynamics CRM"
   - Delegated permissions → user_impersonation
   - Add permissions
9. Grant admin consent for [Tenant]

#### 1.3 Exportar Solução do Dataverse (DEV)

**Opção A: Power Platform CLI**

```powershell
# Instale o CLI se ainda não tiver
# https://aka.ms/PowerPlatformCLI

# Autentique
pac auth create --url https://[SEU_ORG_DEV].crm3.dynamics.com

# Liste as soluções
pac solution list

# Exporte a solução
pac solution export --path "./solution-export.zip" --name "OSOTSolution" --managed
```

**Opção B: Interface Web**

1. Acesse Power Apps: https://make.powerapps.com
2. Selecione o ambiente DEV (canto superior direito)
3. Solutions → Sua solução → Export
4. Tipo: Managed Solution (para produção)
5. Next → Export
6. Download do arquivo .zip

### FASE 2: Configuração do Ambiente de Produção

#### 2.1 Importar Solução para Produção

1. Power Apps (https://make.powerapps.com)
2. Selecione o ambiente PRODUCTION (canto superior direito)
3. Solutions → Import → Browse
4. Upload do arquivo .zip exportado
5. Next → Import
6. Aguardar validação e importação
7. Verificar se todas as personalizações foram importadas

#### 2.2 Criar Arquivo .env.production

Crie um NOVO arquivo chamado `.env.production` na raiz do projeto:

```env
# ============================================
# PRODUCTION ENVIRONMENT - OSOT API
# ============================================

# Node Environment
NODE_ENV=production
PORT=3000

# Production URLs
API_URL=https://api.osot.org.br
WP_FRONTEND_URL=https://portal.osot.org.br,https://app.osot.org.br
FRONTEND_URL=https://portal.osot.org.br
EMAIL_VERIFICATION_BASE_URL=https://portal.osot.org.br

# Microsoft Dataverse - PRODUCTION
DYNAMICS_URL=https://[SEU_ORG_PROD].crm3.dynamics.com/api/data/v9.2
MAIN_TENANT_ID=[NOVO_TENANT_ID_PROD]

# Main App (Production)
MAIN_CLIENT_ID=[NOVO_CLIENT_ID_PROD]
MAIN_CLIENT_SECRET=[NOVO_SECRET_PROD]

# Public App (Production)
PUBLIC_CLIENT_ID=[NOVO_CLIENT_ID_PROD]
PUBLIC_CLIENT_SECRET=[NOVO_SECRET_PROD]

# Viewer App (Production)
VIEWER_CLIENT_ID=[NOVO_CLIENT_ID_PROD]
VIEWER_CLIENT_SECRET=[NOVO_SECRET_PROD]

# Owner App (Production)
OWNER_CLIENT_ID=[NOVO_CLIENT_ID_PROD]
OWNER_CLIENT_SECRET=[NOVO_SECRET_PROD]

# Admin App (Production)
ADMIN_CLIENT_ID=[NOVO_CLIENT_ID_PROD]
ADMIN_CLIENT_SECRET=[NOVO_SECRET_PROD]

# JWT Configuration - PRODUCTION
JWT_SECRET=[NOVO_SECRET_FORTE_256_BITS]
JWT_EXPIRATION=3600

# Redis - Production
REDIS_HOST=seu-redis-prod.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=[SENHA_REDIS_PROD]
REDIS_TLS=true

# Email Configuration (se aplicável)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[SEU_EMAIL_PROD]
SMTP_PASS=[SENHA_EMAIL_PROD]

# Logging
LOG_LEVEL=error
```

**Gerar JWT Secret forte:**

```powershell
# PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Atualizar .gitignore:**

```gitignore
# Adicione estas linhas ao .gitignore
.env
.env.local
.env.production
.env.*.local
```

### FASE 3: Pipelines de Deployment (Recomendado)

#### 3.1 Estrutura de Branches

```
main (produção) ← Apenas código estável
  ↑
staging ← Testes pré-produção
  ↑
develop ← Desenvolvimento ativo ← VOCÊ CONTINUA AQUI
```

**Criar branches:**
**Criar branches:**

```bash
# Criar branch develop (se ainda não existir)
git checkout -b develop

# Criar branch staging
git checkout -b staging

# Voltar para main
git checkout main
```

#### 3.2 GitHub Actions Workflow

Crie o arquivo `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Lint
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: osot-api-prod
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
      
      # Ou deploy para Railway:
      # - name: Deploy to Railway
      #   run: |
      #     npm install -g @railway/cli
      #     railway deploy --service osot-api
      #   env:
      #     RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

#### 3.3 Configurar Secrets no GitHub

1. Vá para: GitHub repo → Settings → Secrets and variables → Actions
2. New repository secret
3. Adicione cada variável sensível:

**Secrets necessários:**

- DYNAMICS_URL_PROD
- MAIN_TENANT_ID_PROD
- MAIN_CLIENT_ID_PROD
- MAIN_CLIENT_SECRET_PROD
- PUBLIC_CLIENT_ID_PROD
- PUBLIC_CLIENT_SECRET_PROD
- VIEWER_CLIENT_ID_PROD
- VIEWER_CLIENT_SECRET_PROD
- OWNER_CLIENT_ID_PROD
- OWNER_CLIENT_SECRET_PROD
- ADMIN_CLIENT_ID_PROD
- ADMIN_CLIENT_SECRET_PROD
- JWT_SECRET_PROD
- REDIS_HOST_PROD
- REDIS_PASSWORD_PROD
- AZURE_WEBAPP_PUBLISH_PROFILE (ou RAILWAY_TOKEN)

### FASE 4: Escolha da Plataforma de Hospedagem

#### Opção A: Azure App Service (Recomendado para Dataverse)

**Vantagens:**

✅ Integração nativa com Microsoft Dataverse
✅ Suporte oficial Microsoft
✅ Escalabilidade automática
✅ Monitoramento integrado (Application Insights)
✅ Mesma região do Dataverse (latência baixa)

**Setup:**

```bash
# Instale Azure CLI
# https://docs.microsoft.com/cli/azure/install-azure-cli

# Login
az login

# Criar resource group
az group create --name osot-api-rg --location eastus

# Criar App Service Plan
az appservice plan create \
  --name osot-api-plan \
  --resource-group osot-api-rg \
  --sku B1 \
  --is-linux

# Criar Web App
az webapp create \
  --resource-group osot-api-rg \
  --plan osot-api-plan \
  --name osot-api-prod \
  --runtime "NODE|18-lts"

# Configurar variáveis de ambiente
az webapp config appsettings set \
  --resource-group osot-api-rg \
  --name osot-api-prod \
  --settings @.env.production

# Deploy
az webapp deployment source config-zip \
  --resource-group osot-api-rg \
  --name osot-api-prod \
  --src ./dist.zip
```

**Configurar Redis no Azure:**

```bash
# Criar Azure Redis Cache
az redis create \
  --location eastus \
  --name osot-redis-prod \
  --resource-group osot-api-rg \
  --sku Basic \
  --vm-size c0

# Obter connection string
az redis list-keys \
  --name osot-redis-prod \
  --resource-group osot-api-rg
```

#### Opção B: Railway (Mais Simples)

**Vantagens:**

✅ Deploy extremamente simples
✅ Redis incluído gratuitamente
✅ Variáveis de ambiente via UI
✅ Logs em tempo real
✅ Free tier disponível ($5/mês)

**Setup:**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Criar serviço
railway up

# Adicionar Redis
railway add redis

# Configurar variáveis de ambiente
railway variables set NODE_ENV=production
railway variables set DYNAMICS_URL=[URL]
# ... adicione todas as variáveis

# Deploy
railway deploy
```

**Ou via Railway Dashboard:**

1. Acesse https://railway.app
2. New Project → Deploy from GitHub repo
3. Selecione osot-bamaral/osot-dataverse-api-phantom
4. Add Redis database
5. Variables → Adicione todas do .env.production
6. Deploy

#### Opção C: AWS Elastic Beanstalk

**Vantagens:**

✅ Alta escalabilidade
✅ Load balancing automático
✅ Integração com outros serviços AWS

**Setup:**

```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar
eb init -p node.js-18 osot-api-prod

# Criar ambiente
eb create production-env

# Deploy
eb deploy
```

### FASE 5: Migração de Dados (Para Stakeholders)

#### 5.1 Opção A: Configuration Migration Tool (Recomendado)

**Download:**

https://aka.ms/configmigrationtool

**Uso:**

```powershell
# Exportar do DEV
pac tool cmt export \
  --source-url https://[ORG_DEV].crm3.dynamics.com \
  --file "data-export.zip"

# Importar para PROD
pac tool cmt import \
  --target-url https://[ORG_PROD].crm3.dynamics.com \
  --file "data-export.zip"
```

#### 5.2 Opção B: Data Import Wizard (Interface)

1. Power Apps → Data → Get Data → Import data
2. Upload arquivo Excel/CSV com dados
3. Map columns para fields do Dataverse
4. Review mapping
5. Run import
6. Monitor progress

**Template CSV:**

```csv
osot_email,osot_first_name,osot_last_name,osot_account_group
user@example.com,John,Doe,Therapist
```

#### 5.3 Opção C: Script de Migração Customizado

Crie `scripts/migrate-data.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataverseService } from '../src/integrations/dataverse.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const devService = app.get(DataverseService); // Configurado para DEV
  // const prodService = ... // Configurado para PROD
  
  console.log('Starting data migration...');
  
  // Migrar accounts
  const accounts = await devService.getAllRecords('osot_accounts');
  console.log(`Found ${accounts.length} accounts to migrate`);
  
  for (const account of accounts) {
    try {
      // await prodService.createRecord('osot_accounts', account);
      console.log(`✅ Migrated account: ${account.osot_email}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${account.osot_email}:`, error);
    }
  }
  
  console.log('Migration complete!');
  await app.close();
}

bootstrap();
```

**Executar:**

```bash
npm run build
node dist/scripts/migrate-data.js
```

## ✅ RESPOSTAS ÀS SUAS PERGUNTAS

### 1. Como mover a solução para produção?

**✅ RESPOSTA:**

1. Exportar solução do DEV como "Managed Solution"
2. Criar ambiente PROD separado no Power Platform
3. Importar solução no ambiente PROD
4. Configurar variáveis de produção (.env.production)
5. Deploy da API em servidor de produção (Azure/Railway/AWS)
6. Usar GitHub Actions para automatizar deploys futuros

⚠️ **NÃO** mova, **COPIE** a estrutura  
✅ Ambientes DEV e PROD ficam separados

### 2. Posso continuar desenvolvendo em DEV enquanto PROD está ativo?

**✅ SIM! Essa é a abordagem CORRETA:**

**DEV (seu ambiente atual):**
- ✅ Continue desenvolvendo normalmente
- ✅ Teste todas as mudanças
- ✅ Banco de dados DEV permanece intacto
- ✅ Nenhuma alteração afeta produção

**PROD (novo ambiente):**
- ✅ Stakeholders importam dados antigos
- ✅ Usuários finais acessam
- ✅ Recebe apenas atualizações testadas e aprovadas

**Workflow recomendado:**
```
develop (você desenvolve) 
  → staging (você testa) 
  → main (deploy automático para PROD)
```

📦 Use soluções gerenciadas (managed) para atualizar PROD  
🔄 Sempre teste em DEV antes de promover para PROD

### 3. Dados do DEV serão perdidos ao mover para PROD?

**✅ NÃO! Os dados NÃO são afetados porque:**

- ❌ Não há "movimento" - há CÓPIA da estrutura
- ✅ DEV continua funcionando com todos os dados intactos
- ✅ PROD começa com estrutura vazia (apenas schema)
- ✅ Stakeholders importam dados separadamente em PROD

**Exemplo prático:**
- DEV: 100 usuários de teste → PERMANECEM no DEV
- PROD: 0 usuários inicialmente → Stakeholders importam dados reais

🔐 Seus dados de teste no DEV ficam 100% seguros!

### 4. Configurações serão perdidas?

**Depende se estão DENTRO da Solução:**

**O QUE VAI (se empacotado na solução):**
- ✅ Estrutura de tabelas (entities)
- ✅ Campos personalizados
- ✅ Relacionamentos entre tabelas
- ✅ Business Rules
- ✅ Workflows/Power Automate flows
- ✅ Canvas Apps e Model-driven Apps
- ✅ Roles de segurança customizados
- ✅ Formulários e views
- ✅ Plugins e Custom APIs

**O QUE NÃO VAI automaticamente:**
- ❌ Dados (registros nas tabelas)
- ❌ Variáveis de ambiente (precisam ser reconfiguradas)
- ❌ Conexões do Power Automate (precisam ser reconectadas)
- ❌ Usuários e atribuições de segurança
- ❌ Integrações externas (precisam ser reconfiguradas)
- ❌ Credenciais OAuth (novos App Registrations necessários)
- ❌ Configurações de email (SMTP)

**🔧 SOLUÇÃO:**
1. Documente todas as configurações não incluídas na solução
2. Crie checklist de reconfigurações pós-importação
3. Use .env.production para configurações da API

## 📋 CHECKLIST COMPLETO DE MIGRAÇÃO

### Fase 1: Preparação (Tempo estimado: 2-3 horas)

**Power Platform:**

- [ ] Criar ambiente PROD no Power Platform Admin Center
- [ ] Verificar licenças suficientes para ambiente PROD
- [ ] Configurar segurança do ambiente PROD

**Azure AD:**

- [ ] Criar 5 novos App Registrations (main, public, viewer, owner, admin)
- [ ] Configurar API permissions para cada app
- [ ] Grant admin consent para permissões
- [ ] Copiar Client IDs e gerar Client Secrets
- [ ] Documentar todas as credenciais em local seguro

**Dataverse:**

- [ ] Fazer backup completo do ambiente DEV
- [ ] Documentar todas as personalizações não incluídas em soluções
- [ ] Listar todas as conexões do Power Automate
- [ ] Documentar integrações externas

**Código:**

- [ ] Criar branch develop se ainda não existir
- [ ] Criar branch staging para testes
- [ ] Atualizar .gitignore para excluir .env.production

### Fase 2: Exportação e Importação (Tempo estimado: 1-2 horas)

**Exportação do DEV:**

- [ ] Empacotar todas as personalizações em uma Solução
- [ ] Verificar dependências da solução
- [ ] Exportar como Managed Solution
- [ ] Validar o arquivo .zip exportado
- [ ] Fazer backup do arquivo .zip

**Importação para PROD:**

- [ ] Conectar ao ambiente PROD no Power Apps
- [ ] Importar solução gerenciada
- [ ] Aguardar validação (pode levar 10-30 min)
- [ ] Verificar se todas as personalizações foram importadas
- [ ] Anotar versão da solução importada

**Verificação:**

- [ ] Conferir todas as tabelas (entities)
- [ ] Verificar campos customizados
- [ ] Testar relacionamentos
- [ ] Validar formulários e views

### Fase 3: Configuração do Ambiente PROD (Tempo estimado: 2-3 horas)

**Arquivo .env.production:**

- [ ] Criar arquivo .env.production na raiz do projeto
- [ ] Adicionar todas as variáveis de ambiente de produção
- [ ] Gerar novo JWT_SECRET forte (256 bits)
- [ ] Configurar URLs de produção (API_URL, FRONTEND_URL)
- [ ] Adicionar credenciais dos 5 App Registrations
- [ ] Configurar conexão com Dataverse PROD (DYNAMICS_URL)
- [ ] NÃO commitar este arquivo no Git!

**Redis de Produção:**

- [ ] Provisionar Redis na plataforma escolhida
  - Azure: Criar Azure Redis Cache
  - Railway: Adicionar Redis database
  - AWS: Criar ElastiCache
- [ ] Copiar host, porta e senha do Redis
- [ ] Adicionar credenciais ao .env.production
- [ ] Testar conexão com Redis

**Plataforma de Hospedagem:**

- [ ] Escolher plataforma (Azure/Railway/AWS)
- [ ] Criar conta se ainda não tiver
- [ ] Provisionar recursos necessários
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar SSL/TLS (HTTPS)

### Fase 4: GitHub Actions e Deploy (Tempo estimado: 2-3 horas)

**GitHub Secrets:**

- [ ] Ir para Settings → Secrets and variables → Actions
- [ ] Adicionar todos os secrets de produção:
  - [ ] DYNAMICS_URL_PROD
  - [ ] MAIN_TENANT_ID_PROD
  - [ ] MAIN_CLIENT_ID_PROD
  - [ ] MAIN_CLIENT_SECRET_PROD
  - [ ] PUBLIC_CLIENT_ID_PROD
  - [ ] PUBLIC_CLIENT_SECRET_PROD
  - [ ] VIEWER_CLIENT_ID_PROD
  - [ ] VIEWER_CLIENT_SECRET_PROD
  - [ ] OWNER_CLIENT_ID_PROD
  - [ ] OWNER_CLIENT_SECRET_PROD
  - [ ] ADMIN_CLIENT_ID_PROD
  - [ ] ADMIN_CLIENT_SECRET_PROD
  - [ ] JWT_SECRET_PROD
  - [ ] REDIS_HOST_PROD
  - [ ] REDIS_PASSWORD_PROD
  - [ ] AZURE_WEBAPP_PUBLISH_PROFILE (ou RAILWAY_TOKEN)

**Workflow:**

- [ ] Criar .github/workflows/deploy-production.yml
- [ ] Configurar trigger no branch main
- [ ] Adicionar steps de test, build e deploy
- [ ] Testar workflow com commit de teste

**Primeiro Deploy:**

- [ ] Fazer merge de develop → staging
- [ ] Testar em staging
- [ ] Fazer merge de staging → main
- [ ] Aguardar deploy automático
- [ ] Verificar logs do GitHub Actions

### Fase 5: Validação do Deploy (Tempo estimado: 1-2 horas)

**API Endpoints:**

- [ ] Testar /health endpoint
- [ ] Testar /api-docs (Swagger)
- [ ] Testar autenticação (POST /auth/login)
- [ ] Testar endpoints públicos
- [ ] Testar endpoints privados com JWT

**Integração Dataverse:**

- [ ] Verificar conexão com Dataverse PROD
- [ ] Testar leitura de dados
- [ ] Testar escrita de dados (em registro de teste)
- [ ] Validar logs de erros

**Redis Cache:**

- [ ] Verificar conexão com Redis
- [ ] Testar cache hit/miss
- [ ] Monitorar uso de memória

**CORS:**

- [ ] Testar acesso do frontend de produção
- [ ] Verificar headers CORS nas respostas
- [ ] Testar de diferentes origens

### Fase 6: Migração de Dados (Stakeholders)

**Preparação:**

- [ ] Documentar formato de dados esperado
- [ ] Criar templates Excel/CSV para importação
- [ ] Preparar instruções para stakeholders
- [ ] Configurar permissões de importação

**Execução:**

- [ ] Stakeholders exportam dados do sistema antigo
- [ ] Validar formato dos dados
- [ ] Importar dados para PROD via:
  - [ ] Configuration Migration Tool, ou
  - [ ] Data Import Wizard, ou
  - [ ] Script customizado
- [ ] Validar integridade dos dados importados

**Validação:**

- [ ] Conferir quantidade de registros importados
- [ ] Validar relacionamentos entre entidades
- [ ] Testar algumas consultas via API
- [ ] Verificar dados via interface do Dataverse

### Fase 7: Testes Finais e Go-Live (Tempo estimado: 2-4 horas)

**Testes End-to-End:**

- [ ] Fluxo completo de registro de usuário
- [ ] Fluxo completo de autenticação
- [ ] CRUD de todas as entidades principais
- [ ] Testes de performance (load testing)
- [ ] Testes de segurança (autenticação/autorização)

**Monitoramento:**

- [ ] Configurar logs de aplicação
- [ ] Configurar alertas de erro
- [ ] Configurar monitoramento de performance
- [ ] Configurar alertas de downtime

**Documentação:**

- [ ] Atualizar README com URLs de produção
- [ ] Documentar processo de deploy
- [ ] Documentar processo de rollback
- [ ] Criar runbook para troubleshooting

**Backup:**

- [ ] Fazer backup inicial do ambiente PROD
- [ ] Configurar backups automáticos
- [ ] Testar processo de restore

**Go-Live:**

- [ ] Comunicar aos stakeholders
- [ ] Liberar acesso aos usuários finais
- [ ] Monitorar primeiras horas de uso
- [ ] Estar disponível para suporte

### Fase 8: Pós-Deploy (Contínuo)

**Monitoramento Contínuo:**

- [ ] Revisar logs diariamente (primeira semana)
- [ ] Monitorar métricas de performance
- [ ] Acompanhar uso de recursos (CPU, memória, Redis)
- [ ] Validar backups automáticos

**Desenvolvimento Contínuo:**

- [ ] Continuar desenvolvendo no branch develop
- [ ] Fazer PR para staging quando tiver features prontas
- [ ] Testar em staging antes de produção
- [ ] Merge para main para deploy automático

**Atualizações:**

- [ ] Documentar mudanças no CHANGELOG.md
- [ ] Criar releases no GitHub
- [ ] Comunicar mudanças aos stakeholders
- [ ] Manter .env.production atualizado

## 🛠️ COMANDOS ÚTEIS

### Git Workflow

```bash
# Desenvolvimento diário (branch develop)
git checkout develop
git pull origin develop
# ... faça suas mudanças ...
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop

# Promover para staging (testar)
git checkout staging
git merge develop
git push origin staging
# Aguardar testes...

# Promover para produção
git checkout main
git merge staging
git push origin main
# Deploy automático via GitHub Actions!

# Verificar status do deploy
gh run list --workflow=deploy-production.yml
gh run watch
```

### Testes Locais

```bash
# Testar com ambiente de produção localmente
NODE_ENV=production npm run start:dev

# Ou no Windows PowerShell
$env:NODE_ENV="production"; npm run start:dev

# Rodar testes
npm test

# Cobertura de testes
npm run test:cov

# Build de produção
npm run build

# Testar build
node dist/main.js
```

### Logs e Debugging

```bash
# Logs do Railway
railway logs --service osot-api

# Logs do Azure
az webapp log tail --name osot-api-prod --resource-group osot-api-rg

# Logs do AWS
eb logs

# Ver variáveis de ambiente (Railway)
railway variables

# Ver variáveis de ambiente (Azure)
az webapp config appsettings list --name osot-api-prod --resource-group osot-api-rg
```

### Database (Dataverse)

```powershell
# Conectar ao ambiente
pac auth create --url https://[ORG_PROD].crm3.dynamics.com

# Listar soluções
pac solution list

# Exportar solução
pac solution export --name "OSOTSolution" --path "./backup.zip" --managed

# Importar solução
pac solution import --path "./backup.zip"

# Ver entidades
pac entity list
```

## 🚨 TROUBLESHOOTING

### Problema: Deploy falha no GitHub Actions

**Sintomas:**

```
Error: Authentication failed
Error: Cannot find module 'xyz'
```

**Soluções:**

```bash
# 1. Verificar secrets no GitHub
# Settings → Secrets → Verificar se todos estão preenchidos

# 2. Verificar logs detalhados
gh run view [RUN_ID] --log

# 3. Testar build localmente
npm run build
npm run test

# 4. Verificar dependências
npm ci  # Limpa e reinstala tudo
```

### Problema: API não conecta ao Dataverse

**Sintomas:**

```
Error: 401 Unauthorized
Error: ENOTFOUND dynamics.com
```

**Soluções:**

```powershell
# 1. Verificar credenciais
# Execute o script de teste de tokens
.\get-tokens.ps1

# 2. Verificar URL do Dataverse
# .env.production → DYNAMICS_URL deve estar correto

# 3. Testar manualmente
$token = "SEU_TOKEN"
$url = "https://[ORG].crm3.dynamics.com/api/data/v9.2/WhoAmI"
Invoke-RestMethod -Uri $url -Headers @{Authorization="Bearer $token"}

# 4. Verificar permissões no Azure AD
# Azure Portal → App Registration → API permissions
```

### Problema: CORS bloqueando frontend

**Sintomas:**

```
Access to XMLHttpRequest blocked by CORS policy
```

**Soluções:**

```env
# 1. Verificar .env.production
WP_FRONTEND_URL=https://portal.osot.org.br,https://app.osot.org.br

# 2. Verificar main.ts
app.enableCors({
  origin: process.env.WP_FRONTEND_URL.split(','),
  credentials: true
});

# 3. Restart da aplicação
railway restart  # ou az webapp restart
```

### Problema: Redis não conecta

**Sintomas:**

```
Error: connect ETIMEDOUT
Error: Redis connection refused
```

**Soluções:**

```bash
# 1. Verificar credenciais
redis-cli -h [HOST] -p [PORT] -a [PASSWORD] ping

# 2. Verificar firewall
# Azure: Settings → Firewall → Add IP do App Service

# 3. Verificar TLS
# Redis do Azure requer TLS=true
REDIS_TLS=true

# 4. Testar conexão
node -e "const redis = require('redis'); const client = redis.createClient({host:'[HOST]',port:[PORT],password:'[PASS]',tls:{}}); client.on('connect',()=>console.log('OK')); client.on('error',(e)=>console.error(e));"
```

### Problema: Performance ruim em produção

**Sintomas:**

```
Timeout errors
Slow response times
High memory usage
```

**Soluções:**

1. Verificar logs de performance:
   - Azure: Application Insights
   - Railway: Metrics tab
   - AWS: CloudWatch

2. Otimizar queries do Dataverse:
   - Usar $select para campos específicos
   - Adicionar índices nas tabelas
   - Implementar paginação

3. Aumentar cache:
   - Aumentar TTL do Redis
   - Implementar cache de queries frequentes
   - Usar cache de autenticação

4. Escalar recursos:
   - Azure: Aumentar App Service Plan
   - Railway: Upgrade de tier
   - AWS: Auto-scaling

## 📚 RECURSOS ADICIONAIS

### Documentação Oficial

- NestJS: https://docs.nestjs.com
- Microsoft Dataverse: https://docs.microsoft.com/power-apps/developer/data-platform/
- Power Platform CLI: https://docs.microsoft.com/power-platform/developer/cli/introduction
- Azure App Service: https://docs.microsoft.com/azure/app-service/
- Railway: https://docs.railway.app
- GitHub Actions: https://docs.github.com/actions

### Ferramentas

- Power Platform CLI: https://aka.ms/PowerPlatformCLI
- Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli
- Railway CLI: `npm install -g @railway/cli`
- Postman Collection: Para testar APIs

### Comunidades

- NestJS Discord: https://discord.gg/G7Qnnhy
- Power Platform Community: https://powerusers.microsoft.com
- Stack Overflow: Tag `nestjs` ou `dynamics-365`

## 💡 DICAS PROFISSIONAIS

### 1. Sempre Use Managed Solutions para Produção

❌ **Unmanaged:** Permite edição direta em produção (perigoso!)  
✅ **Managed:** Bloqueado para edição, apenas via updates

**Como criar:**
1. Desenvolver em DEV (unmanaged)
2. Exportar como MANAGED para PROD
3. Atualizações: Nova versão managed

### 2. Versionamento de Soluções

**Use semantic versioning:**
- 1.0.0 → Initial release
- 1.1.0 → New features
- 1.0.1 → Bug fixes
- 2.0.0 → Breaking changes

**No Dataverse:**  
Solutions → Properties → Version: 1.0.0

### 3. Environment Variables Best Practices

```typescript
// ❌ NUNCA hardcode credenciais
const apiKey = "abc123";

// ✅ SEMPRE use variáveis de ambiente
const apiKey = process.env.API_KEY;

// ✅ Validar na inicialização
if (!process.env.DYNAMICS_URL) {
  throw new Error('DYNAMICS_URL is required');
}
```

### 4. Logs Estruturados

```typescript
// ❌ Console.log simples
console.log('User logged in');

// ✅ Logs estruturados
this.logger.log('User logged in', {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
  environment: process.env.NODE_ENV
});
```

### 5. Monitoramento de Saúde

```typescript
// Endpoint de health check
@Get('health')
async health() {
  return {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    dataverse: await this.testDataverseConnection(),
    redis: await this.testRedisConnection()
  };
}
```

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Semana 1: Preparação

- [ ] Dia 1-2: Criar ambiente PROD e App Registrations
- [ ] Dia 3: Exportar solução do DEV
- [ ] Dia 4-5: Criar .env.production e configurar GitHub

### Semana 2: Deploy

- [ ] Dia 1-2: Escolher e configurar plataforma de hospedagem
- [ ] Dia 3: Importar solução no PROD
- [ ] Dia 4-5: Primeiro deploy e testes

### Semana 3: Migração de Dados

- [ ] Dia 1-2: Stakeholders preparam dados
- [ ] Dia 3-4: Migração de dados
- [ ] Dia 5: Validação de dados

### Semana 4: Go-Live

- [ ] Dia 1-3: Testes finais end-to-end
- [ ] Dia 4: Go-live com usuários
- [ ] Dia 5: Monitoramento e ajustes

## 📞 SUPORTE

**Se precisar de ajuda:**

- **GitHub Issues:** Para problemas técnicos do projeto
- **Stack Overflow:** Para questões gerais de NestJS/Dataverse
- **Microsoft Support:** Para questões de Power Platform
- **Azure Support:** Para questões de infraestrutura Azure

**Antes de pedir ajuda, tenha em mãos:**

- [ ] Mensagem de erro completa
- [ ] Logs relevantes
- [ ] Passos para reproduzir o problema
- [ ] Versões de software (Node, NestJS, etc.)
- [ ] Ambiente (DEV, STAGING, PROD)

## ✅ CONCLUSÃO

Você agora tem um plano completo para:

✅ Migrar sua solução do DEV para PROD de forma segura  
✅ Continuar desenvolvendo no DEV sem afetar PROD  
✅ Automatizar deploys com GitHub Actions  
✅ Configurar ambientes separados e isolados  
✅ Migrar dados com stakeholders  
✅ Monitorar e manter o ambiente de produção

**Lembre-se:**

- 🔐 Nunca commite credenciais no Git
- 🧪 Sempre teste em DEV antes de PROD
- 📦 Use Managed Solutions para produção
- 🔄 Automatize com GitHub Actions
- 📊 Monitore logs e métricas constantemente
📦 Use Managed Solutions para produção
🔄 Automatize com GitHub Actions
📊 Monitore logs e métricas constantemente