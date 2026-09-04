# Añade proviweb.com (y www.proviweb.com) a Firebase Auth Authorized domains
# Requisitos:
#   1. Google Cloud SDK (gcloud) instalado: https://cloud.google.com/sdk/docs/install
#   2. Sesión iniciada: gcloud auth login
#   3. Proyecto activo: gcloud config set project proviweb-d8764
#   4. API Identity Toolkit habilitada en el proyecto (Firebase Auth la usa por defecto)
# Uso (desde la raíz del repo): .\scripts\add-auth-domain.ps1

$ErrorActionPreference = "Stop"
$ProjectId = "proviweb-d8764"
$BaseUrl = "https://identitytoolkit.googleapis.com/admin/v2"
$ConfigUrl = "$BaseUrl/projects/$ProjectId/config"

# Dominios a añadir si no están
$DomainsToAdd = @("proviweb.com", "www.proviweb.com")

# Buscar gcloud (por si no está en PATH)
$gcloudCmd = $null
if (Get-Command gcloud -ErrorAction SilentlyContinue) { $gcloudCmd = "gcloud" }
elseif (Test-Path "${env:ProgramFiles(x86)}\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd") { $gcloudCmd = "${env:ProgramFiles(x86)}\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" }
elseif (Test-Path "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd") { $gcloudCmd = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" }
if (-not $gcloudCmd) {
    Write-Host "ERROR: gcloud no encontrado. Instalalo o anade al PATH la carpeta bin del Cloud SDK." -ForegroundColor Red
    exit 1
}

Write-Host "Obteniendo token de acceso (gcloud)..." -ForegroundColor Cyan
$token = & $gcloudCmd auth print-access-token 2>$null
if (-not $token) {
    Write-Host "ERROR: No se pudo obtener el token. Ejecuta: $gcloudCmd auth login" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# 1) Obtener configuración actual
Write-Host "Leyendo dominios autorizados actuales..." -ForegroundColor Cyan
try {
    $current = Invoke-RestMethod -Uri $ConfigUrl -Method Get -Headers $headers
} catch {
    Write-Host "ERROR al leer config: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "Falta permiso. En Cloud Console asigna el rol 'Administrador de Firebase Authentication' a tu cuenta." -ForegroundColor Yellow
    }
    exit 1
}

$authorizedDomains = @()
if ($current.authorizedDomains) {
    $authorizedDomains = @($current.authorizedDomains)
}
Write-Host "Dominios actuales: $($authorizedDomains -join ', ')" -ForegroundColor Gray

# 2) Añadir los que falten
$updated = $false
foreach ($d in $DomainsToAdd) {
    if ($authorizedDomains -notcontains $d) {
        $authorizedDomains += $d
        $updated = $true
        Write-Host "Se añadira: $d" -ForegroundColor Green
    } else {
        Write-Host "Ya existe: $d" -ForegroundColor Gray
    }
}

if (-not $updated) {
    Write-Host "proviweb.com y www.proviweb.com ya estaban autorizados. Nada que hacer." -ForegroundColor Green
    exit 0
}

# 3) Actualizar config (solo authorizedDomains)
$body = @{ authorizedDomains = $authorizedDomains } | ConvertTo-Json
$patchUrl = "${ConfigUrl}?updateMask=authorizedDomains"

Write-Host "Actualizando dominios autorizados..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri $patchUrl -Method Patch -Headers $headers -Body $body
    Write-Host "OK. Dominios autorizados actualizados: $($authorizedDomains -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "ERROR al actualizar: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
