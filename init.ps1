Get-Content ".env" | foreach-object -begin {$settings=@{}} -process { $value = [regex]::split($_,'='); if(($value[0].CompareTo("") -ne 0) -and ($value[0].StartsWith("[") -ne $True)) { $settings.Add($value[0], $value[1]) } }

# Creating required SSL certificates
Write-Host "Creating required certificate..." -ForegroundColor Green
Push-Location .\.docker\traefik\certs
mkcert $settings.HOSTNAME
Pop-Location

# Build all containers in the Sitecore instance, forcing a pull of latest base containers
Write-Host "Building containers..." -ForegroundColor Green
#docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Container build failed, see errors above."
}

# Start the Sitecore instance
Write-Host "Starting Sitecore environment..." -ForegroundColor Green
docker-compose up -d
