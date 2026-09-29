# DeployEasy AWS Terraform Infrastructure

This directory contains Terraform HCL modules to provision the AWS cloud infrastructure required by DeployEasy for production AWS deployments.

## Architecture

```
DeployEasy Platform
       ↓
AWS VPC (10.0.0.0/16)
 ├── Public Subnet 1 (us-east-1a)
 ├── Public Subnet 2 (us-east-1b)
 ├── Internet Gateway & Route Tables
 ├── AWS ECR Repository (deployeasy-apps)
 └── AWS EKS Cluster & Node Group (deployeasy-eks-cluster)
```

## Configurable Variables

Customize `terraform.tfvars` or pass via `-var`:

- `aws_region`: AWS Region (default: `us-east-1`)
- `cluster_name`: AWS EKS Cluster Name (default: `deployeasy-eks-cluster`)
- `ecr_repo_name`: AWS ECR Repository Name (default: `deployeasy-apps`)
- `node_instance_type`: Worker node EC2 instance type (default: `t3.medium`)
- `desired_nodes`: Initial worker node count (default: `2`)
- `min_nodes`: Minimum worker node count (default: `1`)
- `max_nodes`: Maximum worker node count (default: `3`)

## AWS Billable Resources & Cost Warning

Running this Terraform configuration provisions potentially billable AWS resources:

- **AWS EKS Control Plane**: ~$0.10/hour
- **AWS EC2 Worker Nodes (`t3.medium`)**: Charged per instance hour
- **AWS Network/Application Load Balancers**: Created dynamically by Kubernetes `LoadBalancer` services
- **AWS ECR Storage & Data Transfer**: Charged per GB stored/transferred

> [!WARNING]
> Always run `terraform destroy` when dev/testing work is finished to avoid unnecessary charges!

## Provisioning Infrastructure

1. Initialize Terraform:
   ```bash
   terraform init
   ```
2. Validate HCL syntax:
   ```bash
   terraform validate
   ```
3. Preview changes:
   ```bash
   terraform plan
   ```
4. Apply infrastructure:
   ```bash
   terraform apply
   ```

## Configuring `kubectl` for EKS

After `terraform apply` completes, configure your local `kubectl` context:

```bash
aws eks update-kubeconfig --region us-east-1 --name deployeasy-eks-cluster
```

## Destroying Infrastructure (Cost Cleanup)

To remove all AWS resources:

```bash
terraform destroy
```
