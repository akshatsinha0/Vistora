#!/bin/bash
set -e

# Vistora Kubernetes Deployment Script
# This script deploys all Kubernetes resources in the correct order

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/infrastructure/kubernetes"

echo "========================================="
echo "Vistora Kubernetes Deployment"
echo "========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "Error: kubectl is not installed"; exit 1; }

# Verify cluster access
kubectl cluster-info >/dev/null 2>&1 || { echo "Error: Cannot connect to Kubernetes cluster"; exit 1; }

echo "✅ Prerequisites check passed"
echo ""

# Deploy in order
echo "Step 1: Creating namespace..."
kubectl apply -f "$K8S_DIR/namespaces/"

echo ""
echo "Step 2: Creating storage classes..."
kubectl apply -f "$K8S_DIR/storage/"

echo ""
echo "Step 3: Creating secrets..."
echo "⚠️  WARNING: Update secrets with production values before deploying!"
read -p "Have you updated the secrets? (yes/no): " SECRETS_UPDATED
if [ "$SECRETS_UPDATED" != "yes" ]; then
    echo "Please update secrets in infrastructure/kubernetes/secrets/ before continuing"
    exit 1
fi
kubectl apply -f "$K8S_DIR/secrets/"

echo ""
echo "Step 4: Creating config maps..."
kubectl apply -f "$K8S_DIR/configmaps/"

echo ""
echo "Step 5: Creating RBAC policies..."
kubectl apply -f "$K8S_DIR/rbac/"

echo ""
echo "Step 6: Deploying stateful services (PostgreSQL, Redis)..."
kubectl apply -f "$K8S_DIR/statefulsets/"

echo ""
echo "Waiting for stateful services to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n vistora --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=redis -n vistora --timeout=300s || true

echo ""
echo "Step 7: Deploying application services..."
kubectl apply -f "$K8S_DIR/deployments/"

echo ""
echo "Step 8: Creating services..."
kubectl apply -f "$K8S_DIR/services/"

echo ""
echo "Step 9: Configuring ingress..."
kubectl apply -f "$K8S_DIR/ingress/"

echo ""
echo "Step 10: Setting up auto-scaling..."
kubectl apply -f "$K8S_DIR/hpa/"

echo ""
echo "Step 11: Applying network policies..."
kubectl apply -f "$K8S_DIR/networkpolicies/"

echo ""
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/vistora-backend -n vistora --timeout=300s || true
kubectl wait --for=condition=available deployment/vistora-frontend -n vistora --timeout=300s || true

echo ""
echo "========================================="
echo "✅ Kubernetes deployment complete!"
echo "========================================="
echo ""
echo "Deployment status:"
kubectl get all -n vistora

echo ""
echo "Ingress information:"
kubectl get ingress -n vistora

echo ""
echo "Next steps:"
echo "1. Get ALB DNS: kubectl get ingress vistora-ingress -n vistora -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
echo "2. Monitor pods: kubectl get pods -n vistora -w"
echo "3. View logs: kubectl logs -f deployment/vistora-backend -n vistora"
echo "4. Check HPA: kubectl get hpa -n vistora"
echo ""
