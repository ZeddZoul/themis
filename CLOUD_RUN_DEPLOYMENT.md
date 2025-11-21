# Google Cloud Run Deployment Guide

This guide will walk you through deploying Themis Checker to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed ([Install Guide](https://docs.docker.com/get-docker/))
4. **PostgreSQL Database** (Cloud SQL or external)

## Step-by-Step Deployment

### 1. Set Up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create themis-checker-prod --name="Themis Checker"

# Set the project
gcloud config set project themis-checker-prod

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  sqladmin.googleapis.com
```

### 2. Set Up Cloud SQL (PostgreSQL)

```bash
# Create a PostgreSQL instance
gcloud sql instances create themis-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD

# Create the database
gcloud sql databases create themis \
  --instance=themis-db

# Get the connection name (you'll need this)
gcloud sql instances describe themis-db --format='value(connectionName)'
```

**Note:** For production, use a larger tier like `db-n1-standard-1` or higher.

### 3. Configure Environment Variables

Create a `.env.production` file with your production environment variables:

```bash
# Database
DATABASE_URL="postgresql://postgres:PASSWORD@/themis?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"

# Session
SESSION_SECRET="generate-a-secure-random-string-here"

# GitHub App
GITHUB_APP_ID="your-github-app-id"
GITHUB_APP_PRIVATE_KEY="your-private-key"
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# App URL
NEXTAUTH_URL="https://your-app-url.run.app"
NEXT_PUBLIC_APP_URL="https://your-app-url.run.app"
```

### 4. Build and Deploy

#### Option A: Using the Deploy Script (Recommended)

```bash
# Make the script executable (already done)
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

#### Option B: Manual Deployment

```bash
# Set your project ID
PROJECT_ID="themis-checker-prod"

# Build the Docker image
docker build -t gcr.io/${PROJECT_ID}/themis-checker:latest .

# Configure Docker to use gcloud as a credential helper
gcloud auth configure-docker

# Push the image
docker push gcr.io/${PROJECT_ID}/themis-checker:latest

# Deploy to Cloud Run
gcloud run deploy themis-checker \
  --image gcr.io/${PROJECT_ID}/themis-checker:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

### 5. Set Environment Variables in Cloud Run

After deployment, set your environment variables:

```bash
# Set environment variables
gcloud run services update themis-checker \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://..." \
  --set-env-vars "SESSION_SECRET=your-secret" \
  --set-env-vars "GITHUB_APP_ID=your-id" \
  --set-env-vars "GEMINI_API_KEY=your-key"
```

**Better approach:** Use Secret Manager for sensitive data:

```bash
# Create secrets
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
echo -n "your-session-secret" | gcloud secrets create session-secret --data-file=-
echo -n "your-github-private-key" | gcloud secrets create github-private-key --data-file=-
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

