# Admin Panel Deployment Guide

This guide explains how to deploy the admin panel (both frontend and backend) to Google Cloud Run using Cloud Build.

## 🚨 Important Safety Notes

- **This deploys ONLY the admin panel** - it will NOT affect your mobile app backend
- **Separate service names** are used to avoid conflicts
- **Different ports** are used (5001 for admin backend vs 5000 for mobile backend)

## 📋 Prerequisites

1. **Google Cloud CLI** installed and authenticated
2. **Project ID**: `tax-filing-app-3649f`
3. **Region**: `us-central1`
4. **Required APIs enabled**:
   - Cloud Run API
   - Cloud Build API
   - Container Registry API

## 🚀 Deployment Options

### Option 1: Deploy Everything at Once (Recommended)

```bash
cd admin-panel
./deploy-all.sh
```

This will:
1. Deploy the admin panel backend
2. Get the backend URL
3. Update frontend environment variables
4. Deploy the admin panel frontend
5. Provide both URLs

### Option 2: Deploy Backend Only

```bash
cd admin-panel/backend
./deploy.sh
```

### Option 3: Deploy Frontend Only

```bash
cd admin-panel/frontend
./deploy.sh
```

## 🔧 Manual Deployment Steps

### Backend Deployment

1. **Navigate to backend directory**:
   ```bash
   cd admin-panel/backend
   ```

2. **Deploy using Cloud Build**:
   ```bash
   gcloud builds submit --config=cloudbuild.yaml . --project=tax-filing-app-3649f
   ```

3. **Get the service URL**:
   ```bash
   gcloud run services describe admin-panel-backend --region=us-central1 --project=tax-filing-app-3649f --format='value(status.url)'
   ```

### Frontend Deployment

1. **Navigate to frontend directory**:
   ```bash
   cd admin-panel/frontend
   ```

2. **Update API URL** (replace with your backend URL):
   ```bash
   # Update cloudbuild.yaml with your backend URL
   sed -i "s|REACT_APP_API_URL=https://admin-panel-backend-693306869303.us-central1.run.app|REACT_APP_API_URL=YOUR_BACKEND_URL|g" cloudbuild.yaml
   ```

3. **Deploy using Cloud Build**:
   ```bash
   gcloud builds submit --config=cloudbuild.yaml . --project=tax-filing-app-3649f
   ```

4. **Get the service URL**:
   ```bash
   gcloud run services describe admin-panel-frontend --region=us-central1 --project=tax-filing-app-3649f --format='value(status.url)'
   ```

## 🌐 Service URLs

After deployment, you'll get URLs like:
- **Backend**: `https://admin-panel-backend-693306869303.us-central1.run.app`
- **Frontend**: `https://admin-panel-frontend-693306869303.us-central1.run.app`

## 🔐 Environment Variables

The following environment variables are automatically set during deployment:

### Backend Environment Variables
- `NODE_ENV=production`
- `JWT_SECRET=Y5CV6Cm0eNewJOvbzDmujrskwZCUoISUtNzG6+hA/R5hP3Vxr0FjRG8AWLut2SNPzHicB/2uUM2LLseFdW2isA==`
- `JWT_EXPIRES_IN=24h`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `FIREBASE_PROJECT_ID=tax-filing-app-3649f`
- `GCS_PROJECT_ID=tax-filing-app-3649f`
- `GCS_BUCKET_NAME=tax-filing-documents-tax-filing-app-3649f`
- `KMS_PROJECT_ID=tax-filing-app-3649f`
- `KMS_LOCATION=global`
- `KMS_KEY_RING=tax-filing-key-ring`
- `KMS_KEY_NAME=tax-filing-key`
- `ADMIN_EMAIL=tax@growwell.com`
- `ADMIN_PASSWORD=$2b$10$vZ.kAm7Y7yCEvLE2yx5xrOSmETMdjZNo28NkdXfcUsgcnpaLFF2ZG`
- `CORS_ORIGIN=https://admin-panel-frontend-693306869303.us-central1.run.app`

### Frontend Environment Variables
- `REACT_APP_API_URL=https://admin-panel-backend-693306869303.us-central1.run.app`

## 🔍 Verification

### Check Backend Health
```bash
curl https://admin-panel-backend-693306869303.us-central1.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Admin Panel Backend is running",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Check Frontend
Visit the frontend URL in your browser. You should see the admin panel login page.

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```bash
   gcloud auth login
   gcloud config set project tax-filing-app-3649f
   ```

2. **API Not Enabled**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. **Build Fails**:
   - Check the Cloud Build logs in Google Cloud Console
   - Verify all dependencies are in package.json

4. **CORS Issues**:
   - Update the CORS_ORIGIN environment variable with your frontend URL
   - Redeploy the backend

### View Logs

```bash
# Backend logs
gcloud run logs read admin-panel-backend --region=us-central1 --project=tax-filing-app-3649f

# Frontend logs
gcloud run logs read admin-panel-frontend --region=us-central1 --project=tax-filing-app-3649f
```

## 🔄 Updates

To update the admin panel:

1. **Make your changes** to the code
2. **Run the deployment script** again:
   ```bash
   cd admin-panel
   ./deploy-all.sh
   ```

## 📞 Support

If you encounter issues:
1. Check the Cloud Build logs
2. Verify all environment variables are set correctly
3. Ensure the backend URL is accessible
4. Check CORS settings if frontend can't connect to backend

## 🎯 Next Steps

After successful deployment:
1. **Test the admin panel** functionality
2. **Update DNS** if using custom domain
3. **Set up monitoring** and alerts
4. **Configure backup** strategies
