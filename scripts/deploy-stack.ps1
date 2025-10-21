# Deploy Vistora CloudFormation Stack

Write-Host "Deploying Vistora CloudFormation Stack..." -ForegroundColor Green

# Parameters
$StackName = "vistora-main-stack"
$Region = "us-east-1"
$TemplateURL = "https://vistora-cloudformation-templates-781177225477.s3.amazonaws.com/main-stack.yaml"
$BackendImageUri = "781177225477.dkr.ecr.us-east-1.amazonaws.com/vistora-backend:latest"
$FrontendImageUri = "781177225477.dkr.ecr.us-east-1.amazonaws.com/vistora-frontend:latest"
$DBPassword = "ViStoraDB2025SecurePass!"
$AlertEmail = "admin@example.com"

Write-Host "Stack Parameters:" -ForegroundColor Yellow
Write-Host "  Stack Name: $StackName"
Write-Host "  Region: $Region"
Write-Host "  Backend Image: $BackendImageUri"
Write-Host "  Frontend Image: $FrontendImageUri"
Write-Host ""

# Deploy stack
Write-Host "Creating CloudFormation stack..." -ForegroundColor Green
aws cloudformation create-stack `
    --stack-name $StackName `
    --template-url $TemplateURL `
    --parameters `
        ParameterKey=EnvironmentName,ParameterValue=production `
        ParameterKey=DBPassword,ParameterValue=$DBPassword `
        ParameterKey=BackendImageUri,ParameterValue=$BackendImageUri `
        ParameterKey=FrontendImageUri,ParameterValue=$FrontendImageUri `
        ParameterKey=AlertEmail,ParameterValue=$AlertEmail `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
    --tags Key=Project,Value=Vistora `
    --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "Stack creation initiated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for stack creation to complete (this may take 15-20 minutes)..." -ForegroundColor Yellow
    
    aws cloudformation wait stack-create-complete `
        --stack-name $StackName `
        --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Stack created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Getting stack outputs..." -ForegroundColor Green
        aws cloudformation describe-stacks `
            --stack-name $StackName `
            --region $Region `
            --query "Stacks[0].Outputs"
    } else {
        Write-Host "Stack creation failed or timed out" -ForegroundColor Red
        Write-Host "Check AWS Console for details"
    }
} else {
    Write-Host "Failed to initiate stack creation" -ForegroundColor Red
}
