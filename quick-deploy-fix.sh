#!/bin/bash

echo "🚀 Deploying OAuth scope fix to Cloud Run..."

# Build and deploy
gcloud run deploy themis-checker \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --quiet

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Visit your app and logout"
echo "2. Login again to get new OAuth token with proper scopes"
echo "3. Check /api/v1/debug/session to verify"
echo "4. Try loading repos again"
echo ""
echo "🔍 To view logs:"
echo "gcloud run services logs read themis-checker --region=us-central1 --limit=50"
