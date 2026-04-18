#!/bin/bash
# infrastructure/scripts/deploy.sh

set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

echo "🚀 Deploying Task Manager Infrastructure"
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"

# Check if environment file exists
if [ ! -f "environments/${ENVIRONMENT}.tfvars" ]; then
    echo "❌ Environment file not found: environments/${ENVIRONMENT}.tfvars"
    exit 1
fi

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Validate configuration
echo "✅ Validating Terraform configuration..."
terraform validate

# Format code
terraform fmt -recursive

case $ACTION in
    "plan")
        echo "📋 Planning infrastructure changes..."
        terraform plan -var-file="environments/${ENVIRONMENT}.tfvars" -out="${ENVIRONMENT}.tfplan"
        ;;
    "apply")
        echo "🔨 Applying infrastructure changes..."
        if [ -f "${ENVIRONMENT}.tfplan" ]; then
            terraform apply "${ENVIRONMENT}.tfplan"
        else
            terraform apply -var-file="environments/${ENVIRONMENT}.tfvars" -auto-approve
        fi
        ;;
    "destroy")
        echo "💥 Destroying infrastructure..."
        terraform destroy -var-file="environments/${ENVIRONMENT}.tfvars" -auto-approve
        ;;
    *)
        echo "❌ Invalid action. Use: plan, apply, or destroy"
        exit 1
        ;;
esac

echo "✅ Infrastructure deployment completed!"