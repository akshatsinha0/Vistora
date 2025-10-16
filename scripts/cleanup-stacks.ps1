# Cleanup Vistora CloudFormation Stacks

Write-Host "🧹 Cleaning up Vistora CloudFormation Stacks..." -ForegroundColor Yellow

# Parameters
$Region = "us-east-1"

# Function to delete RDS instances
function Remove-RDSInstances {
    Write-Host "`n📊 Checking for RDS instances..." -ForegroundColor Cyan
    $rdsInstances = aws rds describe-db-instances `
        --query 'DBInstances[?contains(DBInstanceIdentifier, `vistora`)].DBInstanceIdentifier' `
        --output text `
        --region $Region
    
    if ($rdsInstances) {
        $instances = $rdsInstances -split '\s+'
        foreach ($instance in $instances) {
            Write-Host "  Deleting RDS instance: $instance" -ForegroundColor Yellow
            aws rds delete-db-instance `
                --db-instance-identifier $instance `
                --skip-final-snapshot `
                --region $Region
        }
    } else {
        Write-Host "  No RDS instances found" -ForegroundColor Green
    }
}

# Function to delete ElastiCache clusters
function Remove-ElastiCacheClusters {
    Write-Host "`n🔴 Checking for ElastiCache clusters..." -ForegroundColor Cyan
    $cacheClusters = aws elasticache describe-cache-clusters `
        --query 'CacheClusters[?contains(CacheClusterId, `vistora`)].CacheClusterId' `
        --output text `
        --region $Region
    
    if ($cacheClusters) {
        $clusters = $cacheClusters -split '\s+'
        foreach ($cluster in $clusters) {
            Write-Host "  Deleting ElastiCache cluster: $cluster" -ForegroundColor Yellow
            aws elasticache delete-cache-cluster `
                --cache-cluster-id $cluster `
                --region $Region
        }
    } else {
        Write-Host "  No ElastiCache clusters found" -ForegroundColor Green
    }
}

# Function to delete CloudFormation stacks
function Remove-CloudFormationStacks {
    Write-Host "`n☁️  Checking for CloudFormation stacks..." -ForegroundColor Cyan
    $stacks = aws cloudformation list-stacks `
        --stack-status-filter CREATE_COMPLETE CREATE_IN_PROGRESS UPDATE_COMPLETE UPDATE_IN_PROGRESS ROLLBACK_COMPLETE ROLLBACK_IN_PROGRESS CREATE_FAILED UPDATE_FAILED DELETE_FAILED `
        --query 'StackSummaries[?contains(StackName, `vistora`)].StackName' `
        --output text `
        --region $Region
    
    if ($stacks) {
        $stackList = $stacks -split '\s+'
        
        # Delete nested stacks first
        $nestedStacks = $stackList | Where-Object { $_ -match 'vistora-main-stack-' -and $_ -ne 'vistora-main-stack' }
        foreach ($stack in $nestedStacks) {
            Write-Host "  Deleting nested stack: $stack" -ForegroundColor Yellow
            aws cloudformation delete-stack --stack-name $stack --region $Region
        }
        
        # Wait a bit for nested stacks to start deleting
        Start-Sleep -Seconds 5
        
        # Delete main stack
        $mainStack = $stackList | Where-Object { $_ -eq 'vistora-main-stack' }
        if ($mainStack) {
            Write-Host "  Deleting main stack: $mainStack" -ForegroundColor Yellow
            aws cloudformation delete-stack --stack-name $mainStack --region $Region
        }
    } else {
        Write-Host "  No CloudFormation stacks found" -ForegroundColor Green
    }
}

# Execute cleanup
Remove-RDSInstances
Remove-ElastiCacheClusters
Remove-CloudFormationStacks

Write-Host "`n✅ Cleanup initiated!" -ForegroundColor Green
Write-Host "Note: Resources may take several minutes to fully delete." -ForegroundColor Yellow
Write-Host "`nTo check status, run:" -ForegroundColor Cyan
Write-Host "  aws cloudformation list-stacks --stack-status-filter DELETE_IN_PROGRESS --region $Region" -ForegroundColor White
