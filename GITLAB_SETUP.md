# GitLab Setup Guide

## Step 1: Create GitLab Repository

1. Go to https://gitlab.com
2. Click "New project" → "Create blank project"
3. Name: `Vistora`
4. Visibility: Private or Public
5. Uncheck "Initialize repository with a README"
6. Click "Create project"

## Step 2: Add GitLab Remote

Run these commands in your terminal:

```powershell
# Add GitLab as a remote (replace YOUR_USERNAME with your GitLab username)
git remote add gitlab https://gitlab.com/YOUR_USERNAME/Vistora.git

# Verify remotes
git remote -v

# Push to GitLab
git push gitlab main
```

## Step 3: Set Up GitLab CI/CD Variables

1. Go to your GitLab project
2. Navigate to Settings → CI/CD → Variables
3. Add the following variables (mark as "Protected" and "Masked"):

### Required Variables:
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key (mark as masked)
- `AWS_REGION`: us-east-1

### Optional Variables (already in .gitlab-ci.yml):
- `ECR_REGISTRY`: 781177225477.dkr.ecr.us-east-1.amazonaws.com
- `ECS_CLUSTER_NAME`: production-cluster

## Step 4: Test GitLab CI/CD

After pushing to GitLab:
1. Go to CI/CD → Pipelines
2. You should see a pipeline running
3. The pipeline will:
   - Lint code
   - Run tests
   - Build Docker images
   - Deploy to staging (if configured)
   - Wait for manual approval for production

## Using Both GitHub and GitLab

You can push to both remotes:

```powershell
# Push to GitHub
git push origin main

# Push to GitLab
git push gitlab main

# Push to both at once
git push origin main && git push gitlab main
```

## Troubleshooting

### Authentication Issues

If you get authentication errors, use a Personal Access Token:

1. GitLab → Preferences → Access Tokens
2. Create token with `read_repository` and `write_repository` scopes
3. Use token as password when pushing:

```powershell
git push https://YOUR_USERNAME:YOUR_TOKEN@gitlab.com/YOUR_USERNAME/Vistora.git main
```

Or configure Git credential helper:

```powershell
git config --global credential.helper store
```

Then push once with your token, and it will be saved.
