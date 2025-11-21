# Google Cloud Run Deployment Guide

Complete guide to deploy Themis Checker on Google Cloud Run.

## Prerequisites

- Google Cloud account with billing enabled
- gcloud CLI installed: https://cloud.google.com/sdk/docs/install
- Docker installed: https://docs.docker.com/get-docker/
- PostgreSQL database (Cloud SQL or external)

## Step 1: Set Up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create themis-checker-prod --name="Themis Checker"

# Set the project
gcloud config set project themis-checker-prod

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

## Step 2: Set Up Cloud SQL PostgreSQL Database

```bash
# Create PostgreSQL instance
gcloud sql instances create themis-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create themis --instance=themis-db

# Get connection name (save this!)
gcloud sql instances describe themis-db --format='value(connectionName)'
# Output: project-id:region:instance-name
```

**For production:** Use `db-n1-standard-1` or higher tier.

## Step 3: Prepare Environment Variables

Create environment variables file for reference:

```bash
# Database (Cloud SQL format)
DATABASE_URL="postgresql://postgres:PASSWORD@/themis?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"

# Session
SESSION_SECRET="generate-secure-random-string-min-32-chars"

# GitHub App
GITHUB_APP_ID="123456"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_CLIENT_ID="Iv1.abc123"
GITHUB_CLIENT_SECRET="your-client-secret"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# App URL (update after deployment)
NEXTAUTH_URL="https://themis-checker-xxx.run.app"
NEXT_PUBLIC_APP_URL="https://themis-checker-xxx.run.app"
```

## Step 4: Build and Deploy

### Option A: Quick Deploy (Recommended)

```bash
# Run the deployment script
./deploy.sh
```

### Option B: Manual Step-by-Step

```bash
# 1. Configure Docker authentication
gcloud auth configure-docker

# 2. Set project ID
export PROJECT_ID=$(gcloud config get-value project)

# 3. Build Docker image
docker build -t gcr.io/${PROJECT_ID}/themis-checker:latest .

# 4. Push to Container Registry
docker push gcr.io/${PROJECT_ID}/themis-checker:latest

# 5. Deploy to Cloud Run
gcloud run deploy themis-checker \
  --image gcr.io/${PROJECT_ID}/themis-checker:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME
```

## Step 5: Configure Environment Variables

### Method A: Using gcloud CLI

```bash
gcloud run services update themis-checker \
  --region us-central1 \
  --update-env-vars \
NODE_ENV=production,\
DATABASE_URL="postgresql://postgres:PASSWORD@/themis?host=/cloudsql/PROJECT:REGION:INSTANCE",\
SESSION_SECRET="your-secret",\
GITHUB_APP_ID="123456",\
GITHUB_CLIENT_ID="Iv1.abc",\
GITHUB_CLIENT_SECRET="secret",\
GEMINI_API_KEY="key",\
NEXTAUTH_URL="https://your-url.run.app"
```

### Method B: Using Secret Manager (Recommended for Production)

```bash
# Create secrets
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
echo -n "your-session-secret" | gcloud secrets create session-secret --data-file=-
echo -n "your-github-private-key" | gcloud secrets create github-private-key --data-file=-
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-

# Get service account email
gcloud run services describe themis-checker --region us-central1 --format='value(spec.template.spec.serviceAccountName)'

# Grant access to secrets
for secret in database-url session-secret github-private-key gemini-api-key; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor"
done

# Update Cloud Run to use secrets
gcloud run services update themis-checker \
  --region us-central1 \
  --update-secrets \
DATABASE_URL=database-url:latest,\
SESSION_SECRET=session-secret:latest,\
GITHUB_APP_PRIVATE_KEY=github-private-key:latest,\
GEMINI_API_KEY=gemini-api-key:latest
```

## Step 6: Run Database Migrations

