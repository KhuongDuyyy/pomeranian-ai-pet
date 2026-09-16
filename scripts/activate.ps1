$petRoot = Split-Path -Parent $PSScriptRoot
$petNodeDirectory = Join-Path $petRoot '.tools'
if (Test-Path (Join-Path $petNodeDirectory 'node.exe')) {
    $env:PATH = "$petNodeDirectory;$env:PATH"
    $env:npm_config_cache = Join-Path $petRoot '.tools/npm-cache'
    Write-Host 'Local Node/npm ready. Run: npm run dev'
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host 'System Node/npm ready. Run: npm run dev'
} else {
    throw 'Install Node.js 22+ with npm, then reopen the terminal.'
}
