# Antigravity v3.0: Institutional Suite Bootstrapper
Write-Host "🌌 INITIALIZING ANTIGRAVITY v3.0..." -ForegroundColor Cyan

# Check if node_modules exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "app/compliance-gateway/node_modules")) {
    Write-Host "📦 Installing gateway dependencies..." -ForegroundColor Yellow
    cd app/compliance-gateway; npm install; cd ../..
}

if (-not (Test-Path "app/dashboard/node_modules")) {
    Write-Host "📦 Installing dashboard dependencies..." -ForegroundColor Yellow
    cd app/dashboard; npm install; cd ../..
}

Write-Host "🚀 STARTING COMPLIANCE GATEWAY (Port 3001) & DASHBOARD (Port 5173)..." -ForegroundColor Green
npx concurrently "cd app/compliance-gateway; npm start" "cd app/dashboard; npm run dev"
