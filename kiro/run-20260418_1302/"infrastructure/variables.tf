variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "admin@taskmanager.com"
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "alarm_threshold_error_rate" {
  description = "Threshold for error rate alarm"
  type        = number
  default     = 10
}

variable "alarm_threshold_latency" {
  description = "Threshold for latency alarm (milliseconds)"
  type        = number
  default     = 5000
}