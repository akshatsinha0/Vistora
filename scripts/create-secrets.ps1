# Create AWS Secrets Manager secrets for Vistora

Write-Host "Creating AWS Secrets Manager secrets..." -ForegroundColor Green

# Generate random JWT secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Create JWT secret
Write-Host "Creating JWT secret..."
$jwtSecretJson = @{
    secret = $jwtSecret
} | ConvertTo-Json

aws secretsmanager create-secret `
    --name vistora/jwt `
    --description "JWT secret for Vistora application" `
    --secret-string $jwtSecretJson `
    --tags Key=Project,Value=Vistora `
    --region us-east-1

if ($LASTEXITCODE -eq 0) {
    Write-Host "JWT secret created successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to create JWT secret" -ForegroundColor Red
}

Write-Host "`nSecrets creation completed!" -ForegroundColor Green
Write-Host "Note: Database credentials will be created by CloudFormation stack" -ForegroundColor Yellow
