#!/bin/bash
# infrastructure/scripts/setup-backend.sh

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
BUCKET_NAME="task-manager-terraform-state"
DYNAMODB_TABLE="terraform-state-lock"

echo "🏗️  Setting up Terraform backend infrastructure..."

# Create S3 bucket for state
echo "📦 Creating S3 bucket: $BUCKET_NAME"
aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region $AWS_REGION \
    --create-bucket-configuration LocationConstraint=$AWS_REGION 2>/dev/null || echo "Bucket already exists"

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket $BUCKET_NAME \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'

# Block public access
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create DynamoDB table for state locking
echo "🔒 Creating DynamoDB table: $DYNAMODB_TABLE"
aws dynamodb create-table \
    --table-name $DYNAMODB_TABLE \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION 2>/dev/null || echo "Table already exists"

echo "✅ Terraform backend setup completed!"
echo "📝 Update your terraform configuration with:"
echo "   Bucket: $BUCKET_NAME"
echo "   DynamoDB Table: $DYNAMODB_TABLE"
echo "   Region: $AWS_REGION"