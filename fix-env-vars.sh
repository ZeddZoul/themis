#!/bin/bash

# Quick fix for environment variables

set -e

echo "🔧 Fixing Cloud Run Environment Variables"

# Get service URL
SERVICE_URL=$(gcloud run services describe themis-checker --region us-central1 --format='value(status.url)')
echo "Service URL: ${SERVICE_URL}"

# Get Cloud SQL connection
CONNECTION_NAME=$(gcloud sql instances describe themis-db --format='value(connectionName)')
echo "Cloud SQL: ${CONNECTION_NAME}"

# Prompt for each variable
echo ""
echo "Enter your environment variables:"
echo ""

read -p "GITHUB_CLIENT_ID: " GITHUB_CLIENT_ID
read -p "GITHUB_CLIENT_SECRET: " GITHUB_CLIENT_SECRET
read -p "GITHUB_APP_ID: " GITHUB_APP_ID
read -p "GITHUB_WEBHOOK_SECRET: " GITHUB_WEBHOOK_SECRET
read -p "GEMINI_API_KEY: " GEMINI_API_KEY
read -sp "Database Password: " DB_PASSWORD
echo ""
read -p "SESSION_SECRET (or press Enter to generate): " SESSION_SECRET

if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET=$(openssl rand -base64 32)
    echo "Generated SESSION_SECRET: ${SESSION_SECRET}"
fi

# Construct DATABASE_URL
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@/themis?host=/cloudsql/${CONNECTION_NAME}"

echo ""
echo "Setting environment variables..."

gcloud run services update themis-checker \
  --region us-central1 \
  --add-cloudsql-instances ${CONNECTION_NAME} \
  --update-env-vars \
DATABASE_URL="${DATABASE_URL}",\
SESSION_SECRET="${SESSION_SECRET}",\
GITHUB_APP_ID="${GITHUB_APP_ID}",\
GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID}",\
GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET}",\
GITHUB_WEBHOOK_SECRET="${GITHUB_WEBHOOK_SECRET}",\
GEMINI_API_KEY="${GEMINI_API_KEY}",\
NODE_ENV="production",\
NEXTAUTH_URL="${SERVICE_URL}",\
NEXT_PUBLIC_APP_URL="${SERVICE_URL}"

echo ""
echo "✅ Done! Environment variables set."
echo ""
echo "⚠️  For GITHUB_APP_PRIVATE_KEY (multi-line), set it separately:"
echo "gcloud run services update themis-checker --region us-central1 --update-env-vars GITHUB_APP_PRIVATE_KEY=\"\$(cat your-private-key.pem)\""
