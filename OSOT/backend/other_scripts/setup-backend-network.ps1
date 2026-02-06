# 🚀 Backend Network Setup - Complete Configuration
# Configura o NestJS API para acesso via rede local (mobile testing)

Write-Host "`n🚀 OSOT Backend API - Network Configuration" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Detecta IP da rede Wi-Fi
$wifiIP = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress

if (-not $wifiIP) {
    Write-Host "`n❌ ERRO: Não foi possível detectar o IP Wi-Fi!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar conectado ao Wi-Fi e tente novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📡 IP da Rede Detectado: $wifiIP" -ForegroundColor Green
Write-Host ""

# Passo 1: Verificar/Criar arquivo .env
Write-Host "📝 [1/4] Configurando variáveis de ambiente (.env)..." -ForegroundColor Cyan

$envPath = ".\.env"
$envExists = Test-Path $envPath

if ($envExists) {
    Write-Host "   ℹ️  Arquivo .env já existe, atualizando configurações de rede..." -ForegroundColor Yellow
    
    # Lê o conteúdo atual
    $envContent = Get-Content $envPath -Raw
    
    # Atualiza ou adiciona API_URL
    if ($envContent -match "API_URL=") {
        $envContent = $envContent -replace "API_URL=.*", "API_URL=http://${wifiIP}:3000"
        Write-Host "   ✅ API_URL atualizado" -ForegroundColor Green
    } else {
        $envContent += "`nAPI_URL=http://${wifiIP}:3000"
        Write-Host "   ✅ API_URL adicionado" -ForegroundColor Green
    }
    
    # Atualiza ou adiciona WP_FRONTEND_URL com múltiplas origens
    $frontendUrls = "http://localhost:5173,http://127.0.0.1:5173,http://${wifiIP}:5173"
    if ($envContent -match "WP_FRONTEND_URL=") {
        $envContent = $envContent -replace "WP_FRONTEND_URL=.*", "WP_FRONTEND_URL=$frontendUrls"
        Write-Host "   ✅ WP_FRONTEND_URL atualizado" -ForegroundColor Green
    } else {
        $envContent += "`nWP_FRONTEND_URL=$frontendUrls"
        Write-Host "   ✅ WP_FRONTEND_URL adicionado" -ForegroundColor Green
    }
    
    # Salva o arquivo atualizado
    Set-Content -Path $envPath -Value $envContent
    
} else {
    Write-Host "   ⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "   Criando arquivo .env básico..." -ForegroundColor Cyan
    
    $newEnvContent = @"
# Backend API Configuration - Auto-generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# API URL for network access
API_URL=http://${wifiIP}:3000

# Frontend URLs (CORS configuration)
WP_FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173,http://${wifiIP}:5173

# Development Environment
NODE_ENV=development
PORT=3000

# IMPORTANTE: Adicione suas credenciais do Dataverse e outras configurações necessárias
# Veja .env.example para referência completa
"@
    
    Set-Content -Path $envPath -Value $newEnvContent
    Write-Host "   ✅ Arquivo .env criado" -ForegroundColor Green
    Write-Host "   ⚠️  ATENÇÃO: Adicione suas credenciais do Dataverse ao .env" -ForegroundColor Yellow
}

# Passo 2: Verificar configuração de CORS no main.ts
Write-Host "`n📝 [2/4] Verificando configuração de CORS..." -ForegroundColor Cyan

$mainTsPath = ".\src\main.ts"
if (Test-Path $mainTsPath) {
    $mainTsContent = Get-Content $mainTsPath -Raw
    
    if ($mainTsContent -match "0\.0\.0\.0" -and $mainTsContent -match "WP_FRONTEND_URL") {
        Write-Host "   ✅ CORS configurado corretamente para acesso em rede" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  CORS pode precisar de ajustes" -ForegroundColor Yellow
        Write-Host "   O main.ts já deve estar configurado, mas verifique se:" -ForegroundColor Gray
        Write-Host "   - app.listen está usando '0.0.0.0' como host" -ForegroundColor Gray
        Write-Host "   - CORS origin inclui process.env.WP_FRONTEND_URL" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️  Arquivo src/main.ts não encontrado" -ForegroundColor Yellow
}

# Passo 3: Verificar/Configurar Firewall
Write-Host "`n🔥 [3/4] Configurando Firewall..." -ForegroundColor Cyan

$backendRule = Get-NetFirewallRule -DisplayName "NestJS Dev Server*" -ErrorAction SilentlyContinue

if ($backendRule) {
    Write-Host "   ✅ Regra de firewall já existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Criando regra de firewall (requer privilégios de Admin)..." -ForegroundColor Yellow
    
    try {
        New-NetFirewallRule `
            -DisplayName "NestJS Dev Server - OSOT API" `
            -Description "Permite acesso ao NestJS API server na porta 3000" `
            -Direction Inbound `
            -LocalPort 3000 `
            -Protocol TCP `
            -Action Allow `
            -Profile Any `
            -ErrorAction Stop | Out-Null
        
        Write-Host "   ✅ Regra de firewall criada com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Não foi possível criar regra automaticamente" -ForegroundColor Red
        Write-Host "   Execute como Admin: .\setup-backend-firewall.ps1" -ForegroundColor Yellow
    }
}

# Passo 4: Teste de conectividade
Write-Host "`n🔍 [4/4] Testando conectividade..." -ForegroundColor Cyan

# Verifica se a porta 3000 está em uso
$portInUse = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "   ✅ Servidor está rodando na porta 3000" -ForegroundColor Green
    
    # Tenta fazer uma requisição ao health endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   ✅ Health endpoint respondendo: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Health endpoint não respondeu (isso é normal se o servidor não está rodando)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  Servidor não está rodando na porta 3000" -ForegroundColor Yellow
    Write-Host "   Inicie com: npm run start:dev" -ForegroundColor Gray
}

# Resumo Final
Write-Host "`n📋 Resumo da Configuração" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`n✅ Backend API Configurado!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 URLs de Acesso:" -ForegroundColor Yellow
Write-Host "   Local:    http://localhost:3000" -ForegroundColor White
Write-Host "   Network:  http://${wifiIP}:3000" -ForegroundColor White
Write-Host "   Swagger:  http://${wifiIP}:3000/api-docs" -ForegroundColor White
Write-Host "   Health:   http://${wifiIP}:3000/health" -ForegroundColor White
Write-Host ""

# Copia URL da API para clipboard
try {
    Set-Clipboard -Value "http://${wifiIP}:3000"
    Write-Host "   ✓ URL da API copiada para clipboard!" -ForegroundColor Green
} catch {
    # Clipboard pode não estar disponível
}

# Passo 4: Sincronizar API URL com Frontend
Write-Host "`n🔄 [4/4] Sincronizando API URL com Frontend..." -ForegroundColor Cyan

$syncScriptPath = ".\sync-frontend-api-url.ps1"
if (Test-Path $syncScriptPath) {
    try {
        & $syncScriptPath
        Write-Host "   ✅ Frontend API URL sincronizado automaticamente" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Erro ao sincronizar frontend (não crítico)" -ForegroundColor Yellow
        Write-Host "   Você pode executar manualmente: .\sync-frontend-api-url.ps1" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  Script de sincronização não encontrado (opcional)" -ForegroundColor Gray
    Write-Host "   Para sincronizar manualmente, execute: .\sync-frontend-api-url.ps1" -ForegroundColor Gray
}

Write-Host "`n🚀 Próximos Passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Inicie o servidor backend:" -ForegroundColor White
Write-Host "      npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Inicie o servidor frontend (em outro terminal):" -ForegroundColor White
Write-Host "      cd ..\osot-frontend" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Teste localmente:" -ForegroundColor White
Write-Host "      http://localhost:3000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Teste na rede:" -ForegroundColor White
Write-Host "      http://${wifiIP}:3000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "   5. Acesse Swagger no celular:" -ForegroundColor White
Write-Host "      http://${wifiIP}:3000/api-docs" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Dicas de Troubleshooting:" -ForegroundColor Cyan
Write-Host "   • Se não conectar do celular:" -ForegroundColor Gray
Write-Host "     - Verifique se está na mesma rede Wi-Fi" -ForegroundColor Gray
Write-Host "     - Execute setup-backend-firewall.ps1 como Admin" -ForegroundColor Gray
Write-Host "     - Verifique se o .env tem WP_FRONTEND_URL configurado" -ForegroundColor Gray
Write-Host "   • Se CORS bloquear:" -ForegroundColor Gray
Write-Host "     - Adicione a URL do frontend no .env (WP_FRONTEND_URL)" -ForegroundColor Gray
Write-Host "     - Reinicie o servidor" -ForegroundColor Gray
Write-Host "   • Se o IP mudar:" -ForegroundColor Gray
Write-Host "     - Execute este script novamente (atualiza backend + frontend)" -ForegroundColor Gray
Write-Host "   • Frontend não sincronizou:" -ForegroundColor Gray
Write-Host "     - Execute manualmente: .\sync-frontend-api-url.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
