#!/bin/bash

# Pipeline Monitoring Script
set -e

PIPELINE_NAME="task-manager-pipeline"
REGION="us-east-1"

echo "🔍 Monitoring CodePipeline: $PIPELINE_NAME"

# Get pipeline status
get_pipeline_status() {
    aws codepipeline get-pipeline-state \
        --name "$PIPELINE_NAME" \
        --region "$REGION" \
        --query 'stageStates[*].{Stage:stageName,Status:latestExecution.status}' \
        --output table
}

# Get pipeline execution history
get_execution_history() {
    aws codepipeline list-pipeline-executions \
        --pipeline-name "$PIPELINE_NAME" \
        --region "$REGION" \
        --max-items 5 \
        --query 'pipelineExecutionSummaries[*].{ExecutionId:pipelineExecutionId,Status:status,StartTime:startTime}' \
        --output table
}

# Monitor build logs
monitor_build_logs() {
    local build_id=$1
    echo "📋 Monitoring build logs for: $build_id"
    
    aws logs tail "/aws/codebuild/task-manager-build" \
        --region "$REGION" \
        --follow \
        --filter-pattern "$build_id"
}

# Check CloudWatch alarms
check_alarms() {
    echo "🚨 Checking CloudWatch alarms..."
    
    aws cloudwatch describe-alarms \
        --region "$REGION" \
        --alarm-names "TaskManager-PipelineFailures" "TaskManager-BuildFailures" \
        --query 'MetricAlarms[*].{Name:AlarmName,State:StateValue,Reason:StateReason}' \
        --output table
}

# Main monitoring loop
main() {
    case "${1:-status}" in
        "status")
            echo "📊 Current Pipeline Status:"
            get_pipeline_status
            ;;
        "history")
            echo "📈 Pipeline Execution History:"
            get_execution_history
            ;;
        "logs")
            if [ -z "$2" ]; then
                echo "❌ Please provide build ID"
                exit 1
            fi
            monitor_build_logs "$2"
            ;;
        "alarms")
            check_alarms
            ;;
        "watch")
            echo "👀 Watching pipeline status (Ctrl+C to stop)..."
            while true; do
                clear
                echo "🕐 $(date)"
                get_pipeline_status
                echo ""
                check_alarms
                sleep 30
            done
            ;;
        *)
            echo "Usage: $0 {status|history|logs <build-id>|alarms|watch}"
            exit 1
            ;;
    esac
}

main "$@"