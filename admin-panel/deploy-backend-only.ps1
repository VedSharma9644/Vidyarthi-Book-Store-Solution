# Backend Only Deployment Script
# Usage: .\deploy-backend-only.ps1
#        .\deploy-backend-only.ps1 -ProjectId "custom-project-id" (optional override)

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "vidyarthi-mobile-app",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1",
    
    [Parameter(Mandatory=$false)]
    [string]$Email = "vidyarthibooksonline@gmail.com"
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Deploying Admin Panel Backend..." -ForegroundColor Green
Write-Host "Project ID: $ProjectId" -ForegroundColor Cyan
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

# Deploy Backend
Write-Host "`n🔧 Building and deploying backend..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend"
Push-Location $backendPath

gcloud run deploy admin-panel-backend `
    --source . `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --timeout 300 `
    --max-instances 10

if ($LASTEXITCODE -eq 0) {
    $BACKEND_URL = gcloud run services describe admin-panel-backend --region $Region --format "value(status.url)"
    Write-Host "`n✅ Backend deployed successfully!" -ForegroundColor Green
    Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
    Write-Host "`n💡 Save this URL - you'll need it for frontend deployment!" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Backend deployment failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

