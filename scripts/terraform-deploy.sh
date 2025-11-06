#!/bin/bash
set -e

# Vistora Terraform Deployment Script
# This script deploys the complete infrastructure using Terraform

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform"

echo "========================================="
echo "Vistora Terraform Deployment"
echo "========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v terraform >/dev/null 2>&1 || { echo "Error: terraform is not installed"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "Error: aws CLI is not installed"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "Error: kubectl is not installed"; exit 1; }

# Check AWS credentials
aws sts get-caller-identity >/dev/null 2>&1 || { echo "Error: AWS credentials not configured"; exit 1; }

echo "✅ Prerequisites check passed"
echo ""

# Navigate to Terraform directory
cd "$TERRAFORM_DIR"

# Initialize Terraform
echo "Step 1: Initializing Terraform..."
terraform init -upgrade

echo ""
echo "Step 2: Validating Terraform configuration..."
terraform validate

echo ""
echo "Step 3: Planning infrastructure changes..."
terraform plan -out=tfplan

echo ""
read -p "Do you want to apply these changes? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 4: Applying infrastructure changes..."
terraform apply tfplan

echo ""
echo "Step 5: Configuring kubectl..."
CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
AWS_REGION=$(terraform output -raw aws_region || echo "us-east-1")
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"

echo ""
echo "Step 6: Verifying cluster access..."
kubectl get nodes

echo ""
echo "========================================="
echo "✅ Infrastructure deployment complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Deploy Kubernetes resources: ./scripts/k8s-deploy.sh"
echo "2. Check cluster status: kubectl get all -n vistora"
echo "3. View outputs: cd infrastructure/terraform && terraform output"
echo ""
