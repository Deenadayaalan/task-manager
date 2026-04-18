# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/lambda/${var.app_name}-app"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.app_name}-api"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

resource "aws_cloudwatch_log_group" "cognito_logs" {
  name              = "/aws/cognito/${var.app_name}-auth"
  retention_in_days = 14

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.app_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "${var.app_name}-api"],
            [".", "Errors", ".", "."],
            [".", "Invocations", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Performance Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", "${var.app_name}-api"],
            [".", "Latency", ".", "."],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${var.app_name}-tasks"],
            [".", "ConsumedWriteCapacityUnits", ".", "."],
            [".", "ThrottledRequests", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Metrics"
          period  = 300
        }
      }
    ]
  })
}

# Custom Metrics
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.app_name}-error-count"
  log_group_name = aws_cloudwatch_log_group.app_logs.name
  pattern        = "[timestamp, request_id, \"ERROR\"]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "${var.app_name}/Application"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "task_creation_count" {
  name           = "${var.app_name}-task-creation"
  log_group_name = aws_cloudwatch_log_group.app_logs.name
  pattern        = "[timestamp, request_id, \"TASK_CREATED\"]"

  metric_transformation {
    name      = "TaskCreationCount"
    namespace = "${var.app_name}/Business"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "user_login_count" {
  name           = "${var.app_name}-user-login"
  log_group_name = aws_cloudwatch_log_group.cognito_logs.name
  pattern        = "[timestamp, request_id, \"USER_LOGIN\"]"

  metric_transformation {
    name      = "UserLoginCount"
    namespace = "${var.app_name}/Authentication"
    value     = "1"
  }
}