$ErrorActionPreference = 'Stop'
$taskNodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $taskNodePath -or [int]((& $taskNodePath --version).TrimStart('v').Split('.')[0]) -lt 24) {
    $taskNodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $taskNodePath)) { throw 'Install Node.js 24 or newer.' }
Push-Location $PSScriptRoot
try {
    if (-not (Test-Path 'node_modules')) { throw 'Run npm install first.' }
    if (-not (Test-Path 'dist\index.html')) { & $taskNodePath 'node_modules\vite\bin\vite.js' build; if ($LASTEXITCODE -ne 0) { throw 'Build failed.' } }
    & $taskNodePath --import tsx 'src\server\index.ts'
} finally { Pop-Location }
