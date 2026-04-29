#!/bin/bash
set -e

REGION=${AWS_REGION:-us-east-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/taskflow/app"

echo "Building and pushing TaskFlow image..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

docker build -t taskflow-app .
docker tag taskflow-app:latest ${ECR_REPO}:latest
docker push ${ECR_REPO}:latest

echo "Forcing new ECS deployment..."
aws ecs update-service \
  --cluster taskflow-cluster \
  --service taskflow-service \
  --force-new-deployment \
  --region $REGION

echo "Deployment initiated. Monitor at:"
echo "  https://${REGION}.console.aws.amazon.com/ecs/v2/clusters/taskflow-cluster/services/taskflow-service"
