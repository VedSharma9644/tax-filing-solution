#!/bin/bash

# Admin Panel Frontend Deployment Script
# This script deploys ONLY the admin panel frontend

# Exit immediately if a command exits with a non-zero status.
set -e

PROJECT_ID="tax-filing-app-3649f" # Your Google Cloud Project ID
SERVICE_NAME="admin-panel-frontend" # Admin Panel Frontend service name
REGION="us-central1" # Your Cloud Run region

echo "🚀 Starting ADMIN PANEL FRONTEND deployment to Google Cloud Run"
echo "📋 Project ID: $PROJECT_ID"
echo "📋 Service Name: $SERVICE_NAME"
echo "📋 Region: $REGION"
echo ""

# Verify we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "src/App.js" ]; then
    echo "❌ Error: This script must be run from the admin-panel/frontend directory"
    echo "📁 Current directory: $(pwd)"
    echo "🔧 Please run: cd admin-panel/frontend && ./deploy.sh"
    exit 1
fi

# Verify this is the admin panel frontend (not mobile app)
if ! grep -q "react-scripts" package.json; then
    echo "❌ Error: This doesn't appear to be the admin panel frontend directory"
    echo "📁 Please ensure you're in admin-panel/frontend directory"
    exit 1
fi

echo "✅ Confirmed: Admin Panel Frontend directory"

# Authenticate gcloud (if not already authenticated)
echo "🔐 Authenticating with Google Cloud..."
gcloud auth configure-docker

# Submit the build to Cloud Build using cloudbuild.yaml
echo "📦 Submitting build to Cloud Build..."
echo "⚠️  This will deploy the ADMIN PANEL FRONTEND only"
echo ""

gcloud builds submit --config=cloudbuild.yaml . --project=$PROJECT_ID

echo ""
echo "✅ Admin Panel Frontend deployment completed successfully!"
echo "🌐 Your admin panel frontend is now running on Google Cloud Run"
echo ""
echo "🔗 To get the service URL, run:"
echo "gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)'"
