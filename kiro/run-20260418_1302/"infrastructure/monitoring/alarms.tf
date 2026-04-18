# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.app_name}-${var.environment}-alerts"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Lambda Function Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.app_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = "${var.app_name}-api"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${var.app_name}-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"
  alarm_description   = "This metric monitors lambda duration"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = "${var.app_name}-api"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# API Gateway Alarms
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "${var.app_name}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 4XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = "${var.app_name}-api"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.app_name}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = "${var.app_name}-api"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# DynamoDB Alarms
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.app_name}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB throttles"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = "${var.app_name}-tasks"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Custom Application Alarms
resource "aws_cloudwatch_metric_alarm" "application_errors" {
  alarm_name          = "${var.app_name}-application-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "${var.app_name}/Application"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors application errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}