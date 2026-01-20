# Frontend Only Deployment Script
# Usage: .\deploy-frontend-only.ps1 -BackendUrl "https://your-backend-url"
#        .\deploy-frontend-only.ps1 -ProjectId "custom-project-id" -BackendUrl "https://your-backend-url"

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "vidyarthi-mobile-app",
    
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1",
    
    [Parameter(Mandatory=$false)]
    [string]$Email = "vidyarthibooksonline@gmail.com"
)

$ErrorActionPreference = "Stop"

Write-Host "🎨 Deploying Admin Panel Frontend..." -ForegroundColor Green
Write-Host "Project ID: $ProjectId" -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

# Set project
Write-Host "📋 Setting Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $ProjectId | Out-Null

# Check authentication
Write-Host "🔐 Checking authentication..." -ForegroundColor Yellow
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
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com --quiet
gcloud services enable cloudbuild.googleapis.com --quiet

# Deploy Frontend
Write-Host "`n🎨 Building and deploying frontend..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
Push-Location $frontendPath

# Create .env.production with backend URL
Write-Host "Creating .env.production file..." -ForegroundColor Gray
$envContent = "VITE_API_BASE_URL=$BackendUrl"
$envContent | Out-File -FilePath ".env.production" -Encoding utf8 -NoNewline

gcloud run deploy admin-panel-frontend `
    --source . `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --port 8080 `
    --memory 256Mi `
    --timeout 300 `
    --max-instances 10

if ($LASTEXITCODE -eq 0) {
    $FRONTEND_URL = gcloud run services describe admin-panel-frontend --region $Region --format "value(status.url)"
    Write-Host "`n✅ Frontend deployed successfully!" -ForegroundColor Green
    Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
    
    # Update Backend CORS
    Write-Host "`n🔐 Updating Backend CORS..." -ForegroundColor Yellow
    $corsOrigin = "$FRONTEND_URL,http://localhost:5173,http://localhost:3000"
    gcloud run services update admin-panel-backend `
        --region $Region `
        --set-env-vars "CORS_ORIGIN=$corsOrigin" `
        --quiet
    
    Write-Host "✅ CORS updated successfully!" -ForegroundColor Green
    Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Frontend deployment failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

