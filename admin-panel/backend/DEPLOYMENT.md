# Admin Panel Backend - Google Cloud Run Deployment

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

## Set Environment Variables (if needed)

```powershell
gcloud run services update admin-panel-backend --region us-central1 --set-env-vars="NODE_ENV=production"
```

