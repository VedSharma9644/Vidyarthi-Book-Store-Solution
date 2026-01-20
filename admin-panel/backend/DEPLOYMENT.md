# Admin Panel Backend - Google Cloud Run Deployment

> **📖 For complete deployment instructions, see [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)**

## Prerequisites

1. Authenticate with Google Cloud:
   ```powershell
   gcloud auth login vidyarthibooksonline@gmail.com
   gcloud config set project vidyarthi-mobile-app
   ```

2. Enable required APIs:
   ```powershell
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```

## Quick Deploy Command

**PowerShell:**
```powershell
cd "E:\Vidyarthi Mobile App Complete Solution\admin-panel\backend"
gcloud run deploy admin-panel-backend --source . --platform managed --region us-central1 --allow-unauthenticated --port 8080 --memory 512Mi --timeout 300 --max-instances 10
```

**Bash:**
```bash
cd admin-panel/backend
gcloud run deploy admin-panel-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10
```

## Set Environment Variables

### Basic Environment Variables

```powershell
gcloud run services update admin-panel-backend --region us-central1 --set-env-vars="NODE_ENV=production,SHIPROCKET_PICKUP_LOCATION=warehouse"
```

### Set Shiprocket Credentials (Using Secrets - Recommended)

First, create secrets:
```powershell
echo -n "ved+api@gmail.com" | gcloud secrets create shiprocket-email --data-file=-
echo -n "Ho5c1R$^!UWD%I8y" | gcloud secrets create shiprocket-password --data-file=-
```

Then update the service:
```powershell
gcloud run services update admin-panel-backend --region us-central1 --set-secrets "SHIPROCKET_EMAIL=shiprocket-email:latest,SHIPROCKET_PASSWORD=shiprocket-password:latest"
```

### Set CORS Origin (After Frontend Deployment)

```powershell
$FRONTEND_URL = "YOUR_FRONTEND_URL"
gcloud run services update admin-panel-backend --region us-central1 --set-env-vars "CORS_ORIGIN=$FRONTEND_URL,http://localhost:5173,http://localhost:3000"
```

## Get Backend URL

After deployment, get your backend URL:

```powershell
$BACKEND_URL = gcloud run services describe admin-panel-backend --region us-central1 --format "value(status.url)"
Write-Host "Backend URL: $BACKEND_URL"
```

**Save this URL** - you'll need it for frontend deployment.

## View Logs

```powershell
gcloud run services logs read admin-panel-backend --region us-central1
```

## Test Deployment

```powershell
$BACKEND_URL = gcloud run services describe admin-panel-backend --region us-central1 --format "value(status.url)"
Invoke-RestMethod -Uri "$BACKEND_URL/health"
```

