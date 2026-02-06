# Script to generate token and immediately list entities
# Usage: .\test-dataverse-access.ps1

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

Write-Host "🚀 Generating fresh owner token..." -ForegroundColor Yellow

try {
  # Generate fresh token with owner app
  $ownerToken = Get-OAuthToken -clientId $env:OWNER_CLIENT_ID -clientSecret $env:OWNER_CLIENT_SECRET -tenantId $env:MAIN_TENANT_ID -resource $env:DYNAMICS_URL

  Write-Host "✅ Token generated successfully" -ForegroundColor Green

  # Test API access
  $headers = @{
    'Authorization' = "Bearer $ownerToken"
    'Accept' = 'application/json'
    'OData-MaxVersion' = '4.0'
    'OData-Version' = '4.0'
  }

  $apiUrl = "$env:DYNAMICS_URL/api/data/v9.2/"
  Write-Host "📡 Testing API access: $apiUrl" -ForegroundColor Gray

  $response = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method GET

  if ($response.value) {
    Write-Host "✅ Found $($response.value.Count) entity sets" -ForegroundColor Green

    # Filter for relevant tables
    $relevantTables = $response.value | Where-Object {
      $_.name -like "*osot*" -or
      $_.name -like "*membership*" -or
      $_.name -like "*Member*" -or
      $_.name -like "*account*" -or
      $_.name -like "*contact*" -or
      $_.name -like "*table*" -or
      $_.name -like "*Table*"
    } | Sort-Object name

    if ($relevantTables) {
      Write-Host "`n🎯 Relevant tables found:" -ForegroundColor Cyan
      $relevantTables | ForEach-Object {
        Write-Host "  📋 $($_.name)" -ForegroundColor Green
      }

      # Check specifically for membership-related tables
      $membershipTables = $relevantTables | Where-Object { $_.name -like "*membership*" }
      if ($membershipTables) {
        Write-Host "`n🔍 Membership-specific tables:" -ForegroundColor Yellow
        $membershipTables | ForEach-Object {
          Write-Host "  🎯 $($_.name)" -ForegroundColor Cyan
        }
      }
    } else {
      Write-Host "❌ No relevant tables found" -ForegroundColor Red
      Write-Host "`n📋 First 20 entity sets for reference:" -ForegroundColor Yellow
      $response.value | Select-Object -First 20 | ForEach-Object {
        Write-Host "  • $($_.name)" -ForegroundColor White
      }
    }
  } else {
    Write-Host "❌ No 'value' property in response" -ForegroundColor Red
    Write-Host "Response structure:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 2
  }

} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  }
}

Write-Host "`n✨ Test complete!" -ForegroundColor Green
