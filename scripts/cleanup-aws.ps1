# Cleanup AWS Resources for Vistora

Write-Host "AWS Cleanup Script for Vistora" -ForegroundColor Red
Write-Host "This will delete ALL AWS resources and stop billing" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Are you sure you want to delete all resources? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Cleanup cancelled" -ForegroundColor Yellow
    exit
}

$Region = "us-east-1"
$StackName = "vistora-main-stack"
$S3Bucket = "vistora-cloudformation-templates-781177225477"

# Delete CloudFormation Stack
Write-Host ""
Write-Host "Deleting CloudFormation stack..." -ForegroundColor Yellow
aws cloudformation delete-stack --stack-name $StackName --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "Stack deletion initiated" -ForegroundColor Green
    Write-Host "Waiting for stack deletion to complete..." -ForegroundColor Yellow
    
    aws cloudformation wait stack-delete-complete --stack-name $StackName --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Stack deleted successfully!" -ForegroundColor Green
    } else {
        Write-Host "Stack deletion may have failed. Check AWS Console" -ForegroundColor Red
    }
} else {
    Write-Host "Failed to initiate stack deletion" -ForegroundColor Red
}

# Delete ECR Images
Write-Host ""
Write-Host "Deleting ECR images..." -ForegroundColor Yellow

$backendImages = aws ecr list-images --repository-name vistora-backend --region $Region --query 'imageIds[*]' --output json 2>$null
if ($backendImages) {
    aws ecr batch-delete-image --repository-name vistora-backend --image-ids $backendImages --region $Region 2>$null
    Write-Host "Backend images deleted" -ForegroundColor Green
}

$frontendImages = aws ecr list-images --repository-name vistora-frontend --region $Region --query 'imageIds[*]' --output json 2>$null
if ($frontendImages) {
    aws ecr batch-delete-image --repository-name vistora-frontend --image-ids $frontendImages --region $Region 2>$null
    Write-Host "Frontend images deleted" -ForegroundColor Green
}

# Delete ECR Repositories
Write-Host ""
Write-Host "Deleting ECR repositories..." -ForegroundColor Yellow
aws ecr delete-repository --repository-name vistora-backend --force --region $Region 2>$null
aws ecr delete-repository --repository-name vistora-frontend --force --region $Region 2>$null
Write-Host "ECR repositories deleted" -ForegroundColor Green

# Delete Secrets Manager Secrets
Write-Host ""
Write-Host "Deleting Secrets Manager secrets..." -ForegroundColor Yellow
aws secretsmanager delete-secret --secret-id vistora/jwt --force-delete-without-recovery --region $Region 2>$null
aws secretsmanager delete-secret --secret-id vistora/database --force-delete-without-recovery --region $Region 2>$null
aws secretsmanager delete-secret --secret-id vistora/redis --force-delete-without-recovery --region $Region 2>$null
Write-Host "Secrets deleted" -ForegroundColor Green

# Empty and Delete S3 Bucket
Write-Host ""
Write-Host "Emptying and deleting S3 bucket..." -ForegroundColor Yellow
aws s3 rm s3://$S3Bucket --recursive --region $Region 2>$null
aws s3 rb s3://$S3Bucket --region $Region 2>$null
Write-Host "S3 bucket deleted" -ForegroundColor Green

Write-Host ""
Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host "All AWS resources have been deleted and billing has stopped" -ForegroundColor Green
