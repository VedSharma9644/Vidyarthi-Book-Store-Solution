# Admin Panel Deployment Guide
## Deploying to Google Cloud Run with vidyarthibooksonline@gmail.com

This guide will help you deploy both the frontend and backend of the admin panel to Google Cloud Run separately.

---

## Prerequisites

1. **Google Cloud SDK (gcloud CLI)** installed
   - Download from: https://cloud.google.com/sdk/docs/install
   - Verify installation: `gcloud --version`

2. **Google Cloud Project** created
   - Go to: https://console.cloud.google.com/
   - Create a new project or use an existing one
   - Note your Project ID

3. **Billing enabled** on your Google Cloud project

---

## Step 1: Authenticate with Google Cloud

Authenticate gcloud CLI with your email account:

```powershell
# Authenticate with your Google account
gcloud auth login vidyarthibooksonline@gmail.com

# Set your project
gcloud config set project vidyarthi-mobile-app

# Verify the configuration
gcloud config list
```

**Note:** Your project `vidyarthi-mobile-app` is already created. If you need to create a different project:
```powershell
gcloud projects create PROJECT_ID --name="Admin Panel"
gcloud config set project PROJECT_ID
```

---

## Step 2: Enable Required APIs

Enable the necessary Google Cloud APIs:

```powershell
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API (required for building containers)
gcloud services enable cloudbuild.googleapis.com

# Enable Container Registry API (if using gcr.io)
gcloud services enable containerregistry.googleapis.com

# Enable Artifact Registry API (recommended)
gcloud services enable artifactregistry.googleapis.com
```

---

## Step 3: Deploy Backend

### 3.1 Navigate to Backend Directory

```powershell
cd "E:\Vidyarthi Mobile App Complete Solution\admin-panel\backend"
```

### 3.2 Prepare Environment Variables

Before deploying, you need to set up environment variables. The backend requires:
- `SHIPROCKET_EMAIL` - Your Shiprocket email
- `SHIPROCKET_PASSWORD` - Your Shiprocket password
- `SHIPROCKET_PICKUP_LOCATION` - Pickup location (default: "warehouse")
- `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to Firebase service account JSON (will be handled via Cloud Run secrets)

### 3.3 Deploy Backend to Cloud Run

**Option A: Deploy with environment variables inline (for testing)**

```powershell
gcloud run deploy admin-panel-backend `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --timeout 300 `
  --max-instances 10 `
  --set-env-vars "NODE_ENV=production,SHIPROCKET_PICKUP_LOCATION=warehouse" `
  --set-secrets "SHIPROCKET_EMAIL=shiprocket-email:latest,SHIPROCKET_PASSWORD=shiprocket-password:latest"
```

**Option B: Deploy first, then set environment variables (Recommended)**

```powershell
# Deploy the backend
gcloud run deploy admin-panel-backend `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --timeout 300 `
  --max-instances 10

# After deployment, get the service URL
$BACKEND_URL = gcloud run services describe admin-panel-backend --region us-central1 --format "value(status.url)"
Write-Host "Backend URL: $BACKEND_URL"

# Set environment variables (you'll need to create secrets first - see Step 3.4)
gcloud run services update admin-panel-backend `
  --region us-central1 `
  --set-env-vars "NODE_ENV=production,SHIPROCKET_PICKUP_LOCATION=warehouse"
```

### 3.4 Set Up Secrets (Recommended for Production)

For sensitive data like Shiprocket credentials, use Google Cloud Secrets Manager:

```powershell
# Create secrets
echo -n "ved+api@gmail.com" | gcloud secrets create shiprocket-email --data-file=-
echo -n "Ho5c1R$^!UWD%I8y" | gcloud secrets create shiprocket-password --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding shiprocket-email `
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding shiprocket-password `
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

# Update the service to use secrets
gcloud run services update admin-panel-backend `
  --region us-central1 `
  --set-secrets "SHIPROCKET_EMAIL=shiprocket-email:latest,SHIPROCKET_PASSWORD=shiprocket-password:latest"
```

**Note:** Replace `PROJECT_NUMBER` with your actual project number. Find it with:
```powershell
gcloud projects describe PROJECT_ID --format="value(projectNumber)"
```

### 3.5 Handle Firebase Service Account

The backend needs access to Firebase. You have two options:

**Option A: Upload serviceAccountKey.json as a secret**

```powershell
# Create secret from service account file
gcloud secrets create firebase-service-account --data-file=./serviceAccountKey.json

# Grant access
gcloud secrets add-iam-policy-binding firebase-service-account `
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

# Mount as environment variable (you'll need to modify server.js to read from env var)
# Or mount as volume (requires Cloud Run gen2)
```

**Option B: Include serviceAccountKey.json in the Docker image** (less secure, but simpler)

Make sure `serviceAccountKey.json` is in the backend directory and will be copied by the Dockerfile.

### 3.6 Get Backend URL

After deployment, get your backend URL:

```powershell
$BACKEND_URL = gcloud run services describe admin-panel-backend --region us-central1 --format "value(status.url)"
Write-Host "Backend URL: $BACKEND_URL"
```

**Save this URL** - you'll need it for the frontend deployment.

---

## Step 4: Deploy Frontend

### 4.1 Navigate to Frontend Directory

```powershell
cd "E:\Vidyarthi Mobile App Complete Solution\admin-panel\frontend"
```

### 4.2 Create Production Environment File

Create a `.env.production` file with your backend URL:

```powershell
# Create .env.production file
$BACKEND_URL = "YOUR_BACKEND_URL_HERE"  # Replace with actual backend URL from Step 3.6
@"
VITE_API_BASE_URL=$BACKEND_URL
"@ | Out-File -FilePath .env.production -Encoding utf8
```

