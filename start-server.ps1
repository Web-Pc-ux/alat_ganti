<#
Simple PowerShell static file server using HttpListener.
Reads port from config.json (port) in the same folder.
Run: .\start-server.ps1
#>

$cfgPath = Join-Path (Get-Location) 'config.json'
if (Test-Path $cfgPath) {
    $cfg  = Get-Content $cfgPath -Raw | ConvertFrom-Json
    $port = [int]($cfg.port)
} else {
    $port = 8000
}

function Get-MimeType {
    param($path)
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    switch ($ext) {
        '.html' { 'text/html' }
        '.htm'  { 'text/html' }
        '.css'  { 'text/css' }
        '.js'   { 'application/javascript' }
        '.json' { 'application/json' }
        '.png'  { 'image/png' }
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.gif'  { 'image/gif' }
        '.svg'  { 'image/svg+xml' }
        '.txt'  { 'text/plain' }
        default { 'application/octet-stream' }
    }
}

# ── Find available port (localhost only) ───────────────────────────────────────
$listener = $null
$maxTry   = 50
$found    = $false

for ($p = $port; $p -le ($port + $maxTry); $p++) {
    $testListener = New-Object System.Net.HttpListener
    try {
        $testListener.Prefixes.Add([string]::Format('http://localhost:{0}/', $p))
        $testListener.Start()
        $listener = $testListener
        $port     = $p
        $found    = $true
        break
    } catch {
        try { $testListener.Close() } catch {}
    }
}

if (-not $found) {
    Write-Host 'FATAL: Gagal memulakan server pada semua port yang dicuba.' -ForegroundColor Red
    Read-Host  'Tekan Enter untuk keluar'
    exit 1
}

# ── Status ─────────────────────────────────────────────────────────────────────
Write-Host ''
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '  SERVER BERJALAN ✅' -ForegroundColor Green
Write-Host "  URL  : http://localhost:$port/" -ForegroundColor Yellow
Write-Host "  Folder : $(Get-Location)" -ForegroundColor Gray
Write-Host '  Tekan Ctrl+C untuk henti.' -ForegroundColor Gray
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''

# ── Request loop ───────────────────────────────────────────────────────────────
while ($listener.IsListening) {
    try {
        $context  = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.AbsolutePath
        if ([string]::IsNullOrEmpty($urlPath) -or $urlPath -eq '/') { $urlPath = '/index.html' }

        $localPath = Join-Path (Get-Location) ($urlPath.TrimStart('/'))

        if (Test-Path $localPath) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType     = Get-MimeType $localPath
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "  200  $urlPath" -ForegroundColor DarkGray
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes('404 - Not Found')
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            Write-Host "  404  $urlPath" -ForegroundColor DarkRed
        }
        $response.OutputStream.Close()
    } catch {
        if ($listener.IsListening) {
            Write-Host "  ERR  $_" -ForegroundColor Yellow
        }
    }
}

$listener.Stop()
$listener.Close()
