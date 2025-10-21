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
    Write-Host "Monitoring stack creation (this may take 15-20 minutes)..." -ForegroundColor Yellow
    Write-Host "Watching for errors in real-time..." -ForegroundColor Cyan
    Write-Host ""
    
    # Monitor stack events in real-time
    $lastEventTime = (Get-Date).ToUniversalTime().AddSeconds(-5).ToString("yyyy-MM-ddTHH:mm:ss")
    $stackComplete = $false
    $failureDetected = $false
    
    while (-not $stackComplete) {
        Start-Sleep -Seconds 10
        
        # Get latest events
        $events = aws cloudformation describe-stack-events `
            --stack-name $StackName `
            --region $Region `
            --query "StackEvents[?Timestamp>'$lastEventTime'].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]" `
            --output json | ConvertFrom-Json
        
        if ($events) {
            foreach ($event in $events) {
                $timestamp = $event[0]
                $resource = $event[1]
                $status = $event[2]
                $reason = $event[3]
                
                # Update last event time
                if ($timestamp -gt $lastEventTime) {
                    $lastEventTime = $timestamp
                }
                
                # Print event
                if ($status -like "*FAILED*") {
                    Write-Host "❌ FAILED: $resource - $reason" -ForegroundColor Red
                    $failureDetected = $true
                } elseif ($status -like "*COMPLETE*") {
                    Write-Host "✅ $status: $resource" -ForegroundColor Green
                } elseif ($status -like "*IN_PROGRESS*") {
                    Write-Host "⏳ $status: $resource" -ForegroundColor Yellow
                } else {
                    Write-Host "   $status: $resource" -ForegroundColor Gray
                }
            }
        }
        
        # Check stack status
        $stackStatus = aws cloudformation describe-stacks `
            --stack-name $StackName `
            --region $Region `
            --query "Stacks[0].StackStatus" `
            --output text 2>$null
        
        if ($stackStatus -eq "CREATE_COMPLETE") {
            $stackComplete = $true
            Write-Host ""
            Write-Host "✅ Stack created successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Getting stack outputs..." -ForegroundColor Green
            aws cloudformation describe-stacks `
                --stack-name $StackName `
                --region $Region `
                --query "Stacks[0].Outputs"
        } elseif ($stackStatus -like "*ROLLBACK*" -or $stackStatus -like "*FAILED*") {
            $stackComplete = $true
            Write-Host ""
            Write-Host "❌ Stack creation FAILED!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Failure Summary:" -ForegroundColor Yellow
            
            # Get all failed resources
            aws cloudformation describe-stack-events `
                --stack-name $StackName `
                --region $Region `
                --query "StackEvents[?contains(ResourceStatus,'FAILED')].[LogicalResourceId,ResourceStatusReason]" `
                --output table
            
            Write-Host ""
            Write-Host "Stack Status: $stackStatus" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Failed to initiate stack creation" -ForegroundColor Red
}
