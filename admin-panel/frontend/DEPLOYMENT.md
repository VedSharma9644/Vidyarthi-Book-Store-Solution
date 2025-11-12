# Admin Panel Frontend - Google Cloud Run Deployment

## Quick Deploy Command

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

## Set Environment Variables

After deployment, set the backend API URL:

```powershell
gcloud run services update admin-panel-frontend --region us-central1 --set-env-vars="VITE_API_BASE_URL=https://admin-panel-backend-xxxxx-uc.a.run.app"
```

**Note:** Replace `admin-panel-backend-xxxxx-uc.a.run.app` with your actual backend URL.

## Update Frontend Build

If you need to rebuild with a different API URL, create a `.env.production` file:

```env
VITE_API_BASE_URL=https://admin-panel-backend-xxxxx-uc.a.run.app
```

Then rebuild and redeploy.

