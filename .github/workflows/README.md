# GitHub Actions CI/CD

This directory contains GitHub Actions workflows for automated building and deployment.

## Workflows

### `deploy.yml` - Automatic Build and Deploy

**Triggers:**
- Push to `main` branch
- Changes in `backend/` or `frontend/` directories

**What it does:**
1. ✅ Builds Docker images for backend and frontend
2. ✅ Pushes images to AWS ECR with commit SHA and `latest` tags
3. ✅ Updates ECS task definitions with new images
4. ✅ Deploys new versions to ECS services
5. ✅ Waits for deployment to stabilize

**Setup Required:**

### 1. Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### 2. How to Use

Simply push your code changes to the `main` branch:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

The workflow will automatically:
- Build new Docker images
- Push to ECR
- Deploy to AWS ECS
- Update your running application

### 3. Monitor Deployment

- Go to **Actions** tab in GitHub to see the workflow progress
- Each deployment shows:
  - Build logs
  - Image tags
  - Deployment status
  - Service stabilization

### 4. Rollback

If something goes wrong, you can:

1. **Revert the commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Or manually rollback in AWS:**
   ```bash
   aws ecs update-service --cluster production-ECSCluster \
     --service production-BackendService \
     --task-definition production-BackendTask:PREVIOUS_REVISION
   ```

## Workflow Details

### Environment Variables

- `AWS_REGION`: us-east-1
- `ECR_BACKEND_REPOSITORY`: vistora-backend
- `ECR_FRONTEND_REPOSITORY`: vistora-frontend
- `ECS_CLUSTER`: production-ECSCluster
- `ECS_BACKEND_SERVICE`: production-BackendService
- `ECS_FRONTEND_SERVICE`: production-FrontendService

### Image Tagging Strategy

Each build creates two tags:
- `<commit-sha>`: Specific version (e.g., `5f4374c`)
- `latest`: Always points to the most recent build

### Deployment Strategy

- **Zero-downtime deployment**: ECS creates new tasks before stopping old ones
- **Health checks**: Only deploys if new tasks pass health checks
- **Automatic rollback**: If health checks fail, ECS keeps old version running

## Troubleshooting

### Workflow fails at "Login to Amazon ECR"
- Check that AWS credentials are correctly set in GitHub Secrets
- Verify IAM user has ECR permissions

### Workflow fails at "Update ECS service"
- Ensure ECS cluster and services exist
- Check that task definition names match

### Deployment takes too long
- Check ECS service events in AWS Console
- Verify health check endpoints are responding
- Check CloudWatch logs for application errors

## Cost Optimization

The workflow only runs when:
- Code changes are pushed to `main`
- Changes affect `backend/` or `frontend/` directories

This prevents unnecessary builds and saves GitHub Actions minutes.
