#!/bin/bash

# Load environment variables from .env.local and set them in Cloud Run

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting Cloud Run Environment Variables${NC}\n"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Create .env.local with your environment variables first"
    exit 1
fi

# Read specific variables from .env.local
DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"')
SESSION_SECRET=$(grep "^SESSION_SECRET=" .env.local | cut -d '=' -f2- | tr -d '"')
GITHUB_APP_ID=$(grep "^GITHUB_APP_ID=" .env.local | cut -d '=' -f2- | tr -d '"')
GITHUB_CLIENT_ID=$(grep "^GITHUB_CLIENT_ID=" .env.local | cut -d '=' -f2- | tr -d '"')
GITHUB_CLIENT_SECRET=$(grep "^GITHUB_CLIENT_SECRET=" .env.local | cut -d '=' -f2- | tr -d '"')
GITHUB_WEBHOOK_SECRET=$(grep "^GITHUB_WEBHOOK_SECRET=" .env.local | cut -d '=' -f2- | tr -d '"')
GEMINI_API_KEY=$(grep "^GEMINI_API_KEY=" .env.local | cut -d '=' -f2- | tr -d '"')

# For multi-line private key, read it differently
GITHUB_APP_PRIVATE_KEY=$(awk '/^GITHUB_APP_PRIVATE_KEY=/{flag=1; sub(/^GITHUB_APP_PRIVATE_KEY=/, ""); print; next} flag && /END/{print; flag=0; next} flag' .env.local | tr -d '"')

# Get Cloud SQL connection name
echo -e "${BLUE}Getting Cloud SQL connection name...${NC}"
CONNECTION_NAME=$(gcloud sql instances describe themis-db --format='value(connectionName)' 2>/dev/null || echo "")

# Update DATABASE_URL to use Cloud SQL socket if needed
if [ ! -z "$CONNECTION_NAME" ]; then
    echo -e "${GREEN}✓ Found Cloud SQL instance: ${CONNECTION_NAME}${NC}"
    # Update DATABASE_URL to use Cloud SQL socket format
    DATABASE_URL="postgresql://postgres:${DATABASE_URL##*:}@/themis?host=/cloudsql/${CONNECTION_NAME}"
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe themis-checker --region us-central1 --format='value(status.url)')

echo -e "${BLUE}Updating Cloud Run service...${NC}"

# Set environment variables
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
GITHUB_APP_PRIVATE_KEY="${GITHUB_APP_PRIVATE_KEY}",\
GEMINI_API_KEY="${GEMINI_API_KEY}",\
NODE_ENV="production",\
NEXTAUTH_URL="${SERVICE_URL}",\
NEXT_PUBLIC_APP_URL="${SERVICE_URL}"

echo -e "\n${GREEN}✅ Environment variables set successfully!${NC}"
echo -e "${BLUE}Service URL: ${SERVICE_URL}${NC}"
echo -e "\n${YELLOW}⚠️  Next steps:${NC}"
echo -e "1. Run database migrations: ${YELLOW}npx prisma migrate deploy${NC}"
echo -e "2. Update GitHub App URLs with: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "3. Test your app at: ${YELLOW}${SERVICE_URL}${NC}"
