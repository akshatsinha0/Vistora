# Vistora Kubernetes Manifests

This directory contains all Kubernetes manifests for deploying Vistora on EKS.

## Directory Structure

```
kubernetes/
├── namespaces/          # Namespace definitions
├── secrets/             # Sensitive configuration (DO NOT COMMIT REAL SECRETS)
├── configmaps/          # Application configuration
├── rbac/                # Role-Based Access Control
├── storage/             # StorageClass definitions
├── statefulsets/        # PostgreSQL and Redis StatefulSets
├── deployments/         # Application deployments
├── services/            # Service definitions
├── ingress/             # ALB Ingress configuration
├── hpa/                 # HorizontalPodAutoscaler
└── networkpolicies/     # Network segmentation policies
```

## Deployment Order

Resources must be deployed in this specific order:

1. **Namespaces** - Create isolated environment
2. **Storage** - Define storage classes for persistent volumes
3. **Secrets** - Store sensitive credentials
4. **ConfigMaps** - Store application configuration
5. **RBAC** - Set up service accounts and permissions
6. **StatefulSets** - Deploy databases (PostgreSQL, Redis)
7. **Deployments** - Deploy application services
8. **Services** - Expose pods internally
9. **Ingress** - Configure external access via ALB
10. **HPA** - Enable auto-scaling
11. **NetworkPolicies** - Enforce network segmentation

## Quick Start

### Automated Deployment

```bash
# Deploy everything in correct order
./scripts/k8s-deploy.sh
```

### Manual Deployment

```bash
# 1. Create namespace
kubectl apply -f namespaces/

# 2. Create storage classes
kubectl apply -f storage/

# 3. Create secrets (UPDATE VALUES FIRST!)
kubectl apply -f secrets/

# 4. Create config maps
kubectl apply -f configmaps/

# 5. Create RBAC
kubectl apply -f rbac/

# 6. Deploy stateful services
kubectl apply -f statefulsets/

# 7. Wait for databases
kubectl wait --for=condition=ready pod -l app=postgres -n vistora --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n vistora --timeout=300s

# 8. Deploy applications
kubectl apply -f deployments/

# 9. Create services
kubectl apply -f services/

# 10. Configure ingress
kubectl apply -f ingress/

# 11. Enable auto-scaling
kubectl apply -f hpa/

# 12. Apply network policies
kubectl apply -f networkpolicies/
```

## Configuration

### Secrets

**IMPORTANT**: Update secrets before deploying to production!

```bash
# Edit secrets
vi secrets/backend-secrets.yaml

# Apply secrets
kubectl apply -f secrets/
```

### Environment Variables

Backend configuration is in `configmaps/backend-config.yaml`:
- NODE_ENV
- PORT
- LOG_LEVEL
- Database settings
- Redis settings
- JWT configuration

### Resource Limits

Adjust resource requests/limits in deployment files:
- Backend: 250m-500m CPU, 512Mi-1Gi memory
- Frontend: 100m-200m CPU, 256Mi-512Mi memory
- PostgreSQL: 250m-500m CPU, 512Mi-1Gi memory
- Redis: 100m-200m CPU, 256Mi-512Mi memory

### Auto-Scaling

HPA configuration in `hpa/`:
- Backend: 2-10 replicas (CPU: 70%, Memory: 80%)
- Frontend: 2-8 replicas (CPU: 70%, Memory: 80%)

## Monitoring

### Check Deployment Status

```bash
# All resources
kubectl get all -n vistora

# Pods
kubectl get pods -n vistora

# Services
kubectl get svc -n vistora

# Ingress
kubectl get ingress -n vistora

# HPA
kubectl get hpa -n vistora
```

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/vistora-backend -n vistora

# Frontend logs
kubectl logs -f deployment/vistora-frontend -n vistora

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n vistora

# Redis logs
kubectl logs -f statefulset/redis -n vistora
```

### Debug Pods

```bash
# Describe pod
kubectl describe pod <pod-name> -n vistora

# Execute commands in pod
kubectl exec -it <pod-name> -n vistora -- /bin/sh

# Port forward for local testing
kubectl port-forward svc/vistora-backend-service 8080:8080 -n vistora
```

## Network Policies

Network policies enforce zero-trust security:

- **Backend**: Can access PostgreSQL, Redis, and external APIs
- **Frontend**: Can only access backend
- **PostgreSQL**: Only accessible from backend
- **Redis**: Only accessible from backend

To disable network policies (not recommended):
```bash
kubectl delete networkpolicies --all -n vistora
```

## Persistent Storage

StatefulSets use PersistentVolumeClaims with gp3 storage:
- PostgreSQL: 20Gi
- Redis: 10Gi

Storage is retained even if pods are deleted (ReclaimPolicy: Retain).

## Ingress

ALB Ingress Controller routes traffic:
- `/api/*` → Backend service
- `/socket.io/*` → Backend service (WebSocket)
- `/*` → Frontend service

Get ALB DNS:
```bash
kubectl get ingress vistora-ingress -n vistora -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## Troubleshooting

### Pods not starting

```bash
# Check events
kubectl get events -n vistora --sort-by='.lastTimestamp'

# Check pod status
kubectl describe pod <pod-name> -n vistora
```

### Database connection issues

```bash
# Test PostgreSQL connection
kubectl exec -it statefulset/postgres -n vistora -- psql -U vistora_admin -d vistora

# Test Redis connection
kubectl exec -it statefulset/redis -n vistora -- redis-cli ping
```

### Ingress not working

```bash
# Check ingress status
kubectl describe ingress vistora-ingress -n vistora

# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace vistora

# Or use the script
./scripts/terraform-destroy.sh
```

## Security Best Practices

1. ✅ Update secrets with strong passwords
2. ✅ Enable network policies
3. ✅ Use RBAC with least privilege
4. ✅ Run containers as non-root
5. ✅ Enable resource limits
6. ✅ Use private container registries
7. ✅ Regularly update images
8. ✅ Enable audit logging
9. ✅ Use Pod Security Standards
10. ✅ Implement image scanning

## Production Considerations

For production deployments:

1. **Use managed services**: RDS instead of PostgreSQL StatefulSet, ElastiCache instead of Redis StatefulSet
2. **Enable TLS**: Configure SSL/TLS for ingress
3. **Set up monitoring**: Prometheus, Grafana, CloudWatch
4. **Configure backups**: Automated database backups
5. **Implement CI/CD**: GitOps with ArgoCD or Flux
6. **Enable logging**: Centralized logging with ELK or CloudWatch
7. **Set up alerts**: PagerDuty, Slack notifications
8. **Use secrets management**: AWS Secrets Manager or HashiCorp Vault
9. **Enable pod disruption budgets**: Ensure availability during updates
10. **Implement disaster recovery**: Multi-region setup

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
