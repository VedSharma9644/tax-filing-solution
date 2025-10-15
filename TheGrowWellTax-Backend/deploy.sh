#!/bin/bash

# Tax Filing Backend Deployment Script
# Updated for correct project: tax-filing-app-3649f

set -e  # Exit on any error

echo "🚀 Starting Tax Filing Backend Deployment..."

# Configuration
PROJECT_ID="tax-filing-app-3649f"
SERVICE_NAME="tax-filing-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "📋 Deployment Configuration:"
echo "  - Project ID: ${PROJECT_ID}"
echo "  - Service Name: ${SERVICE_NAME}"
echo "  - Region: ${REGION}"
echo "  - Image: ${IMAGE_NAME}"

# Step 1: Set the project
echo "🔧 Setting Google Cloud project..."
gcloud config set project ${PROJECT_ID}

# Step 2: Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Step 3: Build and push Docker image
echo "🐳 Building Docker image..."
docker build -t ${IMAGE_NAME} .

echo "📤 Pushing image to Google Container Registry..."
docker push ${IMAGE_NAME}

# Step 4: Deploy to Cloud Run
echo "🚀 Deploying to Google Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 5000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,PORT=5000,JWT_SECRET=Y5CV6Cm0eNewJOvbzDmujrskwZCUoISUtNzG6+hA/R5hP3Vxr0FjRG8AWLut2SNPzHicB/2uUM2LLseFdW2isA==,FIREBASE_PROJECT_ID=tax-filing-app-3649f,GCS_PROJECT_ID=tax-filing-app-3649f,GCS_BUCKET_NAME=tax-filing-documents-tax-filing-app-3649f,KMS_PROJECT_ID=tax-filing-app-3649f,KMS_LOCATION=global,KMS_KEY_RING=tax-filing-key-ring,KMS_KEY_NAME=tax-filing-key"

echo "✅ Deployment completed successfully!"
echo "🌐 Your backend is now running on Google Cloud Run"
echo "📱 Update your mobile app's API_BASE_URL to the Cloud Run URL"
