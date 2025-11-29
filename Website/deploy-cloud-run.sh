#!/bin/bash

# Configuration
PROJECT_ID="tax-filing-app-3649f"
REGION="us-central1"
SERVICE_NAME="tax-filing-website"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying website to Google Cloud Run"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# Set the project
gcloud config set project ${PROJECT_ID}

# Build the Docker image
echo "📦 Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME} --project ${PROJECT_ID}

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --project ${PROJECT_ID}

echo ""
echo "✅ Deployment complete!"
echo "Get the service URL with: gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)'"

