# 🚀 Mobile Testing - Complete Setup Script
# Execute este script para configurar frontend e backend para acesso mobile

Write-Host "`n🚀 OSOT Mobile Testing - Complete Setup" -ForegroundColor Cyan
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

# Passo 1: Atualizar Frontend .env.local
Write-Host "📝 [1/5] Atualizando configuração do Frontend..." -ForegroundColor Cyan

$envLocalPath = ".\.env.local"
$envContent = @"
# Environment Variables - Local Development
# This file is gitignored and specific to your machine

# API Configuration - Mobile Testing
# Updated automatically on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
VITE_API_URL=http://${wifiIP}:3000

# App Configuration
VITE_APP_NAME=OSOT Platform
VITE_APP_VERSION=1.0.0

# Development Notes:
# - For localhost only: VITE_API_URL=http://localhost:3000
# - For mobile access: VITE_API_URL=http://${wifiIP}:3000
# - Run setup-mobile.ps1 to update IP automatically
"@

Set-Content -Path $envLocalPath -Value $envContent
Write-Host "   ✅ Frontend .env.local atualizado" -ForegroundColor Green

# Passo 2: Verificar Backend .env
Write-Host "`n📝 [2/5] Verificando configuração do Backend..." -ForegroundColor Cyan

$backendEnvPath = ".\osot_api\.env"
if (Test-Path $backendEnvPath) {
    $backendEnv = Get-Content $backendEnvPath -Raw
    
    if ($backendEnv -match "WP_FRONTEND_URL=.*$wifiIP") {
        Write-Host "   ✅ Backend já configurado corretamente" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend .env pode precisar de atualização manual" -ForegroundColor Yellow
        Write-Host "   Adicione ao osot_api\.env:" -ForegroundColor Gray
        Write-Host "   WP_FRONTEND_URL=http://localhost:5173,http://${wifiIP}:5173" -ForegroundColor White
        Write-Host "   API_URL=http://${wifiIP}:3000" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠️  Arquivo osot_api\.env não encontrado" -ForegroundColor Yellow
    Write-Host "   Crie o arquivo com as variáveis necessárias (veja MOBILE_TESTING_BACKEND_SETUP.md)" -ForegroundColor Gray
}

# Passo 3: Verificar Firewall para Frontend (porta 5173)
Write-Host "`n🔥 [3/5] Verificando Firewall para Frontend (porta 5173)..." -ForegroundColor Cyan

$frontendRule = Get-NetFirewallRule -DisplayName "Vite Dev Server" -ErrorAction SilentlyContinue

if ($frontendRule) {
    Write-Host "   ✅ Regra de firewall para porta 5173 já existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Criando regra de firewall (requer privilégios)..." -ForegroundColor Yellow
    
    try {
        New-NetFirewallRule `
            -DisplayName "Vite Dev Server" `
            -Direction Inbound `
            -LocalPort 5173 `
            -Protocol TCP `
            -Action Allow `
            -ErrorAction Stop | Out-Null
        
        Write-Host "   ✅ Regra de firewall criada com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Não foi possível criar regra (Execute como Admin)" -ForegroundColor Red
        Write-Host "   Execute manualmente: .\setup-firewall.ps1" -ForegroundColor Yellow
    }
}

# Passo 4: Verificar Firewall para Backend (porta 3000)
Write-Host "`n🔥 [4/5] Verificando Firewall para Backend (porta 3000)..." -ForegroundColor Cyan

$backendRule = Get-NetFirewallRule -DisplayName "NestJS Dev Server*" -ErrorAction SilentlyContinue

if ($backendRule) {
    Write-Host "   ✅ Regra de firewall para porta 3000 já existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Criando regra de firewall (requer privilégios)..." -ForegroundColor Yellow
    
    try {
        New-NetFirewallRule `
            -DisplayName "NestJS Dev Server - Mobile Testing" `
            -Direction Inbound `
            -LocalPort 3000 `
            -Protocol TCP `
            -Action Allow `
            -ErrorAction Stop | Out-Null
        
        Write-Host "   ✅ Regra de firewall criada com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Não foi possível criar regra (Execute como Admin)" -ForegroundColor Red
        Write-Host "   Execute manualmente como Admin:" -ForegroundColor Yellow
        Write-Host "   New-NetFirewallRule -DisplayName 'NestJS Dev Server' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow" -ForegroundColor Gray
    }
}

# Passo 5: Resumo e Próximos Passos
Write-Host "`n📋 [5/5] Resumo da Configuração" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`n✅ Configuração Completa!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 URLs para Acesso Mobile:" -ForegroundColor Yellow
Write-Host "   Frontend: http://${wifiIP}:5173" -ForegroundColor White
Write-Host "   Backend:  http://${wifiIP}:3000" -ForegroundColor White
Write-Host "   API Docs: http://${wifiIP}:3000/api-docs" -ForegroundColor White
Write-Host ""

# Copia URL do frontend para clipboard
try {
    Set-Clipboard -Value "http://${wifiIP}:5173"
    Write-Host "   ✓ URL do Frontend copiada para clipboard!" -ForegroundColor Green
} catch {
    # Clipboard pode não estar disponível
}

Write-Host "`n🚀 Próximos Passos:" -ForegroundColor Cyan
Write-Host "   1. Inicie o Backend:" -ForegroundColor White
Write-Host "      cd osot_api" -ForegroundColor Gray
Write-Host "      npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Inicie o Frontend (em outro terminal):" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. No celular, conecte ao Wi-Fi: " -ForegroundColor White
Write-Host "      (mesmo Wi-Fi do laptop)" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Acesse no navegador móvel:" -ForegroundColor White
Write-Host "      http://${wifiIP}:5173" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Dicas:" -ForegroundColor Cyan
Write-Host "   • Se o IP mudar, execute este script novamente" -ForegroundColor Gray
Write-Host "   • Mantenha frontend e backend rodando simultaneamente" -ForegroundColor Gray
Write-Host "   • Verifique se ambos estão na mesma rede Wi-Fi" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
