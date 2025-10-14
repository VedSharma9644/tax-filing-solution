# 🚀 Google Cloud Run Deployment Guide

This guide will help you deploy your Tax Filing Backend to Google Cloud Run.

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud CLI** installed and configured
3. **Docker** installed on your local machine
4. **Node.js** 18+ installed

## 🔧 Setup Steps

### 1. Install Google Cloud CLI

**Windows:**
```bash
# Download and install from:
# https://cloud.google.com/sdk/docs/install
```

**macOS:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

### 3. Set Your Project ID

```bash
# Replace with your actual project ID
gcloud config set project tax-filing-app-472019
```

### 4. Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## 🚀 Deployment Options

### Option 1: Quick Deploy (Recommended)

```bash
# Make the script executable (Linux/macOS)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### Option 2: Manual Deploy

```bash
# 1. Build the Docker image
docker build -t gcr.io/tax-filing-app-472019/tax-filing-backend .

# 2. Push to Google Container Registry
docker push gcr.io/tax-filing-app-472019/tax-filing-backend

# 3. Deploy to Cloud Run
gcloud run deploy tax-filing-backend \
  --image gcr.io/tax-filing-app-472019/tax-filing-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 5000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 80 \
  --timeout 300
```

### Option 3: Deploy from GitHub (CI/CD)

1. Push your code to GitHub
2. Connect Google Cloud Build to your repository
3. Cloud Build will automatically deploy on every push

## 🔐 Environment Variables

Set these in Google Cloud Console > Cloud Run > Your Service > Edit & Deploy New Revision:

### Required Variables:
- `NODE_ENV=production`
- `PORT=5000`
- `JWT_SECRET=your-super-secure-jwt-secret`
- `FIREBASE_PROJECT_ID=tax-filing-app-3649f`
- `GCS_PROJECT_ID=tax-filing-app-472019`
- `GCS_BUCKET_NAME=tax-filing-documents-tax-filing-app-472019`

### Optional Variables:
- `CORS_ORIGIN=https://your-mobile-app-domain.com`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=100`

## 🔑 Service Account Permissions

Your Cloud Run service needs these IAM roles:
- `Cloud Run Invoker`
- `Firebase Admin`
- `Storage Admin`
- `Cloud KMS CryptoKey Encrypter/Decrypter`

## 🧪 Testing Your Deployment

After deployment, test these endpoints:

```bash
# Health check
curl https://your-service-url.run.app/health

# Root endpoint
curl https://your-service-url.run.app/

# Test with your mobile app
# Update API_BASE_URL in your mobile app to the new URL
```

## 📱 Update Mobile App

Update your mobile app's API configuration:

```javascript
// In TaxFilingApp/services/api.js
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development URLs (keep existing)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000';
    }
    return 'http://192.168.1.34:5000';
  }
  
  // Production URL
  return 'https://your-service-url.run.app';
};
```

## 🔍 Monitoring & Logs

- **Logs**: Google Cloud Console > Cloud Run > Your Service > Logs
- **Metrics**: Google Cloud Console > Cloud Run > Your Service > Metrics
- **Alerts**: Set up alerts for errors and high latency

## 💰 Cost Optimization

- **Min Instances**: 0 (scales to zero when not in use)
- **Max Instances**: 10 (adjust based on expected traffic)
- **Memory**: 1Gi (adjust based on usage)
- **CPU**: 1 (adjust based on usage)

## 🚨 Troubleshooting

### Common Issues:

1. **Authentication Error**: Run `gcloud auth application-default login`
2. **Permission Denied**: Check IAM roles for your service account
3. **Build Fails**: Check Dockerfile and .dockerignore
4. **Service Won't Start**: Check logs in Google Cloud Console

### Debug Commands:

```bash
# Check service status
gcloud run services describe tax-filing-backend --region=us-central1

# View logs
gcloud logs read --service=tax-filing-backend --limit=50

# Test locally
docker run -p 5000:5000 gcr.io/tax-filing-app-472019/tax-filing-backend
```

## 📞 Support

If you encounter issues:
1. Check the logs in Google Cloud Console
2. Verify all environment variables are set
3. Ensure service account has proper permissions
4. Test the Docker image locally first

---

**🎉 Congratulations! Your backend is now running on Google Cloud Run!**
