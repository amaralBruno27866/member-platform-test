# 🧪 Backend Approval Testing Script
# Tests admin approval/rejection endpoints directly

Write-Host "`n🧪 Testing Admin Approval Endpoints" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:3000"
$headers = @{
    "Content-Type" = "application/json"
}

# Function to make test request
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description
    )
    
    Write-Host "`n📍 $Description" -ForegroundColor Yellow
    Write-Host "   URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        Write-Host "   ✅ SUCCESS" -ForegroundColor Green
        Write-Host "   Response:" -ForegroundColor Gray
        $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor White
        return $true
    }
    catch {
        Write-Host "   ❌ FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Details:" -ForegroundColor Gray
            $errorJson | ConvertTo-Json -Depth 2 | Write-Host -ForegroundColor Yellow
        }
        return $false
    }
}

Write-Host "`n📋 Test Plan:" -ForegroundColor Cyan
Write-Host "   1. Register new user" -ForegroundColor Gray
Write-Host "   2. Get approval token from logs/email" -ForegroundColor Gray
Write-Host "   3. Test approval endpoint" -ForegroundColor Gray
Write-Host "   4. Verify account status in Dataverse" -ForegroundColor Gray

# Pre-check: Is backend running?
Write-Host "`n🔍 Pre-Check: Backend Status" -ForegroundColor Cyan
try {
    $healthCheck = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend is NOT running at $baseUrl" -ForegroundColor Red
    Write-Host "   Please start the backend with: npm run start:dev" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Step 1: Register a test user
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 1: Register Test User" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$testEmail = "b.alencar.amaral@gmail.com"  # Email real para receber verificação
$registrationUrl = "$baseUrl/public/orchestrator/register"

$registrationData = @{
    account = @{
        osot_first_name = "Test"
        osot_last_name = "Approval"
        osot_email = $testEmail
        osot_mobile_phone = "(437) 123-4567"  # Formato canadense correto
        osot_date_of_birth = "1990-01-01"
        osot_account_group = 1
        osot_privilege = 1
        osot_account_declaration = $true
        osot_password = "Secure@2024Pass"  # Não contém info pessoal
    }
    address = @{
        osot_address_1 = "123 Test St"
        osot_city = 317
        osot_province = 1
        osot_country = 1
        osot_postal_code = "L4B1R6"
        osot_address_type = 1
    }
    contact = @{
        osot_mobile_phone = "(437) 123-4567"
        osot_preferred_phone = 1  # Mobile
    }
    identity = @{
        osot_language = @(1)
    }
    educationType = "ot"  # 'ot' ou 'ota'
    education = @{
        osot_coto_status = 4
        osot_ot_university = 5
        osot_ot_grad_year = 26
        osot_ot_degree_type = 2
        osot_ot_country = 1
        osot_coto_registration = "TEST12345"
    }
}

Write-Host "`n📤 Registering user: $testEmail" -ForegroundColor Yellow

try {
    $jsonBody = $registrationData | ConvertTo-Json -Depth 10
    Write-Host "   📦 Request Body:" -ForegroundColor Gray
    Write-Host $jsonBody -ForegroundColor DarkGray
    
    $registrationResponse = Invoke-RestMethod `
        -Uri $registrationUrl `
        -Method POST `
        -Headers $headers `
        -Body $jsonBody `
        -ErrorAction Stop
    
    Write-Host "   ✅ Registration initiated" -ForegroundColor Green
    Write-Host "   Session ID: $($registrationResponse.sessionId)" -ForegroundColor White
    
    $sessionId = $registrationResponse.sessionId
    
    # Step 2: Verify email (simulate click)
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "STEP 2: Email Verification" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    Write-Host "`n⏳ Waiting 5 seconds for email to be sent..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "`n⚠️  MANUAL STEP REQUIRED:" -ForegroundColor Yellow
    Write-Host "   1. Check your email inbox for verification email" -ForegroundColor White
    Write-Host "   2. Click the verification link" -ForegroundColor White
    Write-Host "   3. Wait for admin approval email" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "   Press ENTER after clicking email verification link (or 'skip' to use mock token)"
    
    if ($continue -eq 'skip') {
        Write-Host "`n   ⚠️  Skipping to mock approval test..." -ForegroundColor Yellow
        
        # Step 3: Test with mock token (for testing endpoint structure)
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "STEP 3: Test Approval Endpoint (Mock)" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
        $mockToken = "approve_test_mock_token"
        Test-Endpoint -Method "GET" -Url "$baseUrl/public/orchestrator/admin/approve/$mockToken" -Description "Test approval endpoint structure (will fail - token invalid)"
        
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "STEP 4: Test Rejection Endpoint (Mock)" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
        Test-Endpoint -Method "GET" -Url "$baseUrl/public/orchestrator/admin/reject/$mockToken" -Description "Test rejection endpoint structure (will fail - token invalid)"
        
    } else {
        # Step 3: Get approval token from logs
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "STEP 3: Admin Approval" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        
        Write-Host "`n⚠️  Check backend logs for approval token or admin email" -ForegroundColor Yellow
        Write-Host "   Look for: 'Admin notification sent to:'" -ForegroundColor Gray
        Write-Host ""
        
        $approvalToken = Read-Host "   Enter approval token from email/logs"
        
        if ($approvalToken) {
            Test-Endpoint -Method "GET" -Url "$baseUrl/public/orchestrator/admin/approve/$approvalToken" -Description "Process admin approval with real token"
            
            Write-Host "`n✅ If successful, check:" -ForegroundColor Green
            Write-Host "   1. Backend logs for status update" -ForegroundColor White
            Write-Host "   2. User email for approval notification" -ForegroundColor White
            Write-Host "   3. Dataverse: osot_account_status should be 1 (ACTIVE)" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "   ❌ Registration failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "   📋 Error Details:" -ForegroundColor Yellow
        try {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorJson | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Yellow
        } catch {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n   💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Check if backend is running: http://localhost:3000" -ForegroundColor White
    Write-Host "   2. Check backend logs for validation errors" -ForegroundColor White
    Write-Host "   3. Verify all required fields are present" -ForegroundColor White
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n✅ Endpoints Available:" -ForegroundColor Green
Write-Host "   GET $baseUrl/public/orchestrator/admin/approve/:token" -ForegroundColor White
Write-Host "   GET $baseUrl/public/orchestrator/admin/reject/:token" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Frontend implements the two routes" -ForegroundColor White
Write-Host "   2. Test complete flow: register → verify → approve" -ForegroundColor White
Write-Host "   3. Verify account becomes ACTIVE in Dataverse" -ForegroundColor White

Write-Host ""
