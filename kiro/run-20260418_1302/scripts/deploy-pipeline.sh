#!/bin/bash

# Deploy CI/CD Pipeline Script
set -e

# Configuration
PROJECT_NAME="task-manager-react"
GITHUB_REPO="Deenadayaalan/task-manager"
GITHUB_BRANCH="main"
AWS_REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying CI/CD Pipeline for Task Manager React${NC}"

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: GITHUB_TOKEN environment variable is required${NC}"
    echo "Please set your GitHub personal access token:"
    echo "export GITHUB_TOKEN=your_github_token_here"
    exit 1
fi

# Check AWS CLI configuration
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: AWS CLI not configured${NC}"
    echo "Please configure AWS CLI with: aws configure"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Project Name: $PROJECT_NAME"
echo "GitHub Repo: $GITHUB_REPO"
echo "GitHub Branch: $GITHUB_BRANCH"
echo "AWS Region: $AWS_REGION"
echo ""

# Deploy the pipeline
echo -e "${YELLOW}🔧 Deploying CodePipeline infrastructure...${NC}"
aws cloudformation deploy \
    --template-file infrastructure/codepipeline.yml \
    --stack-name "${PROJECT_NAME}-pipeline" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        ProjectName="$PROJECT_NAME" \
        GitHubRepo="$GITHUB_REPO" \
        GitHubBranch="$GITHUB_BRANCH" \
        GitHubToken="$GITHUB_TOKEN" \
        Environment="dev" \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pipeline deployed successfully!${NC}"
    
    # Get pipeline URL
    PIPELINE_URL=$(aws cloudformation describe-stacks \
        --stack-name "${PROJECT_NAME}-pipeline" \
        --query 'Stacks[0].Outputs[?OutputKey==`PipelineUrl`].OutputValue' \
        --output text \
        --region "$AWS_REGION")
    
    echo -e "${GREEN}🔗 Pipeline URL: $PIPELINE_URL${NC}"
else
    echo -e "${RED}❌ Pipeline deployment failed${NC}"
    exit 1
fi

# Deploy application infrastructure for dev environment
echo -e "${YELLOW}🏗️ Deploying application infrastructure (dev)...${NC}"
aws cloudformation deploy \
    --template-file infrastructure/app-infrastructure.yml \
    --stack-name "${PROJECT_NAME}-dev" \
    --parameter-overrides \
        ProjectName="$PROJECT_NAME" \
        Environment="dev" \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application infrastructure deployed successfully!${NC}"
    
    # Get website URL
    WEBSITE_URL=$(aws cloudformation describe-stacks \
        --stack-name "${PROJECT_NAME}-dev" \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
        --output text \
        --region "$AWS_REGION")
    
    echo -e "${GREEN}🌐 Website URL: $WEBSITE_URL${NC}"
else
    echo -e "${RED}❌ Application infrastructure deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Push code to trigger the pipeline"
echo "2. Monitor the pipeline execution in AWS Console"
echo "3. Access your application at the website URL"