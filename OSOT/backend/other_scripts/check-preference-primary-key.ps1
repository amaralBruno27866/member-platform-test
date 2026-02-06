# Script to check the actual primary key field name in Dataverse for preferences
$env:NODE_ENV = "development"
$envContent = Get-Content .env -Raw
$token = ($envContent | Select-String 'DATAVERSE_MAIN_TOKEN="([^"]+)"').Matches.Groups[1].Value

$headers = @{
    "Authorization" = "Bearer $token"
    "OData-MaxVersion" = "4.0"
    "OData-Version" = "4.0"
    "Accept" = "application/json"
}

$url = "https://orgdf422ee9.api.crm3.dynamics.com/api/data/v9.2/osot_table_membership_preferences?`$top=1"

Write-Host "Fetching preference record to see actual field names..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    
    Write-Host "`nField names in response:" -ForegroundColor Yellow
    $response.value[0].PSObject.Properties.Name | Where-Object { $_ -like "*preference*" -or $_ -like "*id" } | Sort-Object
    
    Write-Host "`nAll field names:" -ForegroundColor Yellow
    $response.value[0].PSObject.Properties.Name | Sort-Object
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
