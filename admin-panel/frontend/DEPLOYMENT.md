# Admin Panel Frontend - Google Cloud Run Deployment

> **📖 For complete deployment instructions, see [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)**

## Prerequisites

1. **Backend must be deployed first** - Get your backend URL before deploying frontend
2. Authenticate with Google Cloud:
   ```powershell
   gcloud auth login vidyarthibooksonline@gmail.com
   gcloud config set project vidyarthi-mobile-app
   ```

## Step 1: Set Backend URL

Before deploying, create a `.env.production` file with your backend URL:

```powershell
# Get backend URL (if backend is already deployed)
$BACKEND_URL = gcloud run services describe admin-panel-backend --region us-central1 --format "value(status.url)"

# Create .env.production file
@"
VITE_API_BASE_URL=$BACKEND_URL
"@ | Out-File -FilePath .env.production -Encoding utf8
```

**Or manually create `.env.production`:**
```env
VITE_API_BASE_URL=https://admin-panel-backend-xxxxx-uc.a.run.app
```

## Step 2: Deploy Frontend

**PowerShell:**
```powershell
cd "E:\Vidyarthi Mobile App Complete Solution\admin-panel\frontend"
gcloud run deploy admin-panel-frontend --source . --platform managed --region us-central1 --allow-unauthenticated --port 8080 --memory 256Mi --timeout 300 --max-instances 10
```

**Bash:**
```bash
cd admin-panel/frontend
gcloud run deploy admin-panel-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --timeout 300 \
  --max-instances 10
```

**With build-time environment variable:**
```powershell
$BACKEND_URL = "YOUR_BACKEND_URL"
gcloud run deploy admin-panel-frontend `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 256Mi `
  --timeout 300 `
  --max-instances 10 `
  --build-env-vars "VITE_API_BASE_URL=$BACKEND_URL"
```

## Step 3: Get Frontend URL

After deployment:

```powershell
$FRONTEND_URL = gcloud run services describe admin-panel-frontend --region us-central1 --format "value(status.url)"
Write-Host "Frontend URL: $FRONTEND_URL"
```

## Step 4: Update Backend CORS

After deploying frontend, update backend CORS to allow the frontend URL:

```powershell
$FRONTEND_URL = gcloud run services describe admin-panel-frontend --region us-central1 --format "value(status.url)"
gcloud run services update admin-panel-backend --region us-central1 --set-env-vars "CORS_ORIGIN=$FRONTEND_URL,http://localhost:5173,http://localhost:3000"
```

## View Logs

```powershell
gcloud run services logs read admin-panel-frontend --region us-central1
```

## Test Deployment

Open your frontend URL in a browser:
```powershell
$FRONTEND_URL = gcloud run services describe admin-panel-frontend --region us-central1 --format "value(status.url)"
Start-Process $FRONTEND_URL
```

