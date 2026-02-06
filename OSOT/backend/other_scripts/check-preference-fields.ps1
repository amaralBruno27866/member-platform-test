# Script to check fields in osot_table_membership_preferences table
# Usage: .\check-preference-fields.ps1

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

Write-Host "🚀 Checking osot_table_membership_preferences fields..." -ForegroundColor Yellow

try {
  # Generate fresh token with owner app
  $ownerToken = Get-OAuthToken -clientId $env:OWNER_CLIENT_ID -clientSecret $env:OWNER_CLIENT_SECRET -tenantId $env:MAIN_TENANT_ID -resource $env:DYNAMICS_URL

  Write-Host "✅ Token generated successfully" -ForegroundColor Green

  # Query for table metadata
  $headers = @{
    'Authorization' = "Bearer $ownerToken"
    'Accept' = 'application/json'
    'OData-MaxVersion' = '4.0'
    'OData-Version' = '4.0'
  }

  # Get entity definition
  $metadataUrl = "$env:DYNAMICS_URL/api/data/v9.2/EntityDefinitions(LogicalName='osot_table_membership_preference')?`$select=LogicalName,SchemaName&`$expand=Attributes(`$select=LogicalName,SchemaName,AttributeType)"
  
  Write-Host "📡 Fetching table metadata..." -ForegroundColor Gray

  $response = Invoke-RestMethod -Uri $metadataUrl -Headers $headers -Method GET

  if ($response.Attributes) {
    Write-Host "`n✅ Table found! Fields:" -ForegroundColor Green
    
    # Filter for our specific fields
    $accessFields = $response.Attributes | Where-Object {
      $_.LogicalName -eq 'osot_privilege' -or
      $_.LogicalName -eq 'osot_access_modifiers'
    }
    
    Write-Host "`n🔍 Access control fields:" -ForegroundColor Cyan
    if ($accessFields) {
      $accessFields | ForEach-Object {
        Write-Host "  ✅ $($_.LogicalName) ($($_.AttributeType))" -ForegroundColor Green
      }
    } else {
      Write-Host "  ❌ osot_privilege and osot_access_modifiers NOT FOUND" -ForegroundColor Red
    }
    
    Write-Host "`n📋 All fields in table:" -ForegroundColor Yellow
    $response.Attributes | Sort-Object LogicalName | ForEach-Object {
      $color = if ($_.LogicalName -like "osot_*") { "Cyan" } else { "Gray" }
      Write-Host "  • $($_.LogicalName) ($($_.AttributeType))" -ForegroundColor $color
    }
  } else {
    Write-Host "❌ No attributes found" -ForegroundColor Red
  }

} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response: $responseBody" -ForegroundColor Red
  }
}
