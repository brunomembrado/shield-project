#!/bin/bash

# AWS Deployment Script for Shield Platform
# Builds Docker images, pushes to ECR, and deploys to ECS

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-""}
ECR_REPOSITORY_PREFIX="shield"
ECS_CLUSTER_NAME="shield-cluster"
SERVICES=("auth-service" "wallet-service" "transaction-service" "blockchain-service" "compliance-service" "api-gateway")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Shield Platform - AWS Deployment Script${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Get AWS account ID if not set
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${YELLOW}📋 Getting AWS Account ID...${NC}"
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}✅ Account ID: $AWS_ACCOUNT_ID${NC}"
fi

ECR_BASE_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Login to ECR
echo -e "${YELLOW}🔐 Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_BASE_URL
echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

# Create ECR repositories if they don't exist
echo -e "${YELLOW}📦 Creating ECR repositories...${NC}"
for service in "${SERVICES[@]}"; do
    REPO_NAME="$ECR_REPOSITORY_PREFIX-$service"
    
    if aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "  ✅ Repository $REPO_NAME already exists"
    else
        echo -e "  📦 Creating repository $REPO_NAME..."
        aws ecr create-repository \
            --repository-name $REPO_NAME \
            --region $AWS_REGION \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        echo -e "  ✅ Repository $REPO_NAME created"
    fi
done
echo ""

# Build and push images
echo -e "${YELLOW}🏗️  Building and pushing Docker images...${NC}"
for service in "${SERVICES[@]}"; do
    REPO_NAME="$ECR_REPOSITORY_PREFIX-$service"
    IMAGE_URI="$ECR_BASE_URL/$REPO_NAME:latest"
    
    echo -e "${YELLOW}📦 Building $service...${NC}"
    
    # Determine build context
    if [ "$service" == "api-gateway" ]; then
        BUILD_CONTEXT="./api-gateway"
    else
        BUILD_CONTEXT="./services/$service"
    fi
    
    # Build image
    docker build -t $REPO_NAME:latest -f $BUILD_CONTEXT/Dockerfile $BUILD_CONTEXT
    
    # Tag for ECR
    docker tag $REPO_NAME:latest $IMAGE_URI
    
    # Push to ECR
    echo -e "${YELLOW}⬆️  Pushing $service to ECR...${NC}"
    docker push $IMAGE_URI
    
    echo -e "${GREEN}✅ $service pushed successfully${NC}"
    echo ""
done

# Update ECS services
echo -e "${YELLOW}🔄 Updating ECS services...${NC}"
for service in "${SERVICES[@]}"; do
    SERVICE_NAME="shield-$service"
    
    if aws ecs describe-services --cluster $ECS_CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "${YELLOW}🔄 Forcing new deployment of $SERVICE_NAME...${NC}"
        aws ecs update-service \
            --cluster $ECS_CLUSTER_NAME \
            --service $SERVICE_NAME \
            --force-new-deployment \
            --region $AWS_REGION > /dev/null
        echo -e "${GREEN}✅ $SERVICE_NAME deployment triggered${NC}"
    else
        echo -e "${YELLOW}⚠️  Service $SERVICE_NAME not found. Create it first using AWS Console or Terraform.${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "  1. Monitor deployments in AWS ECS Console"
echo "  2. Check CloudWatch logs for each service"
echo "  3. Verify health checks are passing"
echo ""

