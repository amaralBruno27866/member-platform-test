# Script para configurar firewall para NestJS Backend API
# Execute como ADMINISTRADOR: Run as Administrator

Write-Host "`n🔥 Configurando Firewall para NestJS Backend API" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Verifica se está rodando como Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`n❌ ERRO: Este script precisa ser executado como ADMINISTRADOR!" -ForegroundColor Red
    Write-Host "`n📝 Como executar:" -ForegroundColor Yellow
    Write-Host "   1. Clique com botão direito no PowerShell" -ForegroundColor Gray
    Write-Host "   2. Selecione 'Run as Administrator'" -ForegroundColor Gray
    Write-Host "   3. Execute: .\setup-backend-firewall.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "`n✅ Executando como Administrador...`n" -ForegroundColor Green

# Remove regra antiga se existir
$existingRule = Get-NetFirewallRule -DisplayName "NestJS Dev Server*" -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "🗑️  Removendo regra antiga..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "NestJS Dev Server*"
}

# Cria nova regra de firewall
Write-Host "➕ Criando regra de firewall para porta 3000..." -ForegroundColor Cyan

try {
    New-NetFirewallRule `
        -DisplayName "NestJS Dev Server - OSOT API" `
        -Description "Permite acesso ao NestJS API server na porta 3000 (OSOT Dataverse API)" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Any `
        -Enabled True | Out-Null
    
    Write-Host "✅ Regra de firewall criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Agora você pode acessar a API de qualquer dispositivo na mesma rede:" -ForegroundColor Green
    
    # Mostra o IP Wi-Fi
    $wifiIP = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress
    if ($wifiIP) {
        Write-Host "   API:      http://${wifiIP}:3000" -ForegroundColor White
        Write-Host "   Swagger:  http://${wifiIP}:3000/api-docs" -ForegroundColor White
        Write-Host "   Health:   http://${wifiIP}:3000/health" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erro ao criar regra de firewall:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Próximos Passos:" -ForegroundColor Cyan
Write-Host "   1. Certifique-se que o backend está rodando: npm run start:dev" -ForegroundColor Gray
Write-Host "   2. Teste o acesso: http://${wifiIP}:3000/health" -ForegroundColor Gray
Write-Host "   3. Configure CORS no .env se necessário" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
