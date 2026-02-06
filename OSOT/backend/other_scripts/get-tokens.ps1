# Load the variables from .env
Get-Content .\.env | ForEach-Object {
  if ($_ -match '^\s*([^=]+)=(.+)\s*$') {
    Set-Item -Path "Env:\$($matches[1])" -Value $matches[2]
  }
}

# Function to generate a token
function Get-OAuthToken {
  param (
    [string]$clientId,
    [string]$clientSecret,
    [string]$tenantId,
    [string]$resource
  )

  $response = Invoke-RestMethod `
    -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" `
    -Method POST `
    -ContentType 'application/x-www-form-urlencoded' `
    -Body @{
      grant_type    = "client_credentials"
      client_id     = $clientId
      client_secret = $clientSecret
      scope         = "$($resource -replace '/api/data/v9\.2$','')/.default"
    }

  return $response.access_token
}

# Generate the tokens
$mainToken    = Get-OAuthToken -clientId $env:MAIN_CLIENT_ID    -clientSecret $env:MAIN_CLIENT_SECRET    -tenantId $env:MAIN_TENANT_ID -resource $env:DYNAMICS_URL
$publicToken  = Get-OAuthToken -clientId $env:PUBLIC_CLIENT_ID  -clientSecret $env:PUBLIC_CLIENT_SECRET  -tenantId $env:MAIN_TENANT_ID -resource $env:DYNAMICS_URL
$viewerToken  = Get-OAuthToken -clientId $env:VIEWER_CLIENT_ID  -clientSecret $env:VIEWER_CLIENT_SECRET  -tenantId $env:MAIN_TENANT_ID -resource $env:DYNAMICS_URL
$ownerToken   = Get-OAuthToken -clientId $env:OWNER_CLIENT_ID   -clientSecret $env:OWNER_CLIENT_SECRET   -tenantId $env:MAIN_TENANT_ID -resource $env:DYNAMICS_URL
$adminToken  = Get-OAuthToken -clientId $env:ADMIN_CLIENT_ID   -clientSecret $env:ADMIN_CLIENT_SECRET   -tenantId $env:MAIN_TENANT_ID -resource $env:DYNAMICS_URL

# Display tokens with clear labels
Write-Host "`n=== 🔐 osot-main-app TOKEN ===`n$mainToken`n"
Write-Host "=== 🔐 osot-public-app TOKEN ===`n$publicToken`n"
Write-Host "=== 🔐 osot-viewer-app TOKEN ===`n$viewerToken`n"
Write-Host "=== 🔐 osot-owner-app TOKEN ===`n$ownerToken`n"
Write-Host "=== 🔐 osot-admin-app TOKEN ===`n$adminToken`n"