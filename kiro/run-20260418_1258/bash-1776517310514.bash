#!/bin/bash

set -e

BUCKET_NAME="task-manager-terraform-state"
DYNAMODB_TABLE="terraform-state-lock"
AWS_REGION="us-east-1"

echo "Setting up Terraform backend resources..."

# Create S3 bucket for Terraform state
aws s3api create-bucket \
    --bucket $BUCKET_NAME \
    --region $AWS_REGION

# Enable versioning on the bucket
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# Enable server-side encryption
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
aws dynamodb create-table \
    --table-name $DYNAMODB_TABLE \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION

echo "Terraform backend setup complete!"
echo "S3 Bucket: $BUCKET_NAME"
echo "DynamoDB Table: $DYNAMODB_TABLE"