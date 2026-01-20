# Admin Panel Deployment Script
# Deploys both backend and frontend to Google Cloud Run
# Usage: .\deploy.ps1
#        .\deploy.ps1 -ProjectId "custom-project-id" (optional override)

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "vidyarthi-mobile-app",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1",
    
    [Parameter(Mandatory=$false)]
    [string]$Email = "vidyarthibooksonline@gmail.com"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Admin Panel Deployment..." -ForegroundColor Green
Write-Host "Project ID: $ProjectId" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Google Cloud SDK found: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud SDK not found. Please install it from https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Set project
Write-Host "`n📋 Setting Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $ProjectId | Out-Null

# Check authentication
Write-Host "`n🔐 Checking authentication..." -ForegroundColor Yellow
try {
    $currentAccount = gcloud config get-value account 2>&1 | Out-String
    if ([string]::IsNullOrWhiteSpace($currentAccount) -or $currentAccount -match "ERROR") {
        Write-Host "⚠️  Not authenticated. Logging in..." -ForegroundColor Yellow
        gcloud auth login $Email
    } else {
        Write-Host "✅ Authenticated as: $($currentAccount.Trim())" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Not authenticated. Logging in..." -ForegroundColor Yellow
    gcloud auth login $Email
}

# Enable required APIs
Write-Host "`n🔧 Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com --quiet
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable artifactregistry.googleapis.com --quiet

# Deploy Backend
Write-Host "`n🔧 Deploying Backend..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend"
Push-Location $backendPath

try {
    Write-Host "Building and deploying backend..." -ForegroundColor Gray
    gcloud run deploy admin-panel-backend `
        --source . `
        --platform managed `
        --region $Region `
        --allow-unauthenticated `
        --port 8080 `
        --memory 512Mi `
        --timeout 300 `
        --max-instances 10 `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        $BACKEND_URL = gcloud run services describe admin-panel-backend --region $Region --format "value(status.url)" 2>&1
        Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
        Write-Host "   Backend URL: $BACKEND_URL" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error deploying backend: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Deploy Frontend
Write-Host "`n🎨 Deploying Frontend..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
Push-Location $frontendPath

try {
    # Create .env.production with backend URL
    Write-Host "Creating .env.production file..." -ForegroundColor Gray
    $envContent = "VITE_API_BASE_URL=$BACKEND_URL"
    $envContent | Out-File -FilePath ".env.production" -Encoding utf8 -NoNewline
    
    Write-Host "Building and deploying frontend..." -ForegroundColor Gray
    gcloud run deploy admin-panel-frontend `
        --source . `
        --platform managed `
        --region $Region `
        --allow-unauthenticated `
        --port 8080 `
        --memory 256Mi `
        --timeout 300 `
        --max-instances 10 `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        $FRONTEND_URL = gcloud run services describe admin-panel-frontend --region $Region --format "value(status.url)" 2>&1
        Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
        Write-Host "   Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} catch {
    Write-Host "❌ Error deploying frontend: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Update Backend CORS
Write-Host "`n🔐 Updating Backend CORS configuration..." -ForegroundColor Yellow
try {
    $corsOrigin = "$FRONTEND_URL,http://localhost:5173,http://localhost:3000"
    gcloud run services update admin-panel-backend `
        --region $Region `
        --set-env-vars "CORS_ORIGIN=$corsOrigin" `
        --quiet
    
    Write-Host "✅ CORS updated successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not update CORS. You may need to update it manually." -ForegroundColor Yellow
    Write-Host "   Run: gcloud run services update admin-panel-backend --region $Region --set-env-vars `"CORS_ORIGIN=$FRONTEND_URL,http://localhost:5173,http://localhost:3000`"" -ForegroundColor Gray
}

# Summary
Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "Backend URL:  $BACKEND_URL" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Next Steps
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set up environment variables for backend (Shiprocket credentials, etc.)" -ForegroundColor Gray
Write-Host "2. Configure Firebase service account if needed" -ForegroundColor Gray
Write-Host "3. Test the deployment by visiting: $FRONTEND_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed instructions, see: DEPLOYMENT_GUIDE.md" -ForegroundColor Gray

