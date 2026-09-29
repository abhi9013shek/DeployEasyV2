output "aws_region" {
  value       = var.aws_region
  description = "AWS Region of deployment"
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.deployeasy.repository_url
  description = "URL of the created ECR Repository"
}

output "eks_cluster_name" {
  value       = aws_eks_cluster.deployeasy.name
  description = "Name of the EKS Cluster"
}

output "eks_cluster_endpoint" {
  value       = aws_eks_cluster.deployeasy.endpoint
  description = "Kubernetes API Endpoint of the EKS Cluster"
}
