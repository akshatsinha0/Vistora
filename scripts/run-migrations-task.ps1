# Run Database Migrations as ECS Task

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Running Database Migrations" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Note: Set AWS credentials as environment variables before running:
# $env:AWS_ACCESS_KEY_ID="your-access-key"
# $env:AWS_SECRET_ACCESS_KEY="your-secret-key"
# $env:AWS_DEFAULT_REGION="us-east-1"

# Get stack outputs
Write-Host "Getting infrastructure details..." -ForegroundColor Cyan
$DBEndpoint = python -m awscli cloudformation describe-stacks --stack-name vistora-main-stack --query 'Stacks[0].Outputs[?OutputKey==``DBEndpoint``].OutputValue' --output text
$PrivateSubnet1 = python -m awscli cloudformation describe-stacks --stack-name vistora-main-stack --query 'Stacks[0].Outputs[?OutputKey==``PrivateSubnet1Id``].OutputValue' --output text 2>$null
$PrivateSubnet2 = python -m awscli cloudformation describe-stacks --stack-name vistora-main-stack --query 'Stacks[0].Outputs[?OutputKey==``PrivateSubnet2Id``].OutputValue' --output text 2>$null
$ECSSecurityGroup = python -m awscli cloudformation describe-stacks --stack-name vistora-main-stack --query 'Stacks[0].Outputs[?OutputKey==``ECSSecurityGroupId``].OutputValue' --output text 2>$null

# Get from nested stacks if not in main outputs
if ([string]::IsNullOrEmpty($PrivateSubnet1)) {
    Write-Host "Getting subnet IDs from network stack..." -ForegroundColor Yellow
    $NetworkStackId = python -m awscli cloudformation describe-stack-resources --stack-name vistora-main-stack --logical-resource-id NetworkStack --query 'StackResources[0].PhysicalResourceId' --output text
    $PrivateSubnet1 = python -m awscli cloudformation describe-stacks --stack-name $NetworkStackId --query 'Stacks[0].Outputs[?OutputKey==``PrivateSubnet1Id``].OutputValue' --output text
    $PrivateSubnet2 = python -m awscli cloudformation describe-stacks --stack-name $NetworkStackId --query 'Stacks[0].Outputs[?OutputKey==``PrivateSubnet2Id``].OutputValue' --output text
}

if ([string]::IsNullOrEmpty($ECSSecurityGroup)) {
    Write-Host "Getting security group from security stack..." -ForegroundColor Yellow
    $SecurityStackId = python -m awscli cloudformation describe-stack-resources --stack-name vistora-main-stack --logical-resource-id SecurityStack --query 'StackResources[0].PhysicalResourceId' --output text
    $ECSSecurityGroup = python -m awscli cloudformation describe-stacks --stack-name $SecurityStackId --query 'Stacks[0].Outputs[?OutputKey==``ECSSecurityGroupId``].OutputValue' --output text
}

Write-Host "DB Endpoint: $DBEndpoint" -ForegroundColor Yellow
Write-Host "Subnets: $PrivateSubnet1, $PrivateSubnet2" -ForegroundColor Yellow
Write-Host "Security Group: $ECSSecurityGroup" -ForegroundColor Yellow

# Create migration task definition
Write-Host "`nCreating migration task definition..." -ForegroundColor Cyan

$TaskDefJson = @"
{
  "family": "vistora-migration",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::781177225477:role/production-ecs-task-execution-role",
  "containerDefinitions": [
    {
      "name": "migration",
      "image": "781177225477.dkr.ecr.us-east-1.amazonaws.com/vistora-backend:d63af3e",
      "essential": true,
      "command": ["npm", "run", "migrate"],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://vistora_admin:ViStoraDB2025SecurePass!@${DBEndpoint}:5432/vistora"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/production/backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "migration"
        }
      }
    }
  ]
}
"@

$TaskDefJson | Out-File -FilePath "migration-task-def.json" -Encoding UTF8

Write-Host "Registering task definition..." -ForegroundColor Cyan
$TaskDefArn = python -m awscli ecs register-task-definition --cli-input-json file://migration-task-def.json --query 'taskDefinition.taskDefinitionArn' --output text

Write-Host "Task Definition: $TaskDefArn" -ForegroundColor Green

# Run the migration task
Write-Host "`nRunning migration task..." -ForegroundColor Cyan
$TaskArn = python -m awscli ecs run-task `
    --cluster production-cluster `
    --task-definition vistora-migration `
    --launch-type FARGATE `
    --network-configuration "awsvpcConfiguration={subnets=[$PrivateSubnet1,$PrivateSubnet2],securityGroups=[$ECSSecurityGroup],assignPublicIp=DISABLED}" `
    --query 'tasks[0].taskArn' `
    --output text

Write-Host "Migration task started: $TaskArn" -ForegroundColor Green

Write-Host "`nWaiting for task to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check task status
$TaskStatus = python -m awscli ecs describe-tasks --cluster production-cluster --tasks $TaskArn --query 'tasks[0].lastStatus' --output text
Write-Host "Task Status: $TaskStatus" -ForegroundColor Cyan

# Clean up
Remove-Item migration-task-def.json -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Migration task initiated!" -ForegroundColor Green
Write-Host "Check CloudWatch logs for details" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
