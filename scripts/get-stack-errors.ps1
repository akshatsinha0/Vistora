# Get CloudFormation Stack Errors
# Run this IMMEDIATELY when a stack fails to capture errors before rollback completes

param(
    [string]$StackName = "vistora-main-stack",
    [string]$Region = "us-east-1"
)

Write-Host "Capturing errors from stack: $StackName" -ForegroundColor Yellow
Write-Host ""

# Get main stack status
Write-Host "=== MAIN STACK STATUS ===" -ForegroundColor Cyan
$stackStatus = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].[StackStatus,StackStatusReason]" `
    --output table 2>$null

if ($LASTEXITCODE -eq 0) {
    $stackStatus
} else {
    Write-Host "Stack does not exist or has been deleted" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== ALL FAILED RESOURCES ===" -ForegroundColor Cyan
aws cloudformation describe-stack-events `
    --stack-name $StackName `
    --region $Region `
    --query "StackEvents[?contains(ResourceStatus,'FAILED')].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]" `
    --output table

Write-Host ""
Write-Host "=== NESTED STACKS ===" -ForegroundColor Cyan
$nestedStacks = aws cloudformation describe-stack-resources `
    --stack-name $StackName `
    --region $Region `
    --query "StackResources[?ResourceType=='AWS::CloudFormation::Stack'].[LogicalResourceId,PhysicalResourceId,ResourceStatus]" `
    --output json 2>$null | ConvertFrom-Json

if ($nestedStacks) {
    foreach ($nested in $nestedStacks) {
        $nestedName = $nested[0]
        $nestedId = $nested[1]
        $nestedStatus = $nested[2]
        
        Write-Host ""
        Write-Host "--- Nested Stack: $nestedName (Status: $nestedStatus) ---" -ForegroundColor Yellow
        
        if ($nestedId) {
            # Try to get events from nested stack
            $nestedEvents = aws cloudformation describe-stack-events `
                --stack-name $nestedId `
                --region $Region `
                --query "StackEvents[?contains(ResourceStatus,'FAILED')].[Timestamp,LogicalResourceId,ResourceStatusReason]" `
                --output table 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                $nestedEvents
            } else {
                Write-Host "Nested stack already deleted or inaccessible" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "No nested stacks found or already deleted" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== RECENT EVENTS (Last 20) ===" -ForegroundColor Cyan
aws cloudformation describe-stack-events `
    --stack-name $StackName `
    --region $Region `
    --query "StackEvents[0:20].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]" `
    --output table

Write-Host ""
Write-Host "Error capture complete!" -ForegroundColor Green
Write-Host "Save this output for debugging." -ForegroundColor Yellow
