# Setup AWS CLI on Windows

Write-Host "Setting up AWS CLI..." -ForegroundColor Green

# Check if AWS CLI is already installed
$awsInstalled = Get-Command aws -ErrorAction SilentlyContinue

if ($awsInstalled) {
    Write-Host "AWS CLI is already installed" -ForegroundColor Yellow
    aws --version
} else {
    Write-Host "AWS CLI is not installed. Installing..." -ForegroundColor Yellow
    
    # Download AWS CLI installer
    $installerUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $installerPath = "$env:TEMP\AWSCLIV2.msi"
    
    Write-Host "Downloading AWS CLI installer..."
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
    
    Write-Host "Installing AWS CLI..."
    Start-Process msiexec.exe -ArgumentList "/i $installerPath /quiet /norestart" -Wait
    
    Write-Host "AWS CLI installed successfully" -ForegroundColor Green
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verify installation
    aws --version
}

# Configure AWS CLI
Write-Host "`nConfiguring AWS CLI..." -ForegroundColor Green

# Prompt for AWS credentials
$accessKey = Read-Host "Enter AWS Access Key ID"
$secretKey = Read-Host "Enter AWS Secret Access Key" -AsSecureString
$secretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))
$region = "us-east-1"

aws configure set aws_access_key_id $accessKey
aws configure set aws_secret_access_key $secretKeyPlain
aws configure set default.region $region
aws configure set default.output json

Write-Host "AWS CLI configured successfully" -ForegroundColor Green

# Verify configuration
Write-Host "`nVerifying AWS CLI configuration..." -ForegroundColor Green
aws sts get-caller-identity

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAWS CLI setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nAWS CLI configuration verification failed" -ForegroundColor Red
}
