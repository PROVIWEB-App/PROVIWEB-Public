# Añade proviweb.com (y www) a Firebase Auth Authorized domains SIN instalar gcloud.
# Usa una cuenta de servicio (archivo JSON).
#
# Pasos:
# 1. En Google Cloud Console: IAM -> Cuentas de servicio -> Crear cuenta de servicio.
#    Nombre: "add-auth-domain" (o el que quieras).
#    Rol: "Administrador de Firebase Authentication" (o "Firebase Authentication Admin").
# 2. Crear clave JSON y descargarla. Guarda el archivo como service-account.json
#    en esta carpeta (scripts/) o pasa la ruta como argumento.
# 3. Ejecutar: .\scripts\add-auth-domain-no-gcloud.ps1
#    O con ruta: .\scripts\add-auth-domain-no-gcloud.ps1 -KeyPath "C:\ruta\a\tu-key.json"
#
# Requisito: PowerShell 5.1 o superior (para ConvertFrom-Json y Invoke-RestMethod).

param(
    [string]$KeyPath = "$PSScriptRoot\service-account.json"
)

$ErrorActionPreference = "Stop"
$ProjectId = "proviweb-d8764"
$BaseUrl = "https://identitytoolkit.googleapis.com/admin/v2"
$ConfigUrl = "$BaseUrl/projects/$ProjectId/config"
$TokenUrl = "https://oauth2.googleapis.com/token"
$DomainsToAdd = @("proviweb.com", "www.proviweb.com")

if (-not (Test-Path $KeyPath)) {
    Write-Host "ERROR: No se encuentra el archivo de cuenta de servicio: $KeyPath" -ForegroundColor Red
    Write-Host "Crea una en Cloud Console -> IAM -> Cuentas de servicio -> Crear -> Crear clave (JSON)." -ForegroundColor Yellow
    Write-Host "Guarda el JSON como: $KeyPath" -ForegroundColor Yellow
    exit 1
}

$key = Get-Content $KeyPath -Raw | ConvertFrom-Json
$clientEmail = $key.client_email
$privateKeyPem = $key.private_key

# Crear JWT para obtener access token (cuenta de servicio)
function New-Jwt {
    $header = @{ alg = "RS256"; typ = "JWT" } | ConvertTo-Json -Compress
    $now = [int][double]::Parse((Get-Date -UFormat %s))
    $payload = @{
        iss = $clientEmail
        sub = $clientEmail
        aud = "https://oauth2.googleapis.com/token"
        iat = $now
        exp = $now + 3600
        scope = "https://www.googleapis.com/auth/cloud-platform"
    } | ConvertTo-Json -Compress
    $b64Header = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($header)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    $b64Payload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    $signatureInput = "$b64Header.$b64Payload"
    $privateKey = $privateKeyPem -replace '-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s', ''
    $keyBytes = [Convert]::FromBase64String($privateKey)
    $rsa = [System.Security.Cryptography.RSA]::Create()
    $rsa.ImportPkcs8PrivateKey($keyBytes, [ref]$null)
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($signatureInput))
    $sig = $rsa.SignHash($hash, [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
    $b64Sig = [Convert]::ToBase64String($sig).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    "$signatureInput.$b64Sig"
}

Write-Host "Obteniendo token con cuenta de servicio..." -ForegroundColor Cyan
try {
    $jwt = New-Jwt
} catch {
    Write-Host "ERROR creando JWT. Comprueba que el JSON de la cuenta de servicio sea valido." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

$body = @{
    grant_type = "urn:ietf:params:oauth:grant-type:jwt-bearer"
    assertion  = $jwt
}
$tokenResponse = Invoke-RestMethod -Uri $TokenUrl -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
$token = $tokenResponse.access_token
if (-not $token) {
    Write-Host "ERROR: No se obtuvo access_token." -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

Write-Host "Leyendo dominios autorizados actuales..." -ForegroundColor Cyan
try {
    $current = Invoke-RestMethod -Uri $ConfigUrl -Method Get -Headers $headers
} catch {
    Write-Host "ERROR al leer config: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "La cuenta de servicio necesita rol 'Administrador de Firebase Authentication'." -ForegroundColor Yellow
    }
    exit 1
}

$authorizedDomains = @()
if ($current.authorizedDomains) {
    $authorizedDomains = @($current.authorizedDomains)
}
Write-Host "Dominios actuales: $($authorizedDomains -join ', ')" -ForegroundColor Gray

$updated = $false
foreach ($d in $DomainsToAdd) {
    if ($authorizedDomains -notcontains $d) {
        $authorizedDomains += $d
        $updated = $true
        Write-Host "Se anadira: $d" -ForegroundColor Green
    } else {
        Write-Host "Ya existe: $d" -ForegroundColor Gray
    }
}

if (-not $updated) {
    Write-Host "proviweb.com y www.proviweb.com ya estaban autorizados." -ForegroundColor Green
    exit 0
}

$bodyJson = @{ authorizedDomains = $authorizedDomains } | ConvertTo-Json
$patchUrl = "${ConfigUrl}?updateMask=authorizedDomains"
Write-Host "Actualizando dominios autorizados..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri $patchUrl -Method Patch -Headers $headers -Body $bodyJson
    Write-Host "OK. Dominios autorizados: $($authorizedDomains -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "ERROR al actualizar: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
