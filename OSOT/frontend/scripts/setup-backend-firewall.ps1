# Script para configurar firewall para Backend (NestJS)
# Execute como ADMINISTRADOR: Run as Administrator

Write-Host "`n🔥 Configurando Firewall para Backend (NestJS - Porta 3000)" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Verifica se está rodando como Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`n❌ ERRO: Este script precisa ser executado como ADMINISTRADOR!" -ForegroundColor Red
    Write-Host "`n📝 Como executar:" -ForegroundColor Yellow
    Write-Host "   1. Clique com botão direito no PowerShell" -ForegroundColor Gray
    Write-Host "   2. Selecione 'Run as Administrator'" -ForegroundColor Gray
    Write-Host "   3. Navegue até a pasta do projeto" -ForegroundColor Gray
    Write-Host "   4. Execute: .\setup-backend-firewall.ps1" -ForegroundColor Gray
    Write-Host ""
    
    # Tenta reabrir como admin automaticamente
    Write-Host "💡 Tentando abrir como Administrador..." -ForegroundColor Cyan
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-File", "$PSCommandPath"
    exit 1
}

Write-Host "`n✅ Executando como Administrador...`n" -ForegroundColor Green

# Remove regra antiga se existir
$existingRule = Get-NetFirewallRule -DisplayName "NestJS Dev Server*" -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "🗑️  Removendo regra antiga..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "NestJS Dev Server*"
}

# Cria nova regra de firewall para porta 3000
Write-Host "➕ Criando regra de firewall para porta 3000..." -ForegroundColor Cyan

try {
    New-NetFirewallRule `
        -DisplayName "NestJS Dev Server - Mobile Testing" `
        -Description "Permite acesso ao NestJS dev server na porta 3000 (OSOT Backend API)" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Any `
        -Enabled True | Out-Null
    
    Write-Host "✅ Regra de firewall criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Backend agora acessível de qualquer dispositivo na rede:" -ForegroundColor Green
    
    # Mostra o IP Wi-Fi
    $wifiIP = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress
    if ($wifiIP) {
        Write-Host "   Backend API:  http://${wifiIP}:3000" -ForegroundColor White
        Write-Host "   Swagger Docs: http://${wifiIP}:3000/api-docs" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erro ao criar regra de firewall:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "🔥 Regras de Firewall Ativas:" -ForegroundColor Cyan
Get-NetFirewallRule -DisplayName "*Dev Server*" | Select-Object DisplayName, Enabled, Direction, Action | Format-Table -AutoSize

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Configuração completa! Agora inicie o backend:" -ForegroundColor Green
Write-Host "   cd osot_api" -ForegroundColor Gray
Write-Host "   npm run start:dev" -ForegroundColor Gray
Write-Host ""
