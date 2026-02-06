# 🚀 OSOT Mobile Testing - Complete Full-Stack Setup
# Configura BACKEND e FRONTEND para acesso mobile simultaneamente

Write-Host "`n🚀 OSOT Full-Stack Mobile Testing - Complete Setup" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Detect Wi-Fi network IP
Write-Host "`n📡 Detecting network configuration..." -ForegroundColor Cyan
$wifiIP = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress

if (-not $wifiIP) {
    Write-Host "`n❌ ERROR: Could not detect Wi-Fi IP!" -ForegroundColor Red
    Write-Host "   Make sure you are connected to Wi-Fi and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "   ✅ Network IP: $wifiIP" -ForegroundColor Green
Write-Host ""

# ============================================
# BACKEND CONFIGURATION
# ============================================
Write-Host "🔧 BACKEND CONFIGURATION" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Step 1: Configure Backend .env
Write-Host "`n📝 [1/6] Configuring Backend .env..." -ForegroundColor Cyan

$backendEnvPath = "..\.env"  # ⚠️ Caminho relativo da pasta other_scripts para raiz
$backendEnvExists = Test-Path $backendEnvPath

# ⚠️ NOTE: Backend and Frontend are on the SAME MACHINE!
# Backend runs on: 192.168.10.77:3000
# Frontend runs on: 192.168.10.77:5173
$frontendUrls = "http://localhost:5173,http://127.0.0.1:5173,http://${wifiIP}:5173"

if ($backendEnvExists) {
    Write-Host "   ℹ️  Updating existing .env..." -ForegroundColor Yellow
    $envContent = Get-Content $backendEnvPath -Raw
    
    # ⚠️ NOTE: API_URL should be the IP of THIS machine (backend)
    # Update API_URL
    if ($envContent -match "API_URL=") {
        $envContent = $envContent -replace "API_URL=.*", "API_URL=http://${wifiIP}:3000"
    } else {
        $envContent += "`nAPI_URL=http://${wifiIP}:3000"
    }
    
    # Atualiza WP_FRONTEND_URL (CORS)
    if ($envContent -match "WP_FRONTEND_URL=") {
        $envContent = $envContent -replace "WP_FRONTEND_URL=.*", "WP_FRONTEND_URL=$frontendUrls"
    } else {
        $envContent += "`nWP_FRONTEND_URL=$frontendUrls"
    }
    
    # Atualiza FRONTEND_URL (para emails)
    if ($envContent -match "FRONTEND_URL=") {
        $envContent = $envContent -replace "FRONTEND_URL=.*", "FRONTEND_URL=http://${wifiIP}:5173"
    } else {
        $envContent += "`nFRONTEND_URL=http://${wifiIP}:5173"
    }
    
    # Atualiza EMAIL_VERIFICATION_BASE_URL (para emails de verificação)
    if ($envContent -match "EMAIL_VERIFICATION_BASE_URL=") {
        $envContent = $envContent -replace "EMAIL_VERIFICATION_BASE_URL=.*", "EMAIL_VERIFICATION_BASE_URL=http://${wifiIP}:5173"
    } else {
        $envContent += "`nEMAIL_VERIFICATION_BASE_URL=http://${wifiIP}:5173"
    }
    
    # Atualiza NETWORK_IP (para console logs e Swagger)
    if ($envContent -match "NETWORK_IP=") {
        $envContent = $envContent -replace "NETWORK_IP=.*", "NETWORK_IP=$wifiIP"
    } else {
        $envContent += "`nNETWORK_IP=$wifiIP"
    }
    
    Set-Content -Path $backendEnvPath -Value $envContent
    Write-Host "   ✅ Backend .env updated" -ForegroundColor Green
    Write-Host "      API_URL=http://${wifiIP}:3000" -ForegroundColor Gray
    Write-Host "      WP_FRONTEND_URL=$frontendUrls" -ForegroundColor Gray
    Write-Host "      FRONTEND_URL=http://${wifiIP}:5173" -ForegroundColor Gray
    Write-Host "      EMAIL_VERIFICATION_BASE_URL=http://${wifiIP}:5173" -ForegroundColor Gray
    Write-Host "      NETWORK_IP=$wifiIP" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Creating basic .env..." -ForegroundColor Yellow
    $newEnvContent = @"
# Backend Configuration - Auto-generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
API_URL=http://${wifiIP}:3000
WP_FRONTEND_URL=$frontendUrls
FRONTEND_URL=http://${wifiIP}:5173
EMAIL_VERIFICATION_BASE_URL=http://${wifiIP}:5173
NETWORK_IP=$wifiIP
NODE_ENV=development
PORT=3000
"@
    Set-Content -Path $backendEnvPath -Value $newEnvContent
    Write-Host "   ✅ Backend .env created" -ForegroundColor Green
    Write-Host "   ⚠️  ADD your Dataverse credentials!" -ForegroundColor Yellow
}

# Step 2: Configure Backend Firewall
Write-Host "`n🔥 [2/6] Configuring Backend Firewall (port 3000)..." -ForegroundColor Cyan

$backendRule = Get-NetFirewallRule -DisplayName "NestJS Dev Server*" -ErrorAction SilentlyContinue

if ($backendRule) {
    Write-Host "   ✅ Backend firewall already configured" -ForegroundColor Green
} else {
    try {
        New-NetFirewallRule `
            -DisplayName "NestJS Dev Server - OSOT API" `
            -Description "OSOT Backend API - Mobile Testing" `
            -Direction Inbound `
            -LocalPort 3000 `
            -Protocol TCP `
            -Action Allow `
            -Profile Any `
            -ErrorAction Stop | Out-Null
        Write-Host "   ✅ Backend firewall configured" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not configure automatically" -ForegroundColor Yellow
        Write-Host "   Run as Admin: .\setup-backend-firewall.ps1" -ForegroundColor Gray
    }
}

# ============================================
# FRONTEND CONFIGURATION
# ============================================
Write-Host "`n🎨 FRONTEND CONFIGURATION" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Step 3: Configure Frontend .env.local
Write-Host "`n📝 [3/6] Configuring Frontend .env.local..." -ForegroundColor Cyan

# ⚠️ NOTE: Script executa de other_scripts/, frontend pode estar em:
# 1. Sibling do projeto backend (osot-api-interface)
# 2. Subdirectory do projeto (frontend/)
# 3. Raiz do projeto (.env.local)
$possibleFrontendPaths = @(
    "..\..\osot-api-interface\.env.local",  # Sibling directory (up 2 levels)
    "..\..\osot-frontend\.env.local",        # Alternative sibling
    "..\frontend\.env.local",                # Subdirectory in root
    "..\.env.local"                          # Root of backend project
)

$frontendEnvPath = $null
foreach ($path in $possibleFrontendPaths) {
    $dir = Split-Path $path -Parent
    if (Test-Path $dir) {
        $frontendEnvPath = $path
        break
    }
}

if ($frontendEnvPath) {
    $frontendDir = Split-Path $frontendEnvPath -Parent
    
    # ⚠️ PRESERVE existing configurations (e.g., Cloudinary)
    $existingContent = ""
    $cloudinaryConfig = ""
    $appConfig = ""
    
    if (Test-Path $frontendEnvPath) {
        $existingLines = Get-Content $frontendEnvPath
        foreach ($line in $existingLines) {
            # Preserve Cloudinary config
            if ($line -match "^VITE_CLOUDINARY_") {
                $cloudinaryConfig += "$line`n"
            }
            # Preserve other configs (except API_URL which will be updated)
            elseif ($line -match "^VITE_" -and $line -notmatch "^VITE_API_URL=" -and $line -notmatch "^VITE_APP_NAME=" -and $line -notmatch "^VITE_APP_VERSION=") {
                $appConfig += "$line`n"
            }
        }
    }
    
    # ⚠️ CRITICAL: Backend and Frontend are on the SAME machine!
    # VITE_API_URL should point to: http://192.168.10.77:3000
    $frontendEnvContent = @"
# Frontend Environment - Mobile Testing
# Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ⚠️ Backend and Frontend on the SAME machine!

VITE_API_URL=http://${wifiIP}:3000

# App Configuration
VITE_APP_NAME=OSOT Platform
VITE_APP_VERSION=1.0.0
"@

    # Adicionar Cloudinary config se existir
    if ($cloudinaryConfig) {
        $frontendEnvContent += "`n`n# Cloudinary Configuration`n$cloudinaryConfig"
    }
    
    # Adicionar outras configs preservadas
    if ($appConfig) {
        $frontendEnvContent += "`n# Additional Configuration`n$appConfig"
    }
    
    Set-Content -Path $frontendEnvPath -Value $frontendEnvContent.TrimEnd()
    Write-Host "   ✅ Frontend .env.local configured in: $frontendDir" -ForegroundColor Green
    Write-Host "      VITE_API_URL=http://${wifiIP}:3000" -ForegroundColor Cyan
    if ($cloudinaryConfig) {
        Write-Host "      ✓ Cloudinary config preserved" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  Frontend directory not found!" -ForegroundColor Yellow
    Write-Host "   Looking in:" -ForegroundColor Gray
    foreach ($path in $possibleFrontendPaths) {
        Write-Host "   • $path" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "   Configure frontend manually with:" -ForegroundColor Yellow
    Write-Host "   VITE_API_URL=http://${wifiIP}:3000" -ForegroundColor Cyan
}

# Step 4: Configure Frontend Firewall
Write-Host "`n🔥 [4/6] Configuring Frontend Firewall (port 5173)..." -ForegroundColor Cyan

$frontendRule = Get-NetFirewallRule -DisplayName "Vite Dev Server" -ErrorAction SilentlyContinue

if ($frontendRule) {
    Write-Host "   ✅ Frontend firewall already configured" -ForegroundColor Green
} else {
    try {
        New-NetFirewallRule `
            -DisplayName "Vite Dev Server" `
            -Description "OSOT Frontend - Mobile Testing" `
            -Direction Inbound `
            -LocalPort 5173 `
            -Protocol TCP `
            -Action Allow `
            -Profile Any `
            -ErrorAction Stop | Out-Null
        Write-Host "   ✅ Frontend firewall configured" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not configure automatically" -ForegroundColor Yellow
        Write-Host "   Run as Admin: .\setup-firewall.ps1" -ForegroundColor Gray
    }
}

# ============================================
# VERIFICATION
# ============================================
Write-Host "`n🔍 VERIFICATION" -ForegroundColor Yellow
Write-Host "-" * 70 -ForegroundColor Gray

# Step 5: Check if Backend is running
Write-Host "`n🔍 [5/6] Checking Backend..." -ForegroundColor Cyan

$backendRunning = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($backendRunning) {
    Write-Host "   ⚠️  Backend is running - RESTART REQUIRED!" -ForegroundColor Yellow
    Write-Host "   ℹ️  .env was updated, but NestJS doesn't reload automatically" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🔄 For changes to take effect:" -ForegroundColor Cyan
    Write-Host "      1. Press Ctrl+C in the backend terminal" -ForegroundColor Gray
    Write-Host "      2. Run: npm run start:dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   ⚡ OR restart automatically now? (Y/N)" -ForegroundColor Yellow -NoNewline
    $response = Read-Host " "
    
    if ($response -eq "Y" -or $response -eq "y" -or $response -eq "S" -or $response -eq "s") {
        Write-Host ""
        Write-Host "   🔄 Attempting to restart backend..." -ForegroundColor Cyan
        
        # Find node process running on port 3000
        $processInfo = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($processInfo) {
            $processId = $processInfo.OwningProcess
            Write-Host "   ⏹️  Stopping process PID: $processId" -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Write-Host "   ✅ Backend stopped successfully" -ForegroundColor Green
            Write-Host ""
            Write-Host "   ℹ️  Start again with: npm run start:dev" -ForegroundColor Cyan
        } else {
            Write-Host "   ❌ Could not find the process" -ForegroundColor Red
        }
    } else {
        Write-Host "   ℹ️  Remember to restart manually!" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  Backend is not running" -ForegroundColor Yellow
    Write-Host "   Start with: npm run start:dev" -ForegroundColor Gray
}

# Step 6: Check if Frontend is running
Write-Host "`n🔍 [6/6] Checking Frontend..." -ForegroundColor Cyan

$frontendRunning = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if ($frontendRunning) {
    Write-Host "   ✅ Frontend is running on port 5173" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Frontend is not running" -ForegroundColor Yellow
    Write-Host "   Start with: npm run dev (in the frontend directory)" -ForegroundColor Gray
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n📋 CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan

Write-Host "`n📱 ACCESS URLS" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "🖥️  DESKTOP (Development):" -ForegroundColor Green
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3000" -ForegroundColor White
Write-Host "   Swagger:   http://localhost:3000/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "📱 MOBILE (Mobile Testing):" -ForegroundColor Cyan
Write-Host "   Access:    http://${wifiIP}:5173" -ForegroundColor White -BackgroundColor DarkCyan
Write-Host ""
Write-Host "ℹ️  Technical Information:" -ForegroundColor Gray
Write-Host "   Machine IP:         $wifiIP" -ForegroundColor DarkGray
Write-Host "   Frontend (Vite):    http://${wifiIP}:5173" -ForegroundColor DarkGray
Write-Host "   Backend (NestJS):   http://${wifiIP}:3000" -ForegroundColor DarkGray
Write-Host "   Backend Swagger:    http://${wifiIP}:3000/api-docs" -ForegroundColor DarkGray
Write-Host "   Backend Health:     http://${wifiIP}:3000/health" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Frontend → Backend Configuration:" -ForegroundColor Green
Write-Host "   VITE_API_URL = http://${wifiIP}:3000" -ForegroundColor DarkGray
Write-Host ""

# Copy MOBILE URL to clipboard
try {
    Set-Clipboard -Value "http://${wifiIP}:5173"
    Write-Host "   ✓ MOBILE URL copied to clipboard!" -ForegroundColor Green
    Write-Host "     Paste in mobile browser: http://${wifiIP}:5173" -ForegroundColor Gray
} catch {}

Write-Host "`n🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""

if (-not $backendRunning) {
    Write-Host "   1️⃣  Start Backend (in this terminal):" -ForegroundColor White
    Write-Host "      npm run start:dev" -ForegroundColor Cyan
    Write-Host ""
}

if (-not $frontendRunning) {
    Write-Host "   2️⃣  Start Frontend (new terminal):" -ForegroundColor White
    Write-Host "      cd ..\osot-api-interface" -ForegroundColor Gray
    Write-Host "      npm run dev" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "   3️⃣  On MOBILE:" -ForegroundColor White
Write-Host "      • Connect to the same Wi-Fi as laptop" -ForegroundColor Gray
Write-Host "      • Open browser (Chrome/Safari)" -ForegroundColor Gray
Write-Host "      • Access: http://${wifiIP}:5173" -ForegroundColor Cyan
Write-Host ""

Write-Host "   4️⃣  On DESKTOP:" -ForegroundColor White
Write-Host "      • Access: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 Important Tips:" -ForegroundColor Cyan
Write-Host "   • Keep backend and frontend running simultaneously" -ForegroundColor Gray
Write-Host "   • If IP changes, run this script again" -ForegroundColor Gray
Write-Host "   • Verify both (PC and mobile) are on the same Wi-Fi" -ForegroundColor Gray
Write-Host "   • Use Chrome/Safari on mobile for best experience" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 Troubleshooting:" -ForegroundColor Cyan
Write-Host "   • Backend won't connect: Run .\setup-backend-firewall.ps1 as Admin" -ForegroundColor Gray
Write-Host "   • Frontend won't connect: Run .\setup-firewall.ps1 as Admin" -ForegroundColor Gray
Write-Host "   • CORS error: Check WP_FRONTEND_URL in .env" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
