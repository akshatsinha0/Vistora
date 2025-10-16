# AWS Credentials Configuration

## Important Security Note

**NEVER commit AWS credentials to version control!**

This file is a template. Replace placeholders with your actual credentials locally.

## Setup Instructions

### Option 1: Environment Variables (Recommended)

```powershell
$env:AWS_ACCESS_KEY_ID="<YOUR_AWS_ACCESS_KEY_ID>"
$env:AWS_SECRET_ACCESS_KEY="<YOUR_AWS_SECRET_ACCESS_KEY>"
$env:AWS_DEFAULT_REGION="us-east-1"
```

### Option 2: AWS CLI Configuration

```powershell
aws configure set aws_access_key_id <YOUR_AWS_ACCESS_KEY_ID>
aws configure set aws_secret_access_key <YOUR_AWS_SECRET_ACCESS_KEY>
aws configure set default.region us-east-1
aws configure set default.output json
```

## Verify Configuration

```powershell
aws sts get-caller-identity
```

## Security Best Practices

1. **Rotate credentials regularly**
2. **Use IAM roles when possible**
3. **Never commit credentials to git**
4. **Use AWS Secrets Manager for application secrets**
5. **Enable MFA for AWS account**
6. **Use least privilege IAM policies**

## Cleanup

After completing the assignment, delete the CloudFormation stack to avoid costs:

```powershell
.\scripts\cleanup-aws.ps1
```

This will remove all AWS resources and stop billing.
