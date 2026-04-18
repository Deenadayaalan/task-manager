# Task Manager AWS Infrastructure

This directory contains the Terraform infrastructure code for the Task Manager application migration from Angular to React.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ setup with public, private, and database subnets
- **Security**: Security groups, WAF, and IAM roles
- **Compute**: ECS Fargate for containerized applications
- **Storage**: S3 buckets and RDS PostgreSQL
- **Monitoring**: CloudWatch logs and metrics

## Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0 installed
- Make utility (optional, for convenience commands)

## Quick Start

1. **Setup Terraform Backend**: