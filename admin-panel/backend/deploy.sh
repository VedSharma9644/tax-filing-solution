#!/bin/bash

# Admin Panel Backend Deployment Script
# This script deploys ONLY the admin panel backend, not the mobile app backend

# Exit immediately if a command exits with a non-zero status.
set -e

PROJECT_ID="tax-filing-app-3649f" # Your Google Cloud Project ID
SERVICE_NAME="admin-panel-backend" # Admin Panel Backend service name
REGION="us-central1" # Your Cloud Run region

echo "🚀 Starting ADMIN PANEL BACKEND deployment to Google Cloud Run"
echo "📋 Project ID: $PROJECT_ID"
echo "📋 Service Name: $SERVICE_NAME"
echo "📋 Region: $REGION"
echo ""

# Verify we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "index.js" ]; then
    echo "❌ Error: This script must be run from the admin-panel/backend directory"
    echo "📁 Current directory: $(pwd)"
    echo "🔧 Please run: cd admin-panel/backend && ./deploy.sh"
    exit 1
fi

# Verify this is the admin panel backend (not mobile backend)
if ! grep -q "admin-panel-backend" package.json; then
    echo "❌ Error: This doesn't appear to be the admin panel backend directory"
    echo "📁 Please ensure you're in admin-panel/backend directory"
    exit 1
fi

echo "✅ Confirmed: Admin Panel Backend directory"

# Authenticate gcloud (if not already authenticated)
echo "🔐 Authenticating with Google Cloud..."
gcloud auth configure-docker

# Submit the build to Cloud Build using cloudbuild.yaml
echo "📦 Submitting build to Cloud Build..."
echo "⚠️  This will deploy the ADMIN PANEL BACKEND only"
echo ""

gcloud builds submit --config=cloudbuild.yaml . --project=$PROJECT_ID

echo ""
echo "✅ Admin Panel Backend deployment completed successfully!"
echo "🌐 Your admin panel backend is now running on Google Cloud Run"
echo "📱 Update your admin panel frontend's API_BASE_URL to the Cloud Run URL"
echo ""
echo "🔗 To get the service URL, run:"
echo "gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)'"
