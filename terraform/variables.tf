variable "aws_region" {
  type        = string
  description = "AWS region for infrastructure deployment"
  default     = "us-east-1"
}

variable "cluster_name" {
  type        = string
  description = "Name of the AWS EKS cluster"
  default     = "deployeasy-eks-cluster"
}

variable "ecr_repo_name" {
  type        = string
  description = "Name of the AWS ECR repository"
  default     = "deployeasy-apps"
}

variable "node_instance_type" {
  type        = string
  description = "EC2 instance type for EKS node group"
  default     = "t3.small"
}

variable "desired_nodes" {
  type        = number
  description = "Desired number of worker nodes"
  default     = 1
}

variable "min_nodes" {
  type        = number
  description = "Minimum number of worker nodes"
  default     = 1
}

variable "max_nodes" {
  type        = number
  description = "Maximum number of worker nodes"
  default     = 1
}
