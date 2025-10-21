# Deploy with Enhanced Logging and Error Capture

$StackName = "vistora-main-stack"
$Region = "us-east-1"
$TemplateURL = "https://vistora-cloudformation-templates-781177225477.s3.amazonaws.com/main-stack.yaml"
$BackendImageUri = "781177225477.dkr.ecr.us-east-1.amazonaws.com/vistora-backend:latest"
$FrontendImageUri = "781177225477.dkr.ecr.us-east-1.amazonaws.com/vistora-frontend:latest"
$DBPassword = "ViStoraDB2025SecurePass!"
$AlertEmail = "admin@example.com"
$LogFile = "stack-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

Write-Host "=== Vistora Stack Deployment with Enhanced Logging ===" -ForegroundColor Cyan
Write-Host "Log file: $LogFile" -ForegroundColor Yellow
Write-Host ""

# Start logging
Start-Transcript -Path $LogFile

Write-Host "Step 1: Verify Docker images exist in ECR..." -ForegroundColor Cyan
$backendImage = aws ecr describe-images --repository-name vistora-backend --region $Region --image-ids imageTag=latest 2>&1
$frontendImage = aws ecr describe-images --repository-name vistora-frontend --region $Region --image-ids imageTag=latest 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Docker images not found in ECR!" -ForegroundColor Red
    Write-Host "Backend check: $backendImage" -ForegroundColor Red
    Write-Host "Frontend check: $frontendImage" -ForegroundColor Red
    Write-Host ""
    Write-Host "You must build and push images first:" -ForegroundColor Yellow
    Write-Host "  1. cd backend && docker build -t vistora-backend:latest ." -ForegroundColor White
    Write-Host "  2. docker tag vistora-backend:latest $BackendImageUri" -ForegroundColor White
    Write-Host "  3. docker push $BackendImageUri" -ForegroundColor White
    Write-Host "  (Repeat for frontend)" -ForegroundColor White
    Stop-Transcript
    exit 1
}

Write-Host "<<----.---->> Docker images found in ECR" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Check if IAM roles exist..." -ForegroundColor Cyan
$existingRoles = aws iam list-roles --query 'Roles[?contains(RoleName,`production-ecs-task`)].[RoleName]' --output text
if ($existingRoles) {
    Write-Host "⚠️  WARNING: IAM roles already exist from previous deployment:" -ForegroundColor Yellow
    Write-Host $existingRoles
    Write-Host "This might cause conflicts. Consider deleting them first." -ForegroundColor Yellow
} else {
    Write-Host "<<----.---->> No conflicting IAM roles found" -ForegroundColor Green
}
Write-Host ""

Write-Host "Step 3: Creating CloudFormation stack..." -ForegroundColor Cyan
Write-Host "Note: Rollback disabled for error inspection" -ForegroundColor Yellow
$createOutput = aws cloudformation create-stack `
    --stack-name $StackName `
    --template-url $TemplateURL `
    --disable-rollback `
    --parameters `
        "ParameterKey=EnvironmentName,ParameterValue=production" `
        "ParameterKey=DBPassword,ParameterValue=$DBPassword" `
        "ParameterKey=BackendImageUri,ParameterValue=$BackendImageUri" `
        "ParameterKey=FrontendImageUri,ParameterValue=$FrontendImageUri" `
        "ParameterKey=AlertEmail,ParameterValue=$AlertEmail" `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
    --tags Key=Project,Value=Vistora `
    --region $Region 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create stack!" -ForegroundColor Red
    Write-Host $createOutput
    Stop-Transcript
    exit 1
}

Write-Host "<<----.---->> Stack creation initiated" -ForegroundColor Green
Write-Host $createOutput
Write-Host ""

Write-Host "Step 4: Monitoring stack creation in real-time..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop monitoring (stack will continue deploying)" -ForegroundColor Yellow
Write-Host ""

$lastEventTime = (Get-Date).ToUniversalTime().AddSeconds(-5).ToString("yyyy-MM-ddTHH:mm:ss")
$stackComplete = $false
$errorCount = 0

while (-not $stackComplete) {
    Start-Sleep -Seconds 5
    
    # Get stack status
    $stackStatus = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query "Stacks[0].StackStatus" `
        --output text 2>$null
    
    if (-not $stackStatus) {
        Write-Host "⚠️  Stack not found or deleted" -ForegroundColor Yellow
        break
    }
    
    # Get new events (get all and filter in PowerShell to avoid redirect issues)
    $allEventsJson = aws cloudformation describe-stack-events --stack-name $StackName --region $Region --output json 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $allEventsJson) {
        $allEvents = $allEventsJson | ConvertFrom-Json
        $events = $allEvents.StackEvents | Where-Object { $_.Timestamp -gt $lastEventTime }
    } else {
        $events = $null
    }
    
    if ($events) {
        # Sort by timestamp (oldest first)
        $events = $events | Sort-Object -Property Timestamp
        
        foreach ($event in $events) {
            $timestamp = $event.Timestamp
            $resource = $event.LogicalResourceId
            $status = $event.ResourceStatus
            $reason = $event.ResourceStatusReason
            
            # Update last event time
            if ($timestamp -gt $lastEventTime) {
                $lastEventTime = $timestamp
            }
            
            # Format and print event
            $timeStr = ([DateTime]$timestamp).ToString("HH:mm:ss")
            
            if ($status -like "*FAILED*") {
                Write-Host "[$timeStr] ❌ $resource - $status" -ForegroundColor Red
                if ($reason) {
                    Write-Host "          Reason: $reason" -ForegroundColor Red
                }
                $errorCount++
            } elseif ($status -eq "CREATE_COMPLETE") {
                Write-Host "[$timeStr] <<----.---->> $resource" -ForegroundColor Green
            } elseif ($status -eq "CREATE_IN_PROGRESS") {
                Write-Host "[$timeStr] ⏳ $resource" -ForegroundColor Cyan
            } elseif ($status -like "*ROLLBACK*") {
                Write-Host "[$timeStr] 🔄 $resource - $status" -ForegroundColor Yellow
            } else {
                Write-Host "[$timeStr]    $resource - $status" -ForegroundColor Gray
            }
        }
    }
    
    # Check if stack is complete
    if ($stackStatus -eq "CREATE_COMPLETE") {
        $stackComplete = $true
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "<<----.---->> STACK CREATED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        # Get outputs
        Write-Host "Stack Outputs:" -ForegroundColor Cyan
        aws cloudformation describe-stacks `
            --stack-name $StackName `
            --region $Region `
            --query "Stacks[0].Outputs" `
            --output table
            
    } elseif ($stackStatus -like "*ROLLBACK*" -or $stackStatus -like "*FAILED*") {
        $stackComplete = $true
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "❌ STACK CREATION FAILED!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Final Status: $stackStatus" -ForegroundColor Red
        Write-Host "Total Errors: $errorCount" -ForegroundColor Red
        Write-Host ""
        
        Write-Host "All Failed Resources:" -ForegroundColor Yellow
        aws cloudformation describe-stack-events `
            --stack-name $StackName `
            --region $Region `
            --query "StackEvents[?contains(ResourceStatus,'FAILED')].[Timestamp,LogicalResourceId,ResourceStatusReason]" `
            --output table
    }
}

Stop-Transcript

Write-Host ""
Write-Host "Full log saved to: $LogFile" -ForegroundColor Cyan
Write-Host ""

if ($stackStatus -like "*FAILED*" -or $stackStatus -like "*ROLLBACK*") {
    exit 1
}
