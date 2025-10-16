# AWS CLI Commands Documentation
# This file documents all AWS CLI commands used in the Vistora project

# ============================================
# AWS CLI Configuration
# ============================================

# Configure AWS CLI with credentials
# aws configure set aws_access_key_id AKIA3LYOKQEC5HBQTAFLaws configure set aws_secret_access_key 3fkSH09REEmxdMMGu4tp1uyQWV4SxRE9OMSaShBG
# aws configure set default.region us-east-1

# Verify AWS CLI configuration
# aws sts get-caller-identity

# ============================================
# ECR Repository Management
# ============================================

# Create ECR repository for backend
# aws ecr create-repository --repository-name vistora-backend --image-scanning-configuration scanOnPush=true

# Create ECR repository for frontend
# aws ecr create-repository --repository-name vistora-frontend --image-scanning-configuration scanOnPush=true

# Set lifecycle policy for backend repository (retain 10 images)
# aws ecr put-lifecycle-policy --repository-name vistora-backend --lifecycle-policy-text file://infrastructure/ecr-lifecycle-policy.json

# Set lifecycle policy for frontend repository (retain 10 images)
# aws ecr put-lifecycle-policy --repository-name vistora-frontend --lifecycle-policy-text file://infrastructure/ecr-lifecycle-policy.json

# ============================================
# Docker Image Build and Push
# ============================================

# Authenticate Docker with ECR
# aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build backend Docker image
# docker build -t vistora-backend:latest ./backend

# Tag backend image for ECR
# docker tag vistora-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/vistora-backend:latest

# Push backend image to ECR
# docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vistora-backend:latest

# Build frontend Docker image
# docker build -t vistora-frontend:latest ./frontend

# Tag frontend image for ECR
# docker tag vistora-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/vistora-frontend:latest

# Push frontend image to ECR
# docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vistora-frontend:latest

# ============================================
# Secrets Manager
# ============================================

# Create database credentials secret
# aws secretsmanager create-secret --name vistora/database --secret-string file://secrets/database-secret.json --tags Key=Project,Value=Vistora

# Create Redis connection secret
# aws secretsmanager create-secret --name vistora/redis --secret-string file://secrets/redis-secret.json --tags Key=Project,Value=Vistora

# Create JWT secret
# aws secretsmanager create-secret --name vistora/jwt --secret-string file://secrets/jwt-secret.json --tags Key=Project,Value=Vistora

# Retrieve secret value
# aws secretsmanager get-secret-value --secret-id vistora/database

# ============================================
# S3 Bucket for CloudFormation Templates
# ============================================

# Create S3 bucket for CloudFormation templates
# aws s3 mb s3://vistora-cloudformation-templates --region us-east-1

# Upload CloudFormation templates to S3
# aws s3 sync ./infrastructure/cloudformation s3://vistora-cloudformation-templates/

# ============================================
# CloudFormation Stack Deployment
# ============================================

# Validate main stack template
# aws cloudformation validate-template --template-body file://infrastructure/cloudformation/main-stack.yaml

# Deploy main CloudFormation stack
# aws cloudformation create-stack --stack-name vistora-main-stack --template-body file://infrastructure/cloudformation/main-stack.yaml --parameters ParameterKey=Environment,ParameterValue=production --capabilities CAPABILITY_IAM --tags Key=Project,Value=Vistora

# Monitor stack creation progress
# aws cloudformation describe-stacks --stack-name vistora-main-stack

# Wait for stack creation to complete
# aws cloudformation wait stack-create-complete --stack-name vistora-main-stack

# Get stack outputs
# aws cloudformation describe-stacks --stack-name vistora-main-stack --query "Stacks[0].Outputs"

# ============================================
# ECS Service Updates
# ============================================

# Update ECS service with new task definition
# aws ecs update-service --cluster vistora-cluster --service vistora-backend-service --task-definition vistora-backend:2

# Force new deployment
# aws ecs update-service --cluster vistora-cluster --service vistora-backend-service --force-new-deployment

# ============================================
# Database Migrations
# ============================================

# Run database migrations (requires connection to RDS)
# cd backend
# npm run migrate

# ============================================
# CloudWatch Monitoring
# ============================================

# Create CloudWatch dashboard
# aws cloudwatch put-dashboard --dashboard-name vistora-dashboard --dashboard-body file://infrastructure/cloudwatch-dashboard.json

# List CloudWatch alarms
# aws cloudwatch describe-alarms --alarm-name-prefix vistora

# ============================================
# Stack Cleanup
# ============================================

# Delete CloudFormation stack (removes all resources)
# aws cloudformation delete-stack --stack-name vistora-main-stack

# Wait for stack deletion to complete
# aws cloudformation wait stack-delete-complete --stack-name vistora-main-stack

# Delete ECR repositories
# aws ecr delete-repository --repository-name vistora-backend --force
# aws ecr delete-repository --repository-name vistora-frontend --force

# Delete Secrets Manager secrets
# aws secretsmanager delete-secret --secret-id vistora/database --force-delete-without-recovery
# aws secretsmanager delete-secret --secret-id vistora/redis --force-delete-without-recovery
# aws secretsmanager delete-secret --secret-id vistora/jwt --force-delete-without-recovery

# Empty and delete S3 bucket
# aws s3 rm s3://vistora-cloudformation-templates --recursive
# aws s3 rb s3://vistora-cloudformation-templates
