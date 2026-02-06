# Script to check the actual primary key field name in Dataverse
$tokenScript = ".\get-tokens.ps1"
. $tokenScript

$headers = @{
    "Authorization" = "Bearer $dataverseToken"
    "OData-MaxVersion" = "4.0"
    "OData-Version" = "4.0"
    "Accept" = "application/json"
    "Prefer" = "odata.include-annotations=*"
}

$url = "$dataverseUrl/api/data/v9.2/osot_table_membership_categories?`$top=1"

Write-Host "Fetching category record to see actual field names..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get

Write-Host "`nFull response:" -ForegroundColor Yellow
$response.value[0] | ConvertTo-Json -Depth 5

Write-Host "`nField names:" -ForegroundColor Yellow
$response.value[0].PSObject.Properties.Name | Sort-Object
