output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "log_group_names" {
  description = "CloudWatch log group names"
  value = {
    app_logs    = aws_cloudwatch_log_group.app_logs.name
    api_logs    = aws_cloudwatch_log_group.api_logs.name
    cognito_logs = aws_cloudwatch_log_group.cognito_logs.name
  }
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "alarm_names" {
  description = "CloudWatch alarm names"
  value = [
    aws_cloudwatch_metric_alarm.lambda_errors.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_duration.alarm_name,
    aws_cloudwatch_metric_alarm.api_4xx_errors.alarm_name,
    aws_cloudwatch_metric_alarm.api_5xx_errors.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_throttles.alarm_name,
    aws_cloudwatch_metric_alarm.application_errors.alarm_name
  ]
}