# Quick Deploy to Google Cloud Run

## TL;DR - Fast Track

```bash
# 1. Setup GCP (interactive wizard)
./setup-gcp.sh

# 2. Deploy
./deploy.sh

# 3. Done! 🎉
```

## Prerequisites

- Google Cloud account with billing
- gcloud CLI installed
- Docker installed

## Three-Step Deployment

### Step 1: Initial Setup (One-time)

```bash
# Run the setup wizard
./setup-gcp.sh
```

This will:
- Create/configure GCP project
- Enable required APIs
- Set up Cloud SQL database
- Create secrets in Secret Manager

### Step 2: Deploy Application

```bash
# Deploy to Cloud Run
./deploy.sh
```

This will:
- Build Docker image
- Push to Container Registry
- Deploy to Cloud Run
- Output your service URL

### Step 3: Configure Environment

After deployment, get your service URL:

```bash
gcloud run services describe themis-checker \
  --region us-central1 \
  --format='value(status.url)'
```

Update these environment variables with your URL:

```bash
gcloud run services update themis-checker \
  --region us-central1 \
  --update-env-vars \
NEXTAUTH_URL="https://your-url.run.app",\
NEXT_PUBLIC_APP_URL="https://your-url.run.app"
```

## Environment Variables Checklist

Make sure these are set in Cloud Run:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `SESSION_SECRET` - Random 32+ character string
- [ ] `GITHUB_APP_ID` - Your GitHub App ID
- [ ] `GITHUB_APP_PRIVATE_KEY` - GitHub App private key
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth secret
- [ ] `GITHUB_WEBHOOK_SECRET` - Webhook secret
- [ ] `GEMINI_API_KEY` - Google Gemini API key
- [ ] `NEXTAUTH_URL` - Your Cloud Run URL
- [ ] `NEXT_PUBLIC_APP_URL` - Your Cloud Run URL

## Update Deployment

```bash
# Make your changes, then:
./deploy.sh
```

## View Logs

```bash
# Real-time logs
gcloud run services logs tail themis-checker --region us-central1

# Recent logs
gcloud run services logs read themis-checker --region us-central1 --limit 100
```

## Troubleshooting

**Container won't start?**
```bash
# Check logs
gcloud run services logs read themis-checker --region us-central1

# Common fixes:
# - Verify all environment variables are set
# - Check database connection string
# - Ensure port 8080 is exposed
```

**Database connection failed?**
```bash
# Test database connection
gcloud sql connect themis-db --user=postgres

# Verify Cloud SQL instance is linked
gcloud run services describe themis-checker --region us-central1
```

**Build failed?**
```bash
# Test build locally
docker build -t test .

# Check for errors in Dockerfile or dependencies
```

## Cost Estimate

**Development:**
- Cloud Run: ~$5-10/month
- Cloud SQL: ~$7/month
- **Total: ~$12-17/month**

**Production:**
- Cloud Run: ~$20-50/month
- Cloud SQL: ~$50/month
- **Total: ~$70-100/month**

## Need More Details?

See `DEPLOYMENT_GUIDE.md` for comprehensive documentation.

## Support

- Cloud Run Docs: https://cloud.google.com/run/docs
- Cloud SQL Docs: https://cloud.google.com/sql/docs
- Pricing Calculator: https://cloud.google.com/products/calculator
