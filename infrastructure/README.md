# Modernisation Pathway — AWS Infrastructure

ECS Fargate deployment behind CloudFront + ALB, matching the pattern used by 

## Architecture

```
CloudFront (HTTPS) → ALB (HTTP, secret header) → ECS Fargate (port 3470)
                                                    ├── Bedrock (LLM)
                                                    ├── MCP Mesh → Code Insights (Cognito)
                                                    └── MCP Mesh → Load Testing (Cognito)
```

## Deploy

### 1. Configure

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your VPC, subnets, domain, and secret
```

### 2. Build & Push Docker Image

```bash
./push-images.sh us-east-1
```

### 3. Terraform Apply

```bash
terraform init
terraform plan
terraform apply
```

### 4. Force ECS Deployment (after image updates)

```bash
aws ecs update-service \
  --cluster modernisation-pathway-cluster \
  --service modernisation-pathway-service \
  --force-new-deployment \
  --region us-east-1
```

## Resources Created

| Resource | Purpose |
|----------|---------|
| ECR Repository | Docker image storage |
| ECS Cluster + Service | Fargate container runtime |
| ALB + Target Group | Load balancing with CloudFront secret header |
| CloudFront Distribution | HTTPS termination, caching disabled for API |
| ACM Certificate | TLS for custom domain |
| Route53 Record | DNS alias to CloudFront |
| IAM Roles | ECS execution + task roles (Bedrock, Logs, SSM) |
| Security Groups | ALB ← CloudFront only, ECS ← ALB only |
| CloudWatch Log Group | Container logs (14-day retention) |
