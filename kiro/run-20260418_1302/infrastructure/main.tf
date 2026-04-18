# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "task-manager-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "TaskManager"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "https://github.com/Deenadayaalan/task-manager"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  account_id = data.aws_caller_identity.current.account_id
  azs        = slice(data.aws_availability_zones.available.names, 0, 3)
  
  common_tags = {
    Project     = "TaskManager"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = local.azs
  
  tags = local.common_tags
}

# Security Module
module "security" {
  source = "./modules/security"
  
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  
  tags = local.common_tags
}

# Compute Module
module "compute" {
  source = "./modules/compute"
  
  environment           = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  public_subnet_ids    = module.vpc.public_subnet_ids
  security_group_ids   = module.security.security_group_ids
  
  tags = local.common_tags
}

# Storage Module
module "storage" {
  source = "./modules/storage"
  
  environment = var.environment
  
  tags = local.common_tags
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  environment = var.environment
  
  tags = local.common_tags
}