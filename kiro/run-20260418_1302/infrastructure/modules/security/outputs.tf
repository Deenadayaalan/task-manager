# infrastructure/modules/security/outputs.tf
output "security_group_ids" {
  description = "Security group IDs"
  value = {
    alb           = aws_security_group.alb.id
    ecs_service   = aws_security_group.ecs_service.id
    rds           = aws_security_group.rds.id
    elasticache   = aws_security_group.elasticache.id
  }
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "iam_roles" {
  description = "IAM role ARNs"
  value = {
    ecs_task_execution = aws_iam_role.ecs_task_execution.arn
    ecs_task          = aws_iam_role.ecs_task.arn
  }
}