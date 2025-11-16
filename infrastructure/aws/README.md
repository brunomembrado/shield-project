# AWS Deployment Guide for Shield Platform

Complete guide for deploying Shield platform to AWS using ECS and ECR.

## Overview

This infrastructure setup deploys all Shield microservices to AWS ECS (Elastic Container Service) using Fargate, with images stored in ECR (Elastic Container Registry).

## Architecture

```
Internet
    ↓
Application Load Balancer (ALB)
    ↓
ECS Fargate Cluster
    ├── API Gateway (Port 8080)
    ├── Auth Service (Port 3001)
    ├── Wallet Service (Port 3002)
    ├── Transaction Service (Port 3003)
    ├── Blockchain Service (Port 3004)
    └── Compliance Service (Port 3005)
    ↓
RDS PostgreSQL (Multi-AZ)
    ├── shield_auth
    ├── shield_wallets
    ├── shield_transactions
    ├── shield_blockchain
    └── shield_compliance
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed locally
4. **ECS Cluster** created (or use script to create)
5. **RDS PostgreSQL** instance (or use RDS setup script)
6. **Secrets Manager** configured with required secrets

## Setup Steps

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
# Enter default output format (json)
```

### 2. Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name shield-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1 \
    capacityProvider=FARGATE_SPOT,weight=1
```

### 3. Create RDS PostgreSQL Instance

```bash
# Create RDS instance with multiple databases
aws rds create-db-instance \
  --db-instance-identifier shield-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username shield \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --multi-az
```

### 4. Create Secrets in AWS Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name shield/database-url \
  --secret-string "postgresql://shield:PASSWORD@shield-postgres.xxxxx.us-east-1.rds.amazonaws.com:5432/shield"

# JWT Secret
aws secretsmanager create-secret \
  --name shield/jwt-secret \
  --secret-string "YOUR_JWT_SECRET"

# JWT Refresh Secret
aws secretsmanager create-secret \
  --name shield/jwt-refresh-secret \
  --secret-string "YOUR_JWT_REFRESH_SECRET"
```

### 5. Create IAM Roles

```bash
# ECS Task Execution Role (for pulling images and secrets)
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://infrastructure/aws/iam/ecs-task-execution-role-policy.json

# Attach managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### 6. Deploy Services

```bash
# Make deploy script executable
chmod +x infrastructure/aws/deploy.sh

# Set environment variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012

# Run deployment
./infrastructure/aws/deploy.sh
```

## Manual Deployment Steps

### Build and Push Individual Service

```bash
# Set variables
SERVICE_NAME="auth-service"
AWS_ACCOUNT_ID="123456789012"
AWS_REGION="us-east-1"
ECR_REPO="shield-$SERVICE_NAME"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image
docker build -t $ECR_REPO:latest -f services/$SERVICE_NAME/Dockerfile services/$SERVICE_NAME

# Tag for ECR
docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

### Create ECS Service

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/aws/ecs-task-definitions/$SERVICE_NAME.json

# Create ECS service
aws ecs create-service \
  --cluster shield-cluster \
  --service-name shield-$SERVICE_NAME \
  --task-definition shield-$SERVICE_NAME \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## Environment Variables

Services use AWS Secrets Manager for sensitive configuration:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh secret
- `COMPLIANCE_API_KEY` - Compliance API key (if using external service)

## Monitoring

### CloudWatch Logs

Each service logs to CloudWatch:

- `/ecs/shield-auth-service`
- `/ecs/shield-wallet-service`
- `/ecs/shield-transaction-service`
- `/ecs/shield-blockchain-service`
- `/ecs/shield-compliance-service`
- `/ecs/shield-api-gateway`

### Health Checks

All services expose `/health` endpoints that ECS monitors.

## Scaling

### Auto Scaling Configuration

```bash
# Register auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/shield-cluster/shield-api-gateway \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/shield-cluster/shield-api-gateway \
  --policy-name shield-api-gateway-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

## Cost Optimization

1. **Use Fargate Spot** for non-critical workloads (50-70% savings)
2. **Right-size containers** (adjust CPU/memory based on actual usage)
3. **Enable RDS Multi-AZ** only for production
4. **Use CloudWatch Logs retention** (set to 7-30 days)
5. **Enable ECR image lifecycle policies** (delete old images)

## Troubleshooting

### Service Won't Start

1. Check CloudWatch logs
2. Verify secrets are accessible
3. Check security group rules
4. Verify task definition is correct

### High Costs

1. Review CloudWatch logs retention
2. Check RDS instance size
3. Review ECS task CPU/memory allocation
4. Enable Fargate Spot for dev/staging

## Security Best Practices

1. ✅ Use Secrets Manager for sensitive data
2. ✅ Run containers as non-root user
3. ✅ Enable VPC for network isolation
4. ✅ Use security groups to restrict access
5. ✅ Enable CloudTrail for audit logging
6. ✅ Regular security scanning of images

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy
        run: ./infrastructure/aws/deploy.sh
```

## License

MIT © Shield Security, Inc.

