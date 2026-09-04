# Elimina del historial de PowerShell la línea que contenía la contraseña del mailer.
# Ejecuta este script en PowerShell: .\scripts\clear-history-remove-password.ps1

$historyPath = (Get-PSReadLineOption).HistorySavePath
if (-not (Test-Path $historyPath)) {
    Write-Host "No se encontro el archivo de historial de PSReadLine."
    exit 1
}

$content = Get-Content $historyPath -Raw
if (-not $content) { exit 0 }

# Quitar lineas que contengan mailer.pass o la contraseña
$lines = Get-Content $historyPath
$filtered = $lines | Where-Object { $_ -notmatch 'mailer\.pass' -and $_ -notmatch 'MAILER_PASS' -and $_ -notmatch '!@rNA' }
$filtered | Set-Content $historyPath -Encoding UTF8

# Limpiar tambien el historial de la sesion actual
Clear-Host
Write-Host "Listo. Se eliminaron las lineas con mailer.pass del historial guardado."
Write-Host "Cierra esta ventana de PowerShell para que la sesion actual tampoco las tenga."
