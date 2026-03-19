# Usage: .\scripts\set-instructor.ps1 -Email your@email.com
param([Parameter(Mandatory)][string]$Email)

Write-Host "  Setting instructor: $Email" -ForegroundColor Cyan

$pass = ((Get-Content .env | Select-String "^POSTGRES_PASSWORD=") -split "=",2)[1].Trim()

$safeEmail = $Email.Replace("'", "''")

$sql = "UPDATE public.profiles SET role='instructor', updated_at=now() WHERE email='$safeEmail' RETURNING full_name, role;"
$result = $sql | docker compose exec -T -e PGPASSWORD=$pass postgres psql -U postgres -d postgres -t

if ($result -match "instructor") {
    Write-Host "  ✓ $Email is now an instructor" -ForegroundColor Green
    Write-Host "  $($result.Trim())" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Login at: http://localhost/auth/login" -ForegroundColor Cyan
} else {
    Write-Host "  ! User '$Email' not found in profiles table." -ForegroundColor Yellow
    Write-Host "  Make sure to register at /auth/register first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Existing users:" -ForegroundColor DarkGray
    "SELECT email, role FROM public.profiles ORDER BY created_at;" |
        docker compose exec -T -e PGPASSWORD=$pass postgres psql -U postgres -d postgres
}
