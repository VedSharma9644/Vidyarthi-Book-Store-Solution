# Website Deployment Guide

This guide will help you deploy the Vidyarthi Kart website to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: Sign up at https://cloud.google.com/
2. **Google Cloud SDK (gcloud)**: Install from https://cloud.google.com/sdk/docs/install
3. **Node.js**: Installed locally (for building)

## Quick Deploy to Google Cloud Run

### Step 1: Authenticate with Google Cloud

```powershell
# Login to Google Cloud
gcloud auth login

# Set your project (replace with your actual project ID)
gcloud config set project vidyarthi-mobile-app

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Step 2: Deploy the Website

**IMPORTANT:** You must run the command from the `website` directory, not from the parent directory!

Navigate to the website directory and deploy:

**PowerShell:**
```powershell
# Make sure you're in the website directory
cd E:\VMACS\website

# Deploy with build arguments
gcloud run deploy vidyarthi-website `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --timeout 300 `
  --max-instances 10 `
  --set-build-env-vars "REACT_APP_API_BASE_URL=https://vidyarthi-backend-594708558503.us-central1.run.app"
```

**Note:** Use `--set-build-env-vars` instead of `--set-env-vars` for build-time environment variables (like `REACT_APP_API_BASE_URL`).

**Bash:**
```bash
cd website
gcloud run deploy vidyarthi-website \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "REACT_APP_API_BASE_URL=https://vidyarthi-backend-594708558503.us-central1.run.app"
```

### Step 3: Get the Deployed URL

After deployment, get your website URL:

```powershell
gcloud run services describe vidyarthi-website --region us-central1 --format "value(status.url)"
```

## Manual Build and Deploy (Alternative)

If you prefer to build locally first:

### Step 1: Build the Application

```powershell
cd website
npm install
npm run build
```

### Step 2: Build Docker Image

```powershell
docker build --build-arg REACT_APP_API_BASE_URL=https://vidyarthi-backend-594708558503.us-central1.run.app -t vidyarthi-website .
```

### Step 3: Deploy to Cloud Run

```powershell
gcloud run deploy vidyarthi-website `
  --image vidyarthi-website `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080
```

## Alternative: Using Cloud Build (Recommended for Build Args)

If the `--source .` method fails with build arguments, use Cloud Build:

**PowerShell:**
```powershell
cd E:\VMACS\website

# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml --substitutions _REACT_APP_API_BASE_URL=https://vidyarthi-backend-594708558503.us-central1.run.app
```

## Update Existing Deployment

To update an existing deployment with new changes:

**Option 1: Using --source (simpler, but may have issues with build args)**
```powershell
cd E:\VMACS\website
gcloud run deploy vidyarthi-website `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-build-env-vars "REACT_APP_API_BASE_URL=https://vidyarthi-backend-594708558503.us-central1.run.app"
```

**Option 2: Using Cloud Build (more reliable)**
```powershell
cd E:\VMACS\website
gcloud builds submit --config cloudbuild.yaml --substitutions _REACT_APP_API_BASE_URL=https://vidyarthi-backend-594708558503.us-central1.run.app
```

## Environment Variables

If you need to update environment variables:

```powershell
gcloud run services update vidyarthi-website `
  --region us-central1 `
  --set-env-vars "REACT_APP_API_BASE_URL=https://vidyarthi-backend-594708558503.us-central1.run.app"
```

## Troubleshooting

### Check Deployment Status

```powershell
gcloud run services describe vidyarthi-website --region us-central1
```

### View Logs

```powershell
gcloud run services logs read vidyarthi-website --region us-central1
```

### Delete Service (if needed)

```powershell
gcloud run services delete vidyarthi-website --region us-central1
```

