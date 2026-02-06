# 🔄 Sync Frontend API URL from Backend
# Copia o API_URL do backend .env para o frontend .env.local

Write-Host "`n🔄 Syncing Frontend API URL..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Define paths
$backendEnvPath = ".\.env"
$frontendEnvPath = "..\osot-frontend\.env.local"

# Check if backend .env exists
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "`n❌ ERRO: Backend .env não encontrado!" -ForegroundColor Red
    Write-Host "   Execute primeiro: .\setup-backend-network.ps1" -ForegroundColor Yellow
    exit 1
}

# Read backend API_URL
$backendEnv = Get-Content $backendEnvPath -Raw
$apiUrlMatch = ($backendEnv | Select-String -Pattern "API_URL=(.*)").Matches

if (-not $apiUrlMatch -or $apiUrlMatch.Count -eq 0) {
    Write-Host "`n❌ ERRO: API_URL não encontrado no backend .env!" -ForegroundColor Red
    Write-Host "   Execute primeiro: .\setup-backend-network.ps1" -ForegroundColor Yellow
    exit 1
}

$apiUrl = $apiUrlMatch[0].Groups[1].Value.Trim()
Write-Host "`n📡 Backend API URL: $apiUrl" -ForegroundColor Green

# Check if frontend directory exists
$frontendDir = "..\osot-frontend"
if (-not (Test-Path $frontendDir)) {
    Write-Host "`n⚠️  AVISO: Diretório do frontend não encontrado: $frontendDir" -ForegroundColor Yellow
    Write-Host "   Ajuste o caminho no script se necessário." -ForegroundColor Gray
    
    # Ask user for correct path
    $customPath = Read-Host "`n   Digite o caminho do frontend (ou Enter para pular)"
    if ($customPath) {
        $frontendEnvPath = Join-Path $customPath ".env.local"
    } else {
        Write-Host "`n   Pulando atualização do frontend." -ForegroundColor Gray
        exit 0
    }
}

# Update or create frontend .env.local
Write-Host "`n📝 Atualizando frontend .env.local..." -ForegroundColor Cyan

if (Test-Path $frontendEnvPath) {
    # Update existing file
    $frontendContent = Get-Content $frontendEnvPath -Raw
    
    if ($frontendContent -match "VITE_API_BASE_URL=") {
        $frontendContent = $frontendContent -replace "VITE_API_BASE_URL=.*", "VITE_API_BASE_URL=$apiUrl"
        Write-Host "   ✅ VITE_API_BASE_URL atualizado" -ForegroundColor Green
    } else {
        $frontendContent += "`nVITE_API_BASE_URL=$apiUrl"
        Write-Host "   ✅ VITE_API_BASE_URL adicionado" -ForegroundColor Green
    }
    
    Set-Content -Path $frontendEnvPath -Value $frontendContent
    
} else {
    # Create new file
    Write-Host "   ℹ️  Criando novo arquivo .env.local..." -ForegroundColor Yellow
    
    $newFrontendContent = @"
# Frontend Configuration - Auto-synced from Backend
# Last updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Backend API URL (synced daily with setup-backend-network.ps1)
VITE_API_BASE_URL=$apiUrl

# Add other frontend environment variables below
"@
    
    Set-Content -Path $frontendEnvPath -Value $newFrontendContent
    Write-Host "   ✅ Arquivo .env.local criado" -ForegroundColor Green
}

Write-Host "`n✨ Sincronização concluída com sucesso!" -ForegroundColor Green
Write-Host "`n📋 Resumo:" -ForegroundColor Cyan
Write-Host "   Backend API: $apiUrl" -ForegroundColor White
Write-Host "   Frontend Config: $frontendEnvPath" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Próximo passo: npm run dev (no frontend)" -ForegroundColor Yellow
Write-Host ""
