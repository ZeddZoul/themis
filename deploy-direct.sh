#!/bin/bash
set -e

# Configuration
PROJECT_ID="themis-checker"
SERVICE_NAME="themis-checker"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Building Docker image locally..."
docker build -t ${IMAGE_NAME}:latest .

echo "📤 Pushing image to Google Container Registry..."
docker push ${IMAGE_NAME}:latest

echo "☁️  Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0

echo "✅ Deployment complete!"
echo "🌐 Service URL:"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)'
