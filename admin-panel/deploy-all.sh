#!/bin/bash

# Admin Panel Complete Deployment Script
# This script deploys BOTH admin panel backend and frontend

# Exit immediately if a command exits with a non-zero status.
set -e

PROJECT_ID="tax-filing-app-3649f" # Your Google Cloud Project ID
REGION="us-central1" # Your Cloud Run region

echo "🚀 Starting COMPLETE ADMIN PANEL deployment to Google Cloud Run"
echo "📋 Project ID: $PROJECT_ID"
echo "📋 Region: $REGION"
echo ""

# Verify we're in the admin-panel directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: This script must be run from the admin-panel directory"
    echo "📁 Current directory: $(pwd)"
    echo "🔧 Please run: cd admin-panel && ./deploy-all.sh"
    exit 1
fi

echo "✅ Confirmed: Admin Panel directory"

# Step 1: Deploy Backend
echo ""
echo "🔧 Step 1: Deploying Admin Panel Backend..."
echo "================================================"
cd backend
./deploy.sh
cd ..

# Step 2: Get Backend URL
echo ""
echo "🔧 Step 2: Getting Backend URL..."
BACKEND_URL=$(gcloud run services describe admin-panel-backend --region=$REGION --project=$PROJECT_ID --format='value(status.url)')
echo "✅ Backend URL: $BACKEND_URL"

# Step 3: Update Frontend Environment
echo ""
echo "🔧 Step 3: Updating Frontend Environment Variables..."
cd frontend

# Update the cloudbuild.yaml with the actual backend URL
sed -i "s|REACT_APP_API_URL=https://admin-panel-backend-693306869303.us-central1.run.app|REACT_APP_API_URL=$BACKEND_URL|g" cloudbuild.yaml

echo "✅ Frontend environment updated with backend URL"

# Step 4: Deploy Frontend
echo ""
echo "🔧 Step 4: Deploying Admin Panel Frontend..."
echo "================================================"
./deploy.sh
cd ..

# Step 5: Get Frontend URL
echo ""
echo "🔧 Step 5: Getting Frontend URL..."
FRONTEND_URL=$(gcloud run services describe admin-panel-frontend --region=$REGION --project=$PROJECT_ID --format='value(status.url)')
echo "✅ Frontend URL: $FRONTEND_URL"

echo ""
echo "🎉 ADMIN PANEL DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "================================================"
echo "🔗 Backend URL:  $BACKEND_URL"
echo "🔗 Frontend URL: $FRONTEND_URL"
echo ""
echo "📱 You can now access your admin panel at: $FRONTEND_URL"
echo "🔧 Backend API is available at: $BACKEND_URL"
echo ""
echo "⚠️  Note: Make sure to update your CORS settings if needed"
