# Deployment Automation

## Overview
This document describes the automated deployment processes for the Vistora SaaS application.

## Automated Workflows

### 1. CloudFormation Template Upload
**File**: `.github/workflows/upload-templates.yml`

**Triggers**:
- Push to `main` branch with changes in `infrastructure/cloudformation/**`
- Manual workflow dispatch

**Actions**:
- Syncs all CloudFormation YAML templates to S3 bucket
- Deletes removed templates from S3
- Lists uploaded templates for verification

### 2. Build and Deploy
**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` branch with changes in:
  - `backend/**`
  - `frontend/**`
  - `infrastructure/cloudformation/**`
  - `.github/workflows/deploy.yml`

**Actions**:
1. Uploads CloudFormation templates to S3
2. Builds and pushes Docker images to ECR
3. Updates ECS task definitions
4. Deploys new versions to ECS services
5. Waits for services to stabilize

## Manual Scripts

### Deploy Stack
**File**: `scripts/deploy-stack.ps1`

Deploys the complete CloudFormation stack with all infrastructure.

```powershell
.\scripts\deploy-stack.ps1
```

### Cleanup Stacks
**File**: `scripts/cleanup-stacks.ps1`

Forcefully deletes all Vistora-related AWS resources:
- RDS instances (skip final snapshot)
- ElastiCache clusters
- CloudFormation stacks (nested and main)

```powershell
.\scripts\cleanup-stacks.ps1
```

## GitHub Secrets Required

The following secrets must be configured in GitHub repository settings:

- `AWS_ACCESS_KEY_ID`: AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key

## S3 Bucket

CloudFormation templates are stored in:
```
s3://vistora-cloudformation-templates-781177225477/
```

## CloudFormation Stack Fixes

Recent fixes applied to templates:
1. Changed instance types from `t3` to `t2` (free tier compatible)
   - `cache.t2.micro` for Redis
   - `db.t2.micro` for PostgreSQL
2. Updated Redis engine version to `6.2` (more stable)
3. Updated PostgreSQL engine version to `14.13` (latest stable)
4. Hardcoded resource identifiers to avoid naming conflicts
5. Added `CAPABILITY_NAMED_IAM` for IAM role creation

## Deployment Flow

```
Code Change → Push to GitHub → GitHub Actions
                                      ↓
                        Upload Templates to S3
                                      ↓
                        Build Docker Images
                                      ↓
                        Push to ECR
                                      ↓
                        Update ECS Services
                                      ↓
                        Wait for Stabilization
                                      ↓
                        Deployment Complete 
```

## Troubleshooting

### Stack Deletion Issues
If stacks fail to delete due to resources:
1. Run `.\scripts\cleanup-stacks.ps1` to force delete resources
2. Manually delete stuck resources from AWS Console
3. Retry stack deletion

### Template Upload Issues
If templates fail to upload:
1. Check AWS credentials in GitHub secrets
2. Verify S3 bucket exists and is accessible
3. Check IAM permissions for S3 write access

### ECS Deployment Issues
If ECS services fail to update:
1. Check ECR images are pushed successfully
2. Verify ECS cluster and services exist
3. Check task definition compatibility
4. Review CloudWatch logs for errors
