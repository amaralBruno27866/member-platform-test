# Script para descobrir o IP correto para acessar via celular
# Executa: .\get-network-ip.ps1

Write-Host "`n🌐 OSOT API Interface - Network IP Scanner" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Pega o IP da interface Wi-Fi (mais comum para celular)
$wifiIP = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress

# Pega o IP da interface Ethernet (caso esteja com cabo)
$ethernetIP = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress

Write-Host "`n📱 URLs para acessar no celular:" -ForegroundColor Green
Write-Host ""

if ($wifiIP) {
    $wifiURL = "http://${wifiIP}:5173"
    Write-Host "   Wi-Fi (Recomendado):" -ForegroundColor Yellow
    Write-Host "   $wifiURL" -ForegroundColor White
    Write-Host ""
    
    # Copia para clipboard se possível
    try {
        Set-Clipboard -Value $wifiURL
        Write-Host "   ✓ URL copiada para clipboard!" -ForegroundColor Green
    } catch {
        # Clipboard pode não estar disponível
    }
}

if ($ethernetIP) {
    Write-Host "   Ethernet (Cabo):" -ForegroundColor Yellow
    Write-Host "   http://${ethernetIP}:5173" -ForegroundColor White
    Write-Host ""
}

if (-not $wifiIP -and -not $ethernetIP) {
    Write-Host "   ⚠️  Nenhuma interface de rede ativa encontrada!" -ForegroundColor Red
    Write-Host "   Conecte-se ao Wi-Fi ou Ethernet e tente novamente." -ForegroundColor Red
}

Write-Host "`n💡 Dicas:" -ForegroundColor Cyan
Write-Host "   1. Certifique-se de que seu celular está na MESMA rede Wi-Fi" -ForegroundColor Gray
Write-Host "   2. Verifique se o firewall não está bloqueando a porta 5173" -ForegroundColor Gray
Write-Host "   3. Em redes corporativas, pode haver restrições de segurança" -ForegroundColor Gray
Write-Host ""
Write-Host "🔥 Firewall: Execute este comando como Admin se necessário:" -ForegroundColor Cyan
Write-Host "   New-NetFirewallRule -DisplayName 'Vite Dev Server' -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
