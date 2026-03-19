# scripts/backup.ps1
param([string]$Dir = ".\backups", [int]$Keep = 30)
New-Item -Force -ItemType Directory $Dir | Out-Null
$ts   = Get-Date -Format "yyyyMMdd_HHmmss"
$file = Join-Path $Dir "da40_$ts.sql"
$gz   = "$file.gz"
$pass = ((Get-Content .env | Select-String "^POSTGRES_PASSWORD=") -split "=",2)[1].Trim()

Write-Host "  Backing up..." -ForegroundColor Cyan
docker compose exec -T -e PGPASSWORD=$pass postgres pg_dump -U postgres -d postgres | Out-File -Encoding utf8 $file

$s = [IO.File]::OpenRead($file)
$d = [IO.File]::Create($gz)
$z = New-Object IO.Compression.GZipStream($d,[IO.Compression.CompressionMode]::Compress)
$s.CopyTo($z); $z.Dispose(); $d.Dispose(); $s.Dispose()
Remove-Item $file

$kb = [math]::Round((Get-Item $gz).Length/1KB)
Write-Host "  ✓ $gz ($kb KB)" -ForegroundColor Green

Get-ChildItem $Dir "da40_*.sql.gz" | Sort-Object LastWriteTime -Descending | Select-Object -Skip $Keep | Remove-Item
