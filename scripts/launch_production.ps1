# Antigravity Production Suite Launch Script

Write-Host "--- Antigravity Institutional Liquidity Orchestrator ---" -ForegroundColor Cyan

# 0. Cleanup existing processes
Write-Host "[0/3] Cleaning up old processes..." -ForegroundColor Gray
$ports = @(3001, 3002, 5173)
foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processes) { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }
}

# 1. Start Compliance Gateway (Port 3001)
Write-Host "[1/3] Starting Compliance Gateway..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd app\compliance-gateway; npm run dev" -WindowStyle Normal

# 2. Start SDP Payment Bridge (Port 3002)
Write-Host "[2/3] Starting SDP Payment Bridge..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd app\sdp-bridge; npm run dev" -WindowStyle Normal

# 3. Start Institutional Dashboard (Port 5173 / Vite)
Write-Host "[3/3] Starting Institutional Dashboard..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd app\dashboard; npm run dev" -WindowStyle Normal

Write-Host "--- ALL SERVICES INITIATED ---" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:5173"
Write-Host "Compliance API: http://localhost:3001"
Write-Host "SDP Bridge API: http://localhost:3002"
Write-Host "Press Ctrl+C to exit this script (this will not close the sub-windows)."
