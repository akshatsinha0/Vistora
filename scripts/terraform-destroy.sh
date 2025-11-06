#!/bin/bash
set -e

# Vistora Terraform Destroy Script
# This script safely destroys all infrastructure

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform"

echo "========================================="
echo "⚠️  Vistora Infrastructure Destruction"
echo "========================================="
echo ""
echo "This will destroy ALL infrastructure including:"
echo "- EKS Cluster and worker nodes"
echo "- RDS PostgreSQL database"
echo "- ElastiCache Redis cluster"
echo "- VPC and all networking components"
echo "- All data will be PERMANENTLY DELETED"
echo ""

read -p "Are you ABSOLUTELY sure? Type 'destroy' to confirm: " CONFIRM
if [ "$CONFIRM" != "destroy" ]; then
    echo "Destruction cancelled"
    exit 0
fi

echo ""
echo "Step 1: Deleting Kubernetes resources..."
kubectl delete namespace vistora --ignore-not-found=true || true

echo ""
echo "Waiting for namespace deletion..."
kubectl wait --for=delete namespace/vistora --timeout=300s || true

echo ""
echo "Step 2: Deleting load balancers..."
# Delete any remaining load balancers created by Kubernetes
aws elb describe-load-balancers --query "LoadBalancerDescriptions[?contains(LoadBalancerName, 'vistora')].LoadBalancerName" --output text | \
    xargs -r -n1 aws elb delete-load-balancer --load-balancer-name || true

aws elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, 'vistora')].LoadBalancerArn" --output text | \
    xargs -r -n1 aws elbv2 delete-load-balancer --load-balancer-arn || true

echo ""
echo "Step 3: Destroying Terraform infrastructure..."
cd "$TERRAFORM_DIR"
terraform destroy -auto-approve

echo ""
echo "========================================="
echo "✅ Infrastructure destroyed"
echo "========================================="
echo ""
