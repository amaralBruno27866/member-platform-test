# Product Orchestrator Full Flow Test
# Tests all 4 steps of the product creation workflow

param(
    [string]$Token = $env:AUTH_TOKEN,
    [string]$BaseUrl = "http://localhost:3000",
    [string]$ProductCode = "osot-prd-$(Get-Random -Minimum 100000 -Maximum 999999)"
)

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

if (-not $Token) {
    Write-Error "AUTH_TOKEN environment variable not set. Please set it before running this script."
    Write-Info "Usage: `$env:AUTH_TOKEN = 'your-jwt-token'; .\test-product-orchestrator.ps1"
    exit 1
}

Write-Host ""
Write-Host "🚀 Product Orchestrator Full Flow Test" -ForegroundColor Magenta
Write-Info "Testing 4-step product creation workflow"
Write-Info "Base URL: $BaseUrl"
Write-Info "Product Code: $ProductCode"

# Headers
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

# ============================================================================
# Step 1: Create Session
# ============================================================================
Write-Step "STEP 1: Create Orchestrator Session"

try {
    $response = Invoke-RestMethod `
        -Uri "$BaseUrl/private/products/orchestrate/session/create" `
        -Method POST `
        -Headers $headers `
        -ErrorAction Stop

    Write-Success "Session created"
    Write-Info "Session ID: $($response.sessionId)"
    Write-Info "State: $($response.state)"
    Write-Info "Expires At: $($response.expiresAt)"
    
    $sessionId = $response.sessionId
} catch {
    Write-Error "Failed to create session"
    Write-Error $_.Exception.Message
    if ($_.Exception.Response.StatusCode) {
        Write-Info "Status Code: $($_.Exception.Response.StatusCode)"
    }
    exit 1
}

# ============================================================================
# Step 2: Add Product Data (THIS IS THE MISSING STEP)
# ============================================================================
Write-Step "STEP 2: Add Product Data to Session"

$productPayload = @{
    productCode     = $ProductCode
    productName     = "Test Product $(Get-Date -Format 'HHmmss')"
    productCategory = "Training"
    productStatus   = "Active"
    priceOntario    = 299.99
    priceQuebec     = 279.99
    priceStudent    = 199.99
    priceOta        = 249.99
    glCode          = "5000-001"
    hst             = 0
    gst             = 0
    qst             = 0
} | ConvertTo-Json

Write-Info "Payload: $productPayload"

try {
    $response = Invoke-RestMethod `
        -Uri "$BaseUrl/private/products/orchestrate/session/$sessionId/product" `
        -Method POST `
        -Headers $headers `
        -Body $productPayload `
        -ErrorAction Stop

    Write-Success "Product data added to session"
    Write-Info "Session State: $($response.state)"
    Write-Info "Product Code: $($response.product.productCode)"
    Write-Info "Product Name: $($response.product.productName)"
    
    if (-not $response.product) {
        Write-Error "ERROR: Product object is empty or null in response!"
        Write-Error "Response: $($response | ConvertTo-Json)"
    }
} catch {
    Write-Error "Failed to add product data"
    Write-Error $_.Exception.Message
    if ($_.Exception.Response) {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        Write-Error "Response Body: $errorContent"
    }
    exit 1
}

# ============================================================================
# Step 3: Configure Audience Target
# ============================================================================
Write-Step "STEP 3: Configure Audience Target"

$targetPayload = @{
    osot_account_group       = @(1, 2)
    osot_location_province   = @(1)
    osot_employment_status   = @(1, 2)
} | ConvertTo-Json

Write-Info "Payload: $targetPayload"

try {
    $response = Invoke-RestMethod `
        -Uri "$BaseUrl/private/products/orchestrate/session/$sessionId/audience-target" `
        -Method POST `
        -Headers $headers `
        -Body $targetPayload `
        -ErrorAction Stop

    Write-Success "Audience target configured"
    Write-Info "Session State: $($response.state)"
    Write-Info "Target Groups: $($response.audienceTarget.osot_account_group -join ', ')"
} catch {
    Write-Error "Failed to configure audience target"
    Write-Error $_.Exception.Message
    if ($_.Exception.Response) {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        Write-Error "Response Body: $errorContent"
    }
    exit 1
}

# ============================================================================
# Step 4: Commit Session
# ============================================================================
Write-Step "STEP 4: Commit Session to Dataverse"

try {
    $response = Invoke-RestMethod `
        -Uri "$BaseUrl/private/products/orchestrate/session/$sessionId/commit" `
        -Method POST `
        -Headers $headers `
        -ErrorAction Stop

    Write-Success "Session committed successfully"
    Write-Info "Success: $($response.success)"
    Write-Info "Product GUID: $($response.productGuid)"
    Write-Info "Target GUID: $($response.targetGuid)"
    Write-Info "Product Code: $($response.productCode)"
    Write-Info "Operation ID: $($response.operationId)"
    
    Write-Host ""
    Write-Host "🎉 Full workflow completed successfully!" -ForegroundColor Green
} catch {
    Write-Error "Failed to commit session"
    Write-Error $_.Exception.Message
    if ($_.Exception.Response) {
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        Write-Error "Response Body: $errorContent"
    }
    exit 1
}
