#!/bin/bash

echo "🔄 Forcing Cloud Run service restart..."

# Get current revision
CURRENT_REVISION=$(gcloud run services describe themis-checker \
  --region us-central1 \
  --format='value(status.latestReadyRevisionName)')

echo "Current revision: ${CURRENT_REVISION}"

# Force a new deployment by updating a dummy env var
gcloud run services update themis-checker \
  --region us-central1 \
  --update-env-vars FORCE_RESTART="$(date +%s)"

echo ""
echo "✅ Service restarted!"
echo ""
echo "Wait 30 seconds for the new revision to be ready, then test:"
echo "https://themis-checker-ebiucphrzq-uc.a.run.app"