```bash
# Connect to Cloud SQL
gcloud sql connect themis-db --user=postgres

# Or run migrations via Cloud Run job
gcloud run jobs create migrate-db \
  --image gcr.io/${PROJECT_ID}/themis-checker:latest \
  --region us-central1 \
  --set-env-vars DATABASE_URL="..." \
  --command "npx" \
  --args "prisma,migrate,deploy"

gcloud run jobs execute migrate-db --region us-central1
```

## Step 7: Get Your Service URL

```bash
# Get the deployed URL
gcloud run services describe themis-checker \
  --region us-central1 \
  --format='value(status.url)'
```

Update your environment variables with this URL:
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- GitHub App callback URL

## Step 8: Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service themis-checker \
  --domain your-domain.com \
  --region us-central1

# Follow DNS instructions provided
```

## Monitoring and Logs

```bash
# View logs
gcloud run services logs read themis-checker --region us-central1

# Stream logs
gcloud run services logs tail themis-checker --region us-central1

# View metrics in Cloud Console
# https://console.cloud.google.com/run
```

## Updating the Application

```bash
# Rebuild and redeploy
docker build -t gcr.io/${PROJECT_ID}/themis-checker:latest .
docker push gcr.io/${PROJECT_ID}/themis-checker:latest

gcloud run deploy themis-checker \
  --image gcr.io/${PROJECT_ID}/themis-checker:latest \
  --region us-central1
```

## Cost Optimization Tips

1. **Use minimum instances = 0** for development (cold starts acceptable)
2. **Set appropriate memory/CPU** (2Gi/2CPU is generous, test with less)
3. **Enable request timeout** to prevent runaway processes
4. **Use Cloud SQL proxy** for secure database connections
5. **Monitor usage** in Cloud Console billing section

## Troubleshooting

### Container fails to start
```bash
# Check logs
gcloud run services logs read themis-checker --region us-central1 --limit 50

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port not set to 8080
```

### Database connection issues
```bash
# Verify Cloud SQL connection
gcloud sql instances describe themis-db

# Test connection
gcloud sql connect themis-db --user=postgres

# Check if Cloud SQL instance is added to Cloud Run
gcloud run services describe themis-checker --region us-central1
```

### Build failures
```bash
# Build locally first
docker build -t test-build .

# Check Dockerfile syntax
# Verify all dependencies in package.json
# Ensure Prisma schema is valid
```

## Security Checklist

- [ ] Use Secret Manager for sensitive data
- [ ] Enable Cloud Armor for DDoS protection
- [ ] Set up VPC connector for private database access
- [ ] Configure IAM roles with least privilege
- [ ] Enable Cloud Audit Logs
- [ ] Set up SSL/TLS with custom domain
- [ ] Configure CORS properly
- [ ] Enable Cloud Run authentication if needed

## Production Recommendations

1. **Database**: Use Cloud SQL with automated backups
2. **Secrets**: Store all secrets in Secret Manager
3. **Monitoring**: Set up Cloud Monitoring alerts
4. **Logging**: Enable structured logging
5. **CI/CD**: Use Cloud Build for automated deployments
6. **Scaling**: Configure min/max instances based on traffic
7. **Region**: Deploy in multiple regions for high availability

## Automated CI/CD with Cloud Build

The `cloudbuild.yaml` file is included for automated deployments:

```bash
# Connect your GitHub repository
gcloud builds triggers create github \
  --repo-name=your-repo \
  --repo-owner=your-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml

# Manual trigger
gcloud builds submit --config cloudbuild.yaml
```

## Support

For issues or questions:
- Check Cloud Run logs
- Review Cloud SQL connection status
- Verify environment variables are set
- Test locally with Docker first

## Estimated Costs

**Development (low traffic):**
- Cloud Run: ~$5-10/month
- Cloud SQL (db-f1-micro): ~$7/month
- Total: ~$12-17/month

**Production (moderate traffic):**
- Cloud Run: ~$20-50/month
- Cloud SQL (db-n1-standard-1): ~$50/month
- Total: ~$70-100/month

Actual costs depend on usage. Monitor in Cloud Console.
