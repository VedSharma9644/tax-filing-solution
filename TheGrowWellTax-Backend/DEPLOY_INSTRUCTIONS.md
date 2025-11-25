# Backend Deployment Instructions

## Current Configuration ✅
- **Project ID**: `tax-filing-app-3649f`
- **Service Name**: `tax-filing-backend`
- **Region**: `us-central1`
- **Account**: `apps.creayaa@gmail.com` (has access to the project)

## Quick Deploy (Windows PowerShell)

### Option 1: Using deploy.sh (if you have Git Bash/WSL)
```bash
cd TheGrowWellTax-Backend
bash deploy.sh
```

### Option 2: Manual Deployment (PowerShell/CMD)

1. **Navigate to backend directory:**
```powershell
cd TheGrowWellTax-Backend
```

2. **Verify you're on the correct project:**
```powershell
gcloud config get-value project
# Should output: tax-filing-app-3649f

gcloud config get-value account
# Should output: apps.creayaa@gmail.com
```

3. **Enable required APIs:**
```powershell
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

4. **Build and push Docker image:**
```powershell
$PROJECT_ID = "tax-filing-app-3649f"
$SERVICE_NAME = "tax-filing-backend"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

docker build -t $IMAGE_NAME .
docker push $IMAGE_NAME
```

5. **Deploy to Cloud Run:**
```powershell
gcloud run deploy $SERVICE_NAME `
  --image $IMAGE_NAME `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --port 5000 `
  --memory 1Gi `
  --cpu 1 `
  --max-instances 10 `
  --min-instances 0 `
  --concurrency 80 `
  --timeout 300 `
  --set-env-vars "NODE_ENV=production,PORT=5000,JWT_SECRET=Y5CV6Cm0eNewJOvbzDmujrskwZCUoISUtNzG6+hA/R5hP3Vxr0FjRG8AWLut2SNPzHicB/2uUM2LLseFdW2isA==,FIREBASE_PROJECT_ID=tax-filing-app-3649f,GCS_PROJECT_ID=tax-filing-app-3649f,GCS_BUCKET_NAME=tax-filing-documents-tax-filing-app-3649f,KMS_PROJECT_ID=tax-filing-app-3649f,KMS_LOCATION=global,KMS_KEY_RING=tax-filing-key-ring,KMS_KEY_NAME=tax-filing-key"
```

### Option 3: Using Cloud Build (Recommended)

```powershell
gcloud builds submit --config cloudbuild.yaml
```

This will automatically:
- Build the Docker image
- Push it to Container Registry
- Deploy to Cloud Run

## Verify Deployment

After deployment, test the endpoint:

```powershell
# Get the service URL
$SERVICE_URL = gcloud run services describe tax-filing-backend --region us-central1 --format "value(status.url)"

# Test the new endpoint
curl -X POST "$SERVICE_URL/auth/firebase-email-login" `
  -H "Content-Type: application/json" `
  -d '{"idToken":"test"}'
```

Expected: Should return JSON error (not HTML 404)

## Troubleshooting

### If deployment goes to wrong project:
1. Check current project: `gcloud config get-value project`
2. Switch project: `gcloud config set project tax-filing-app-3649f`
3. Check account: `gcloud config get-value account`
4. Switch account if needed: `gcloud config set account apps.creayaa@gmail.com`

### If you get permission errors:
- Make sure you're using `apps.creayaa@gmail.com` account
- Verify you have Cloud Run Admin and Service Account User roles

### If Docker build fails:
- Make sure Docker Desktop is running
- Check Docker is authenticated: `gcloud auth configure-docker`

## After Deployment

Once deployed, the endpoint `/auth/firebase-email-login` will be available at:
`https://tax-filing-backend-693306869303.us-central1.run.app/auth/firebase-email-login`

The mobile app is already configured to use this URL, so email/password authentication should work immediately after deployment.

