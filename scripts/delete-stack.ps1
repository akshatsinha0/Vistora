# Delete CloudFormation Stack and Associated Resources
# This script deletes the Vistora CloudFormation stack and all associated AWS resources

param(
    [Parameter(Mandatory=$false)]
    [string]$StackName = "vistora-main-stack",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vistora Stack Deletion Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Confirmation prompt
if (-not $Force) {
    Write-Host "WARNING: This will delete the following resources:" -ForegroundColor Yellow
    Write-Host "  - CloudFormation stack: $StackName" -ForegroundColor Yellow
    Write-Host "  - All nested stacks (network, security, database, cache, compute, monitoring)" -ForegroundColor Yellow
    Write-Host "  - ECR repositories and images" -ForegroundColor Yellow
    Write-Host "  - Secrets Manager secrets" -ForegroundColor Yellow
    Write-Host "  - S3 bucket (if exists)" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Are you sure you want to proceed? (yes/no)"
    
    if ($confirmation -ne "yes") {
        Write-Host "Deletion cancelled." -ForegroundColor Green
        exit 0
    }
}

Write-Host ""
Write-Host "Starting deletion process..." -ForegroundColor Green
Write-Host ""

# Function to check if AWS CLI is installed
function Test-AwsCli {
    try {
        $null = aws --version
        return $true
    } catch {
        Write-Host "ERROR: AWS CLI is not installed or not in PATH" -ForegroundColor Red
        return $false
    }
}

# Function to empty S3 bucket
function Remove-S3BucketContents {
    param([string]$BucketName)
    
    Write-Host "Checking S3 bucket: $BucketName..." -ForegroundColor Cyan
    
    $bucketExists = aws s3 ls "s3://$BucketName" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Emptying S3 bucket: $BucketName..." -ForegroundColor Yellow
        aws s3 rm "s3://$BucketName" --recursive --region $Region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ S3 bucket emptied successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to empty S3 bucket" -ForegroundColor Red
        }
    } else {
        Write-Host "S3 bucket does not exist or is already empty" -ForegroundColor Gray
    }
}

# Function to delete ECR repositories
function Remove-EcrRepositories {
    Write-Host "Deleting ECR repositories..." -ForegroundColor Cyan
    
    $repositories = @("vistora-backend", "vistora-frontend")
    
    foreach ($repo in $repositories) {
        Write-Host "  Checking repository: $repo..." -ForegroundColor Yellow
        
        $repoExists = aws ecr describe-repositories --repository-names $repo --region $Region 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Deleting repository: $repo..." -ForegroundColor Yellow
            aws ecr delete-repository --repository-name $repo --force --region $Region
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Repository $repo deleted" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Failed to delete repository $repo" -ForegroundColor Red
            }
        } else {
            Write-Host "  Repository $repo does not exist" -ForegroundColor Gray
        }
    }
}

# Function to delete Secrets Manager secrets
function Remove-SecretsManagerSecrets {
    Write-Host "Deleting Secrets Manager secrets..." -ForegroundColor Cyan
    
    $secrets = @(
        "vistora/database",
        "vistora/redis",
        "vistora/jwt"
    )
    
    foreach ($secret in $secrets) {
        Write-Host "  Checking secret: $secret..." -ForegroundColor Yellow
        
        $secretExists = aws secretsmanager describe-secret --secret-id $secret --region $Region 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Deleting secret: $secret..." -ForegroundColor Yellow
            aws secretsmanager delete-secret --secret-id $secret --force-delete-without-recovery --region $Region
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Secret $secret deleted" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Failed to delete secret $secret" -ForegroundColor Red
            }
        } else {
            Write-Host "  Secret $secret does not exist" -ForegroundColor Gray
        }
    }
}

# Function to delete CloudFormation stack
function Remove-CloudFormationStack {
    param([string]$Stack)
    
    Write-Host "Deleting CloudFormation stack: $Stack..." -ForegroundColor Cyan
    
    $stackExists = aws cloudformation describe-stacks --stack-name $Stack --region $Region 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Initiating stack deletion..." -ForegroundColor Yellow
        aws cloudformation delete-stack --stack-name $Stack --region $Region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Stack deletion initiated. Waiting for completion..." -ForegroundColor Yellow
            Write-Host "(This may take 10-15 minutes)" -ForegroundColor Gray
            
            aws cloudformation wait stack-delete-complete --stack-name $Stack --region $Region
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Stack deleted successfully" -ForegroundColor Green
            } else {
                Write-Host "✗ Stack deletion failed or timed out" -ForegroundColor Red
                Write-Host "Check AWS Console for details" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✗ Failed to initiate stack deletion" -ForegroundColor Red
        }
    } else {
        Write-Host "Stack does not exist" -ForegroundColor Gray
    }
}

# Main execution
try {
    # Check AWS CLI
    if (-not (Test-AwsCli)) {
        exit 1
    }
    
    # Step 1: Empty S3 bucket (if exists)
    Write-Host ""
    Write-Host "Step 1: Checking S3 buckets..." -ForegroundColor Cyan
    Remove-S3BucketContents -BucketName "vistora-cloudformation-templates"
    
    # Step 2: Delete CloudFormation stack
    Write-Host ""
    Write-Host "Step 2: Deleting CloudFormation stack..." -ForegroundColor Cyan
    Remove-CloudFormationStack -Stack $StackName
    
    # Step 3: Delete ECR repositories
    Write-Host ""
    Write-Host "Step 3: Deleting ECR repositories..." -ForegroundColor Cyan
    Remove-EcrRepositories
    
    # Step 4: Delete Secrets Manager secrets
    Write-Host ""
    Write-Host "Step 4: Deleting Secrets Manager secrets..." -ForegroundColor Cyan
    Remove-SecretsManagerSecrets
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Deletion process completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Note: Some resources may take additional time to fully delete." -ForegroundColor Yellow
    Write-Host "Check the AWS Console to verify all resources are removed." -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "ERROR: An unexpected error occurred" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
