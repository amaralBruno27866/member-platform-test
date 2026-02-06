# Script para configurar firewall para Vite Dev Server
# Execute como ADMINISTRADOR: Run as Administrator

Write-Host "`n🔥 Configurando Firewall para Vite Dev Server" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Verifica se está rodando como Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`n❌ ERRO: Este script precisa ser executado como ADMINISTRADOR!" -ForegroundColor Red
    Write-Host "`n📝 Como executar:" -ForegroundColor Yellow
    Write-Host "   1. Clique com botão direito no PowerShell" -ForegroundColor Gray
    Write-Host "   2. Selecione 'Run as Administrator'" -ForegroundColor Gray
    Write-Host "   3. Execute: .\setup-firewall.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "`n✅ Executando como Administrador...`n" -ForegroundColor Green

# Remove regra antiga se existir
$existingRule = Get-NetFirewallRule -DisplayName "Vite Dev Server" -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "🗑️  Removendo regra antiga..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Vite Dev Server"
}

# Cria nova regra de firewall
Write-Host "➕ Criando regra de firewall para porta 5173..." -ForegroundColor Cyan

try {
    New-NetFirewallRule `
        -DisplayName "Vite Dev Server" `
        -Description "Permite acesso ao Vite dev server na porta 5173 (OSOT API Interface)" `
        -Direction Inbound `
        -LocalPort 5173 `
        -Protocol TCP `
        -Action Allow `
        -Profile Any `
        -Enabled True | Out-Null
    
    Write-Host "✅ Regra de firewall criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Agora você pode acessar de qualquer dispositivo na mesma rede:" -ForegroundColor Green
    
    # Mostra o IP Wi-Fi
    $wifiIP = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress
    if ($wifiIP) {
        Write-Host "   http://${wifiIP}:5173" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erro ao criar regra de firewall:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
