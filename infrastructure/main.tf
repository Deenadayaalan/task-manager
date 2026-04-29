###############################################################################
# TaskFlow — Single-Container ECS Fargate Deployment
#
# Deploys 1 Node.js container (Express serves API + React frontend on port
# 3001) behind CloudFront + ALB.
###############################################################################

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ─── Variables ───────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "taskflow"
}

variable "vpc_id" {
  description = "VPC ID for deployment"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "app_cpu" {
  description = "CPU units for the ECS task (512 = 0.5 vCPU)"
  type        = number
  default     = 512
}

variable "app_memory" {
  description = "Memory in MiB for the ECS task"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Number of ECS task instances"
  type        = number
  default     = 1
}

variable "domain_name" {
  description = "FQDN for the app (optional, for CloudFront)"
  type        = string
  default     = ""
}

variable "route53_zone_name" {
  description = "Route53 hosted zone name (optional)"
  type        = string
  default     = ""
}

variable "cloudfront_secret" {
  description = "Shared secret header to restrict ALB access to CloudFront only"
  type        = string
  sensitive   = true
  default     = "taskflow-cf-secret-2026"
}

locals {
  name_prefix = var.project_name
  account_id  = data.aws_caller_identity.current.account_id
  region      = data.aws_region.current.name
  app_port    = 3001
}
