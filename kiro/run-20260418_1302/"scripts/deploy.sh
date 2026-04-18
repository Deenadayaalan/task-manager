#!/bin/bash

# Deployment Script for Task Manager
set -e

ENVIRONMENT=${1:-production}
REGION=${AWS_REGION:-us-east-1}
STACK_PREFIX="TaskManager"

echo "🚀 Deploying Task Manager to $ENVIRONMENT environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        error "AWS CDK is not installed"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured"
    fi
    
    log "Prerequisites check passed ✅"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying infrastructure stack..."
    
    cd infrastructure
    
    # Install dependencies
    npm ci
    
    # Bootstrap CDK (if needed)
    cdk bootstrap --region "$REGION"
    
    # Deploy infrastructure stack
    cdk deploy "${STACK_PREFIX}Infrastructure" \
        --require-approval never \
        --region "$REGION" \
        --context environment="$ENVIRONMENT"
    
    cd ..
    log "Infrastructure deployed ✅"
}

# Deploy pipeline
deploy_pipeline() {
    log "Deploying CI/CD pipeline..."
    
    cd infrastructure
    
    # Deploy pipeline stack
    cdk deploy "${STACK_PREFIX}Pipeline" \
        --require-approval never \
        --region "$REGION" \
        --context environment="$ENVIRONMENT" \
        --context githubOwner="${GITHUB_OWNER:-Deenadayaalan}" \
        --context githubRepo="${GITHUB_REPO:-task-manager}" \
        --context githubBranch="${GITHUB_BRANCH:-main}"
    
    cd ..
    log "Pipeline deployed ✅"
}

# Trigger pipeline
trigger_pipeline() {
    log "Triggering pipeline execution..."
    
    PIPELINE_NAME=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}Pipeline" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`PipelineName`].OutputValue' \
        --output text)
    
    if [ -n "$PIPELINE_NAME" ]; then
        aws codepipeline start-pipeline-execution \
            --name "$PIPELINE_NAME" \
            --region "$REGION"
        
        log "Pipeline triggered: $PIPELINE_NAME ✅"
    else
        warn "Could not find pipeline name"
    fi
}

# Wait for deployment
wait_for_deployment() {
    log "Waiting for deployment to complete..."
    
    PIPELINE_NAME=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}Pipeline" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`PipelineName`].OutputValue' \
        --output text)
    
    if [ -n "$PIPELINE_NAME" ]; then
        while true; do
            STATUS=$(aws codepipeline get-pipeline-state \
                --name "$PIPELINE_NAME" \
                --region "$REGION" \
                --query 'stageStates[-1].latestExecution.status' \
                --output text)
            
            case "$STATUS" in
                "Succeeded")
                    log "Deployment completed successfully ✅"
                    break
                    ;;
                "Failed")
                    error "Deployment failed ❌"
                    ;;
                "InProgress")
                    log "Deployment in progress... ⏳"
                    sleep 30
                    ;;
                *)
                    log "Deployment status: $STATUS"
                    sleep 30
                    ;;
            esac
        done
    fi
}

# Get deployment info
get_deployment_info() {
    log "Getting deployment information..."
    
    DISTRIBUTION_DOMAIN=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}Pipeline" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
        --output text)
    
    if [ -n "$DISTRIBUTION_DOMAIN" ]; then
        log "🌐 Application URL: https://$DISTRIBUTION_DOMAIN"
    fi
    
    log "📊 Pipeline Dashboard: https://console.aws.amazon.com/codesuite/codepipeline/pipelines/$PIPELINE_NAME/view"
}

# Main deployment process
main() {
    log "Starting deployment process for environment: $ENVIRONMENT"
    
    check_prerequisites
    deploy_infrastructure
    deploy_pipeline
    
    if [ "$2" = "--trigger" ]; then
        trigger_pipeline
        wait_for_deployment
    fi
    
    get_deployment_info
    
    log "🎉 Deployment process completed!"
}

# Handle script arguments
case "$1" in
    "infrastructure")
        check_prerequisites
        deploy_infrastructure
        ;;
    "pipeline")
        check_prerequisites
        deploy_pipeline
        ;;
    "trigger")
        trigger_pipeline
        ;;
    "status")
        get_deployment_info
        ;;
    *)
        main "$@"
        ;;
esac