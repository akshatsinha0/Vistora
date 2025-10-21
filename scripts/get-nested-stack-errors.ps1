# Get detailed errors from nested stacks
param(
    [string]$StackName = "vistora-main-stack"
)

Write-Host "=== Fetching Nested Stack Errors ===" -ForegroundColor Cyan
Write-Host ""

# Get the main stack resources to find nested stacks
Write-Host "Finding nested stacks..." -ForegroundColor Yellow
$resources = aws cloudformation describe-stack-resources --stack-name $StackName --output json | ConvertFrom-Json

$nestedStacks = $resources.StackResources | Where-Object { $_.ResourceType -eq "AWS::CloudFormation::Stack" }

if ($nestedStacks.Count -eq 0) {
    Write-Host "No nested stacks found" -ForegroundColor Red
    exit 1
}

foreach ($nested in $nestedStacks) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Nested Stack: $($nested.LogicalResourceId)" -ForegroundColor Cyan
    Write-Host "Physical ID: $($nested.PhysicalResourceId)" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Extract the nested stack name from the ARN
    $nestedStackName = $nested.PhysicalResourceId -replace ".*stack/([^/]+)/.*", '$1'
    
    # Get events from the nested stack
    Write-Host "Fetching events for nested stack: $nestedStackName" -ForegroundColor Yellow
    
    try {
        $events = aws cloudformation describe-stack-events --stack-name $nestedStackName --output json | ConvertFrom-Json
        
        # Filter for failed events
        $failedEvents = $events.StackEvents | Where-Object { 
            $_.ResourceStatus -like "*FAILED*" -or 
            $_.ResourceStatus -eq "CREATE_FAILED" -or
            $_.ResourceStatus -eq "UPDATE_FAILED"
        }
        
        if ($failedEvents.Count -gt 0) {
            Write-Host ""
            Write-Host "❌ FAILED RESOURCES:" -ForegroundColor Red
            Write-Host ""
            
            foreach ($event in $failedEvents) {
                Write-Host "Resource: $($event.LogicalResourceId)" -ForegroundColor Red
                Write-Host "Type: $($event.ResourceType)" -ForegroundColor Gray
                Write-Host "Status: $($event.ResourceStatus)" -ForegroundColor Red
                Write-Host "Reason: $($event.ResourceStatusReason)" -ForegroundColor Yellow
                Write-Host "Time: $($event.Timestamp)" -ForegroundColor Gray
                Write-Host "---" -ForegroundColor Gray
                Write-Host ""
            }
        } else {
            Write-Host "No failed events found in this nested stack" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "Error fetching events for $nestedStackName : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
