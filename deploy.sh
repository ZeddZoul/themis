#!/bin/bash

# Themis Checker - Google Cloud Run Deployment Script
# This script deploys the application to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Themis Checker - Cloud Run Deployment${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: No GCP project configured${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ Using GCP Project: ${PROJECT_ID}${NC}"

# Configuration
SERVICE_NAME="themis-checker"
REGION="${REGION:-us-central1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${BLUE}📦 Building Docker image for Cloud Run (linux/amd64)...${NC}"
docker build --platform linux/amd64 -t ${IMAGE_NAME}:latest .

echo -e "${BLUE}📤 Pushing image to Google Container Registry...${NC}"
docker push ${IMAGE_NAME}:latest

echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"

# Deploy to Cloud Run
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production" \
  --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo -e "\n${YELLOW}⚠️  Don't forget to:${NC}"
echo -e "  1. Set environment variables in Cloud Run console"
echo -e "  2. Configure your database connection"
echo -e "  3. Set up GitHub App credentials"
echo -e "  4. Configure Gemini API key"
