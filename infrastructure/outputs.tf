###############################################################################
# Outputs
###############################################################################

output "app_url" {
  description = "Application URL"
  value       = "https://${var.domain_name}"
}

output "alb_dns_name" {
  description = "ALB DNS name (restricted to CloudFront only)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "ecr_frontend_url" {
  description = "ECR repository URL for the frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_url" {
  description = "ECR repository URL for the backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}
