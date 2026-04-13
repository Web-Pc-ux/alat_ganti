<#
Simple PowerShell static file server using HttpListener.
Reads port from config.json (port) in the same folder.
Run: .\start-server.ps1
#>

$cfgPath = Join-Path (Get-Location) 'config.json'
if (Test-Path $cfgPath) {
    $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
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
        '.jpg' { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.gif'  { 'image/gif' }
        '.svg'  { 'image/svg+xml' }
        '.txt'  { 'text/plain' }
        default { 'application/octet-stream' }
    }
}

Write-Host "Starting static server for $(Get-Location) on port $port" -ForegroundColor Green

$listener = $null
$maxTry = 50
$found = $false
for ($p = $port; $p -le ($port + $maxTry); $p++) {
    $testListener = New-Object System.Net.HttpListener
    $prefix = "http://localhost:$p/"
    try {
        $testListener.Prefixes.Add($prefix)
        $testListener.Start()
        $listener = $testListener
        $port = $p
        $found = $true
        break
    } catch {
        try { $testListener.Close() } catch {}
    }
}
if (-not $found) {
    Write-Host "Failed to start listener on ports $port through $($port + $maxTry). Maybe permission or port in use." -ForegroundColor Red
    throw
}

Write-Host "Server running - open http://localhost:$port/" -ForegroundColor Cyan
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        Write-Host "Request: $($request.HttpMethod) $($request.Url.AbsolutePath)" -ForegroundColor White

        $urlPath = $request.Url.AbsolutePath
        if ([string]::IsNullOrEmpty($urlPath) -or $urlPath -eq '/') { $urlPath = '/index.html' }

        $localPath = Join-Path (Get-Location) ($urlPath.TrimStart('/'))
        if (Test-Path $localPath) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType = Get-MimeType $localPath
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
        } else {
            $response.StatusCode = 404
            $msg = "404 - Not Found"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($msg)
            $response.OutputStream.Write($buffer,0,$buffer.Length)
            $response.OutputStream.Close()
        }
    } catch {
        Write-Host "Request handling error: $_" -ForegroundColor Yellow
    }
}

$listener.Stop()
$listener.Close()
