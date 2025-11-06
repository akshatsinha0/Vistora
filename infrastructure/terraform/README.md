# Vistora Terraform Infrastructure

This directory contains Terraform configurations for deploying Vistora infrastructure on AWS with EKS (Kubernetes).

## Architecture Overview

- **VPC Module**: Multi-AZ VPC with public/private subnets, NAT gateways, and Internet Gateway
- **EKS Module**: Managed Kubernetes cluster with auto-scaling node groups
- **Kubernetes Manifests**: Application deployments, services, ingress, and HPA configurations

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.5.0
3. **kubectl** for Kubernetes management
4. **aws-iam-authenticator** for EKS authentication

## Quick Start

### 1. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

### 2. Create terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Plan Infrastructure

```bash
terraform plan -out=tfplan
```

### 4. Apply Infrastructure

```bash
terraform apply tfplan
```

### 5. Configure kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name vistora-production-eks
```

### 6. Deploy Kubernetes Resources

```bash
# Apply in order
kubectl apply -f ../kubernetes/namespaces/
kubectl apply -f ../kubernetes/secrets/
kubectl apply -f ../kubernetes/configmaps/
kubectl apply -f ../kubernetes/deployments/
kubectl apply -f ../kubernetes/services/
kubectl apply -f ../kubernetes/ingress/
kubectl apply -f ../kubernetes/hpa/
```

## Module Structure

```
terraform/
├── main.tf                 # Provider and backend configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── modules.tf              # Module declarations
├── terraform.tfvars.example # Example variables file
├── modules/
│   ├── vpc/               # VPC networking module
│   └── eks/               # EKS cluster module
```

## State Management

Terraform state is stored in S3 with DynamoDB locking:
- **S3 Bucket**: `vistora-terraform-state`
- **DynamoDB Table**: `vistora-terraform-locks`
- **Region**: `us-east-1`

## Outputs

After successful apply, Terraform outputs:
- VPC ID
- EKS cluster name and endpoint
- RDS endpoint
- Redis endpoint
- ECR repository URLs
- ALB DNS name
- kubectl configuration command

## Cleanup

To destroy all infrastructure:

```bash
# Delete Kubernetes resources first
kubectl delete -f ../kubernetes/ --all

# Then destroy Terraform resources
terraform destroy
```

## Security Notes

- Never commit `terraform.tfvars` or `.tfstate` files
- Use AWS Secrets Manager or Parameter Store for sensitive values in production
- Enable MFA for AWS accounts with infrastructure access
- Regularly rotate credentials and secrets

## Troubleshooting

### EKS Cluster Access Issues

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name vistora-production-eks

# Verify access
kubectl get nodes
```

### State Lock Issues

```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

## Contributing

Follow conventional commit messages:
- `feat(terraform/module): description`
- `fix(k8s/deployment): description`
- `docs(readme): description`

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
