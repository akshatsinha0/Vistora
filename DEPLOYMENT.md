# Vistora SaaS Application - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Docker Desktop installed and running
- AWS CLI installed and configured
- Git installed
- PowerShell 5.1 or higher

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/akshatsinha0/Vistora.git
cd Vistora
```

### 2. Run with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- Backend API on port 8080
- Frontend on port 3000 (if configured)

### 3. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Health Check: http://localhost:8080/health

## AWS Deployment

### Step 1: Install and Configure AWS CLI

1. Run the setup script:
```powershell
./scripts/setup-aws-cli.ps1
```

2. Restart your terminal/PowerShell

3. Verify AWS CLI installation:
```powershell
aws --version
aws sts get-caller-identity
```

### Step 2: Create AWS Secrets

```powershell
./scripts/create-secrets.ps1
```

### Step 3: Create ECR Repositories

```powershell
# Create backend repository
aws ecr create-repository --repository-name vistora-backend --image-scanning-configuration scanOnPush=true --region us-east-1

# Create frontend repository
aws ecr create-repository --repository-name vistora-frontend --image-scanning-configuration scanOnPush=true --region us-east-1
```

### Step 4: Build and Push Docker Images

```powershell
# Get AWS account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$AWS_REGION = "us-east-1"
$ECR_REGISTRY = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Authenticate Docker with ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push backend
cd backend
docker build -t vistora-backend:latest .
docker tag vistora-backend:latest $ECR_REGISTRY/vistora-backend:latest
docker push $ECR_REGISTRY/vistora-backend:latest

# Build and push frontend
cd ../frontend
docker build -t vistora-frontend:latest .
docker tag vistora-frontend:latest $ECR_REGISTRY/vistora-frontend:latest
docker push $ECR_REGISTRY/vistora-frontend:latest

cd ..
```

### Step 5: Create S3 Bucket for CloudFormation Templates

```powershell
aws s3 mb s3://vistora-cloudformation-templates-$AWS_ACCOUNT_ID --region us-east-1

# Upload templates
aws s3 sync ./infrastructure/cloudformation s3://vistora-cloudformation-templates-$AWS_ACCOUNT_ID/
```

### Step 6: Deploy CloudFormation Stack

```powershell
# Generate a strong database password
$DB_PASSWORD = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})

# Deploy the main stack
aws cloudformation create-stack `
    --stack-name vistora-main-stack `
    --template-url https://s3.amazonaws.com/vistora-cloudformation-templates-$AWS_ACCOUNT_ID/main-stack.yaml `
    --parameters `
        ParameterKey=EnvironmentName,ParameterValue=production `
        ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD `
        ParameterKey=BackendImageUri,ParameterValue=$ECR_REGISTRY/vistora-backend:latest `
        ParameterKey=FrontendImageUri,ParameterValue=$ECR_REGISTRY/vistora-frontend:latest `
        ParameterKey=AlertEmail,ParameterValue=your-email@example.com `
    --capabilities CAPABILITY_IAM `
    --tags Key=Project,Value=Vistora `
    --region us-east-1

# Wait for stack creation (15-20 minutes)
aws cloudformation wait stack-create-complete --stack-name vistora-main-stack --region us-east-1
```

### Step 7: Get Stack Outputs

```powershell
aws cloudformation describe-stacks `
    --stack-name vistora-main-stack `
    --query "Stacks[0].Outputs" `
    --region us-east-1
```

### Step 8: Run Database Migrations

```powershell
# Get database endpoint from stack outputs
$DB_ENDPOINT = (aws cloudformation describe-stacks --stack-name vistora-main-stack --query "Stacks[0].Outputs[?OutputKey=='DBEndpoint'].OutputValue" --output text --region us-east-1)

# Connect to database and run migrations
# You'll need to connect from an EC2 instance or use a bastion host
# Or run migrations from ECS task
```

### Step 9: Access the Application

Get the ALB DNS name from stack outputs:

```powershell
$ALB_DNS = (aws cloudformation describe-stacks --stack-name vistora-main-stack --query "Stacks[0].Outputs[?OutputKey=='ALBDNSName'].OutputValue" --output text --region us-east-1)

Write-Host "Application URL: http://$ALB_DNS"
```

## Monitoring

### CloudWatch Dashboard

Access CloudWatch in AWS Console to view:
- ECS CPU and Memory utilization
- ALB request count and response times
- Error rates
- Database connections

### CloudWatch Logs

View application logs:
- Backend logs: `/ecs/production/backend`
- Frontend logs: `/ecs/production/frontend`

### CloudWatch Alarms

Alarms are configured for:
- High error rate (>5% for 5 minutes)
- High response time (>2 seconds for 3 minutes)
- High CPU utilization (>70% for 5 minutes)
- High memory utilization (>80% for 5 minutes)

## Cleanup / Stack Deletion

To delete all AWS resources and avoid ongoing costs:

```powershell
# Delete the main CloudFormation stack
aws cloudformation delete-stack --stack-name vistora-main-stack --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name vistora-main-stack --region us-east-1

# Delete ECR repositories
aws ecr delete-repository --repository-name vistora-backend --force --region us-east-1
aws ecr delete-repository --repository-name vistora-frontend --force --region us-east-1

# Delete secrets
aws secretsmanager delete-secret --secret-id vistora/jwt --force-delete-without-recovery --region us-east-1

# Delete S3 bucket
aws s3 rm s3://vistora-cloudformation-templates-$AWS_ACCOUNT_ID --recursive
aws s3 rb s3://vistora-cloudformation-templates-$AWS_ACCOUNT_ID
```

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events:
```powershell
aws cloudformation describe-stack-events --stack-name vistora-main-stack --region us-east-1
```

2. Common issues:
   - ECR images not pushed
   - Invalid database password
   - IAM permissions missing
   - Resource limits exceeded

### Application Not Accessible

1. Check ECS service status:
```powershell
aws ecs describe-services --cluster production-cluster --services production-backend-service production-frontend-service --region us-east-1
```

2. Check task logs in CloudWatch

3. Verify security group rules

### Database Connection Issues

1. Check RDS instance status
2. Verify security group allows ECS tasks to connect
3. Check database credentials in Secrets Manager

## Cost Estimation

Monthly costs (us-east-1):
- ECS Fargate (2 tasks): ~$30
- RDS db.t3.micro: ~$15
- ElastiCache cache.t3.micro: ~$12
- ALB: ~$20
- NAT Gateways (2): ~$65
- Data transfer: ~$5
- CloudWatch: ~$3

**Total: ~$150/month**

To reduce costs:
- Use single NAT Gateway: Save ~$32/month
- Use Fargate Spot: Save ~$15/month
- Reduce to single AZ: Save ~$40/month

## Support

For issues or questions:
- Check CloudWatch logs
- Review CloudFormation events
- Verify AWS CLI commands in `scripts/aws-commands.ps1`
