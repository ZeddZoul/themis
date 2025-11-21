#!/bin/bash

# Themis Checker - Google Cloud Setup Script
# This script helps you set up the GCP environment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Themis Checker - GCP Setup Wizard       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
echo -e "${GREEN}✓ gcloud CLI installed${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

# Get or create project
echo -e "\n${BLUE}Step 1: Project Setup${NC}"
read -p "Enter your GCP Project ID (or press Enter to create new): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    read -p "Enter new project ID (e.g., themis-checker-prod): " PROJECT_ID
    echo -e "${YELLOW}Creating project ${PROJECT_ID}...${NC}"
    gcloud projects create $PROJECT_ID --name="Themis Checker"
fi

gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Project set to: ${PROJECT_ID}${NC}"

# Enable APIs
echo -e "\n${BLUE}Step 2: Enabling Required APIs${NC}"
echo "This may take a few minutes..."

gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com

echo -e "${GREEN}✓ APIs enabled${NC}"

# Database setup
echo -e "\n${BLUE}Step 3: Database Setup${NC}"
read -p "Create Cloud SQL PostgreSQL instance? (y/n): " CREATE_DB

if [ "$CREATE_DB" = "y" ]; then
    read -p "Enter database instance name (default: themis-db): " DB_INSTANCE
    DB_INSTANCE=${DB_INSTANCE:-themis-db}
    
    read -p "Enter region (default: us-central1): " REGION
    REGION=${REGION:-us-central1}
    
    read -sp "Enter database root password: " DB_PASSWORD
    echo
    
    echo -e "${YELLOW}Creating Cloud SQL instance...${NC}"
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$DB_PASSWORD
    
    echo -e "${YELLOW}Creating database...${NC}"
    gcloud sql databases create themis --instance=$DB_INSTANCE
    
    CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)')
    echo -e "${GREEN}✓ Database created${NC}"
    echo -e "${GREEN}Connection name: ${CONNECTION_NAME}${NC}"
    
    DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@/themis?host=/cloudsql/${CONNECTION_NAME}"
else
    read -p "Enter your DATABASE_URL: " DATABASE_URL
fi

# Secrets setup
echo -e "\n${BLUE}Step 4: Setting Up Secrets${NC}"
read -p "Use Secret Manager for sensitive data? (recommended) (y/n): " USE_SECRETS

if [ "$USE_SECRETS" = "y" ]; then
    echo -e "${YELLOW}Creating secrets...${NC}"
    
    echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=- 2>/dev/null || \
        echo -n "$DATABASE_URL" | gcloud secrets versions add database-url --data-file=-
    
    read -sp "Enter SESSION_SECRET (min 32 chars): " SESSION_SECRET
    echo
    echo -n "$SESSION_SECRET" | gcloud secrets create session-secret --data-file=- 2>/dev/null || \
        echo -n "$SESSION_SECRET" | gcloud secrets versions add session-secret --data-file=-
    
    read -sp "Enter GEMINI_API_KEY: " GEMINI_KEY
    echo
    echo -n "$GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=- 2>/dev/null || \
        echo -n "$GEMINI_KEY" | gcloud secrets versions add gemini-api-key --data-file=-
    
    echo -e "${GREEN}✓ Secrets created${NC}"
fi

# Summary
echo -e "\n${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Setup Complete!                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Run: ${YELLOW}./deploy.sh${NC} to deploy the application"
echo -e "2. Configure remaining environment variables in Cloud Run"
echo -e "3. Update GitHub App callback URLs with your Cloud Run URL"
echo -e "\n${BLUE}Useful commands:${NC}"
echo -e "  View logs: ${YELLOW}gcloud run services logs read themis-checker --region ${REGION:-us-central1}${NC}"
echo -e "  Update service: ${YELLOW}gcloud run services update themis-checker --region ${REGION:-us-central1}${NC}"
echo -e "\n${GREEN}Happy deploying! 🚀${NC}\n"