**Or manually create `.env.production`:**
```env
VITE_API_BASE_URL=https://admin-panel-backend-xxxxx-uc.a.run.app
```

### 4.3 Update Dockerfile (if needed)

The Dockerfile already supports build arguments. You can override the backend URL during build:

```powershell
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

**Or use the simpler approach:**

```powershell
# Deploy frontend (it will use .env.production if present, or Dockerfile default)
gcloud run deploy admin-panel-frontend `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 256Mi `
  --timeout 300 `
  --max-instances 10
```

### 4.4 Get Frontend URL

After deployment:

```powershell
$FRONTEND_URL = gcloud run services describe admin-panel-frontend --region us-central1 --format "value(status.url)"
Write-Host "Frontend URL: $FRONTEND_URL"
```

---

## Step 5: Update CORS Configuration

After deploying the frontend, update the backend CORS settings to allow the new frontend URL:

```powershell
# Get frontend URL
$FRONTEND_URL = gcloud run services describe admin-panel-frontend --region us-central1 --format "value(status.url)"

# Update backend CORS
gcloud run services update admin-panel-backend `
  --region us-central1 `
  --set-env-vars "CORS_ORIGIN=$FRONTEND_URL,http://localhost:5173,http://localhost:3000"
```

---

## Step 6: Verify Deployment

### Test Backend

```powershell
# Test backend health endpoint
$BACKEND_URL = gcloud run services describe admin-panel-backend --region us-central1 --format "value(status.url)"
Invoke-RestMethod -Uri "$BACKEND_URL/health"
```

### Test Frontend

Open your frontend URL in a browser:
```powershell
$FRONTEND_URL = gcloud run services describe admin-panel-frontend --region us-central1 --format "value(status.url)"
Write-Host "Open in browser: $FRONTEND_URL"
Start-Process $FRONTEND_URL
```

---

## Quick Deployment Scripts

### Deploy Everything (PowerShell Script)

Save this as `deploy.ps1` in the `admin-panel` directory:

```powershell
# Admin Panel Deployment Script
# Usage: .\deploy.ps1

Write-Host "🚀 Starting Admin Panel Deployment..." -ForegroundColor Green

# Set your project ID
$PROJECT_ID = "vidyarthi-mobile-app"
$REGION = "us-central1"

# Authenticate (if not already)
Write-Host "`n📋 Checking authentication..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Deploy Backend
Write-Host "`n🔧 Deploying Backend..." -ForegroundColor Cyan
cd backend
gcloud run deploy admin-panel-backend `
  --source . `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --timeout 300 `
  --max-instances 10

$BACKEND_URL = gcloud run services describe admin-panel-backend --region $REGION --format "value(status.url)"
Write-Host "✅ Backend deployed: $BACKEND_URL" -ForegroundColor Green

# Deploy Frontend
Write-Host "`n🎨 Deploying Frontend..." -ForegroundColor Cyan
cd ../frontend

# Create .env.production with backend URL
@"
VITE_API_BASE_URL=$BACKEND_URL
"@ | Out-File -FilePath .env.production -Encoding utf8

gcloud run deploy admin-panel-frontend `
  --source . `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --memory 256Mi `
  --timeout 300 `
  --max-instances 10

$FRONTEND_URL = gcloud run services describe admin-panel-frontend --region $REGION --format "value(status.url)"
Write-Host "✅ Frontend deployed: $FRONTEND_URL" -ForegroundColor Green

# Update Backend CORS
Write-Host "`n🔐 Updating Backend CORS..." -ForegroundColor Cyan
gcloud run services update admin-panel-backend `
  --region $REGION `
  --set-env-vars "CORS_ORIGIN=$FRONTEND_URL,http://localhost:5173,http://localhost:3000"

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "Backend: $BACKEND_URL" -ForegroundColor Cyan
```

---

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```powershell
   gcloud auth login vidyarthibooksonline@gmail.com
   gcloud auth application-default login
   ```

2. **Permission Denied**
   - Ensure billing is enabled
   - Check IAM permissions for your account

3. **Build Fails**
   - Check Dockerfile syntax
   - Verify all dependencies in package.json
   - Check Cloud Build logs: `gcloud builds list`

4. **Environment Variables Not Working**
   - Verify secrets are created and accessible
   - Check service account permissions
   - Review Cloud Run logs: `gcloud run services logs read admin-panel-backend --region us-central1`

5. **CORS Errors**
   - Ensure frontend URL is added to backend CORS_ORIGIN
   - Check browser console for specific CORS errors

---

## Updating Deployments

### Update Backend

```powershell
cd "E:\Vidyarthi Mobile App Complete Solution\admin-panel\backend"
gcloud run deploy admin-panel-backend --source . --region us-central1
```

### Update Frontend

```powershell
cd "E:\Vidyarthi Mobile App Complete Solution\admin-panel\frontend"
gcloud run deploy admin-panel-frontend --source . --region us-central1
```

---

## Cost Considerations

- **Cloud Run Pricing**: Pay only for what you use
- **Free Tier**: 2 million requests/month, 360,000 GB-seconds memory, 180,000 vCPU-seconds
- **Estimated Cost**: ~$0-5/month for low traffic

---

## Security Best Practices

1. ✅ Use Secrets Manager for sensitive data
2. ✅ Enable authentication if needed (remove `--allow-unauthenticated`)
3. ✅ Set up Cloud Armor for DDoS protection
4. ✅ Regularly update dependencies
5. ✅ Monitor logs and set up alerts

---

## Support

For issues or questions:
- Google Cloud Run Docs: https://cloud.google.com/run/docs
- Cloud Run Troubleshooting: https://cloud.google.com/run/docs/troubleshooting

