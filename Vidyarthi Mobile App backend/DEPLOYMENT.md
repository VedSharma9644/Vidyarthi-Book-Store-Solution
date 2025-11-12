# Google Cloud Deployment Guide

This guide will help you deploy the Vidyarthi Mobile App Backend to Google Cloud Platform.

## Prerequisites

1. **Google Cloud Account**: Sign up at https://cloud.google.com/
2. **Google Cloud SDK (gcloud)**: Install from https://cloud.google.com/sdk/docs/install
3. **Node.js**: Installed locally (for building)
4. **Firebase Admin SDK**: Service account key file (`serviceAccountKey.json`)

## Option 1: Google Cloud Run (Recommended)

Cloud Run is a serverless platform that automatically scales your application.

### Step 1: Install Google Cloud SDK

**Windows:**
```powershell
# Download and install from: https://cloud.google.com/sdk/docs/install
# Or use PowerShell:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**Mac/Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Initialize and Authenticate

```bash
# Login to Google Cloud
gcloud auth login

# Set your project (create one at https://console.cloud.google.com/)
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### Step 3: Create Dockerfile

Create a `Dockerfile` in the backend root directory:

```dockerfile
# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Set PORT environment variable (Cloud Run requirement)
ENV PORT=8080

# Start the application
CMD ["node", "src/server.js"]
```

### Step 4: Create .dockerignore

Create `.dockerignore` file:

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
DEPLOYMENT.md
*.md
```

### Step 5: Build and Deploy

**For PowerShell (Windows):**
```powershell
# Navigate to backend directory
cd "Vidyarthi Mobile App backend"

# Build and deploy to Cloud Run (single line for PowerShell)
gcloud run deploy vidyarthi-backend --source . --platform managed --region us-central1 --allow-unauthenticated --port 8080 --memory 512Mi --timeout 300 --max-instances 10

# Or use backticks for line continuation in PowerShell
gcloud run deploy vidyarthi-backend `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --timeout 300 `
  --max-instances 10
```

**For Bash/Linux/Mac:**
```bash
# Navigate to backend directory
cd "Vidyarthi Mobile App backend"

# Build and deploy to Cloud Run
gcloud run deploy vidyarthi-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10
```

### Step 6: Set Environment Variables

**For PowerShell:**
```powershell
# Set environment variables in Cloud Run
gcloud run services update vidyarthi-backend --region us-central1 --set-env-vars="PORT=8080,NODE_ENV=production"

# For sensitive variables (Razorpay keys, etc.), use Secret Manager:
# 1. Create secrets in Secret Manager (PowerShell)
echo "your_key_id" | gcloud secrets create razorpay-key-id --data-file=-
echo "your_secret_key" | gcloud secrets create razorpay-secret-key --data-file=-

# 2. Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding razorpay-key-id --member="serviceAccount:YOUR_SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"

# 3. Mount secrets as environment variables
gcloud run services update vidyarthi-backend --region us-central1 --update-secrets="RAZORPAY_KEY_ID=razorpay-key-id:latest,RAZORPAY_KEY_SECRET=razorpay-secret-key:latest"
```

**For Bash:**
```bash
# Set environment variables in Cloud Run
gcloud run services update vidyarthi-backend \
  --region us-central1 \
  --set-env-vars="PORT=8080,NODE_ENV=production"

# For sensitive variables (Razorpay keys, etc.), use Secret Manager:
# 1. Create secrets in Secret Manager
gcloud secrets create razorpay-key-id --data-file=- <<< "your_key_id"
gcloud secrets create razorpay-secret-key --data-file=- <<< "your_secret_key"

# 2. Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding razorpay-key-id \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

# 3. Mount secrets as environment variables
gcloud run services update vidyarthi-backend \
  --region us-central1 \
  --update-secrets="RAZORPAY_KEY_ID=razorpay-key-id:latest,RAZORPAY_KEY_SECRET=razorpay-secret-key:latest"
```

### Step 7: Upload Service Account Key

**For PowerShell:**
```powershell
# Upload serviceAccountKey.json to Secret Manager
gcloud secrets create firebase-service-account --data-file=serviceAccountKey.json

# Mount as file in Cloud Run
gcloud run services update vidyarthi-backend --region us-central1 --update-secrets="/app/serviceAccountKey.json=firebase-service-account:latest"
```

**For Bash:**
```bash
# Upload serviceAccountKey.json to Secret Manager
gcloud secrets create firebase-service-account \
  --data-file=serviceAccountKey.json

# Mount as file in Cloud Run
gcloud run services update vidyarthi-backend \
  --region us-central1 \
  --update-secrets="/app/serviceAccountKey.json=firebase-service-account:latest"
```

### Step 8: Get Your Backend URL

After deployment, you'll get a URL like:
```
https://vidyarthi-backend-xxxxx-uc.a.run.app
```

Update your mobile app's `apiConfig.js` with this URL.

---

## Option 2: Google App Engine (Simpler, but less flexible)

### Step 1: Create app.yaml

Create `app.yaml` in the backend root:

```yaml
runtime: nodejs18

env_variables:
  NODE_ENV: production
  PORT: 8080

automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.6

resources:
  cpu: 1
  memory_gb: 0.5
  disk_size_gb: 10
```

### Step 2: Deploy to App Engine

```bash
# Navigate to backend directory
cd "Vidyarthi Mobile App backend"

# Deploy
gcloud app deploy

# Get URL
gcloud app browse
```

### Step 3: Set Environment Variables

```bash
# Set environment variables
gcloud app deploy --set-env-vars="RAZORPAY_KEY_ID=your_key,RAZORPAY_KEY_SECRET=your_secret"
```

---

## Post-Deployment Checklist

1. ✅ Test the health endpoint: `https://your-backend-url/health`
2. ✅ Update mobile app `apiConfig.js` with new backend URL
3. ✅ Test API endpoints from mobile app
4. ✅ Monitor logs: `gcloud run logs read vidyarthi-backend --region us-central1`
5. ✅ Set up custom domain (optional)
6. ✅ Configure CORS if needed
7. ✅ Set up monitoring and alerts

## Useful Commands

```bash
# View logs
gcloud run logs read vidyarthi-backend --region us-central1 --limit 50

# View service details
gcloud run services describe vidyarthi-backend --region us-central1

# Update service
gcloud run services update vidyarthi-backend --region us-central1

# Delete service
gcloud run services delete vidyarthi-backend --region us-central1
```

## Troubleshooting

1. **Port Issues**: Ensure your app listens on `process.env.PORT || 8080`
2. **CORS Errors**: Update CORS settings in `server.js` to allow your mobile app domain
3. **Firebase Errors**: Ensure `serviceAccountKey.json` is properly mounted
4. **Memory Issues**: Increase memory allocation: `--memory 1Gi`

## Cost Estimation

- **Cloud Run**: Pay per request (~$0.40 per million requests)
- **App Engine**: Free tier available, then pay per usage
- Both are very cost-effective for small to medium traffic

