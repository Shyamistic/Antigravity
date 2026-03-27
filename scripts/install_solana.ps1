# Force TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$url = "https://release.solana.com/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe"
$outPath = "$env:TEMP\solana-install-init.exe"

Write-Host "Attempting to download Solana installer from $url..."

try {
    Invoke-WebRequest -Uri $url -OutFile $outPath -ErrorAction Stop
    Write-Host "Download successful. Running installer..."
    & $outPath v1.18.4
    Write-Host "Installation command executed. Please RESTART your terminal to use 'solana'."
} catch {
    Write-Error "Failed to download Solana installer: $_"
    exit 1
}
