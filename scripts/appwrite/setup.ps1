$Endpoint = $env:APPWRITE_ENDPOINT
$ProjectId = $env:APPWRITE_PROJECT_ID
$ApiKey = $env:APPWRITE_API_KEY

if (-not $Endpoint -or -not $ProjectId -or -not $ApiKey) {
    throw "Missing Appwrite environment variables."
}

$Headers = @{
    "X-Appwrite-Project" = $ProjectId
    "X-Appwrite-Key"     = $ApiKey
    "Content-Type"       = "application/json"
}

$DatabaseId = "soc5_outbound"

$Body = @{
    databaseId = $DatabaseId
    name       = "SOC5 Outbound"
} | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Uri "$Endpoint/databases" `
        -Method Post `
        -Headers $Headers `
        -Body $Body

    Write-Host "PASS: Database created."
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "PASS: Database already exists."
    }
    else {
        throw
    }
}

$TableId = "profiles"

$Body = @{
    tableId = $TableId
    name    = "Profiles"
} | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Uri "$Endpoint/databases/$DatabaseId/tables" `
        -Method Post `
        -Headers $Headers `
        -Body $Body

    Write-Host "PASS: profiles table created."
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "PASS: profiles table already exists."
    }
    else {
        throw
    }
}