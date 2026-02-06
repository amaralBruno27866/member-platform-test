# Script for cleaning TypeScript/VS Code cache
# Usage: ./clean-cache.ps1

Write-Host "🧹 Cleaning TypeScript and VS Code cache..." -ForegroundColor Yellow

# Stop VS Code processes if running
Write-Host "⏹️  Closing VS Code processes..." -ForegroundColor Cyan
Get-Process "Code" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear TypeScript cache
Write-Host "🗑️  Removing TypeScript cache..." -ForegroundColor Cyan
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".tsbuildinfo" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue

# Clear VS Code cache (Windows user)
$vscodeCache = "$env:APPDATA\Code\User\workspaceStorage"
if (Test-Path $vscodeCache) {
    Write-Host "🗑️  Removing VS Code workspace cache..." -ForegroundColor Cyan
    Get-ChildItem $vscodeCache | Where-Object { $_.Name -like "*osot-dataverse-api*" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

# Rebuild project
Write-Host "🔨 Rebuilding project..." -ForegroundColor Green
npm run build

Write-Host "✅ Cleanup completed! You can now reopen VS Code." -ForegroundColor Green
Write-Host "💡 Tip: Run 'code .' to reopen the project" -ForegroundColor Yellow
