# Quick Deployment Reference

## 🚀 Quick Start

### Option 1: Deploy Everything at Once

```powershell
cd "E:\Vidyarthi Mobile App Complete Solution\admin-panel"
.\deploy.ps1
```

**Note:** Uses project `vidyarthi-mobile-app` by default. To use a different project:
```powershell
.\deploy.ps1 -ProjectId "your-project-id"
```

### Option 2: Deploy Separately

**Deploy Backend First:**
```powershell
cd "E:\Vidyarthi Mobile App Complete Solution\admin-panel"
.\deploy-backend-only.ps1
```

**Then Deploy Frontend:**
```powershell
.\deploy-frontend-only.ps1 -BackendUrl "https://your-backend-url"
```

**Note:** Both scripts use project `vidyarthi-mobile-app` by default.

### Option 3: Manual Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed step-by-step instructions.

---

## 📋 Prerequisites Checklist

- [ ] Google Cloud SDK installed (`gcloud --version`)
- [ ] Google Cloud project created
- [ ] Billing enabled on project
- [ ] Authenticated with `vidyarthibooksonline@gmail.com`

---

## 🔐 First Time Setup

```powershell
# 1. Authenticate
gcloud auth login vidyarthibooksonline@gmail.com

# 2. Set project
gcloud config set project vidyarthi-mobile-app

# 3. Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

---

## 📚 Documentation

- **Complete Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Backend Deployment**: [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md)
- **Frontend Deployment**: [frontend/DEPLOYMENT.md](./frontend/DEPLOYMENT.md)

---

## 🛠️ Common Commands

### View Logs
```powershell
# Backend logs
gcloud run services logs read admin-panel-backend --region us-central1

# Frontend logs
gcloud run services logs read admin-panel-frontend --region us-central1
```

### Get Service URLs
```powershell
# Backend URL
gcloud run services describe admin-panel-backend --region us-central1 --format "value(status.url)"

# Frontend URL
gcloud run services describe admin-panel-frontend --region us-central1 --format "value(status.url)"
```

### Update Environment Variables
```powershell
# Backend
gcloud run services update admin-panel-backend --region us-central1 --set-env-vars "KEY=VALUE"

# Frontend (requires rebuild)
# Update .env.production and redeploy
```

---

## ⚠️ Important Notes

1. **Backend must be deployed before frontend** - Frontend needs the backend URL
2. **Environment Variables** - Set Shiprocket credentials and other secrets after deployment
3. **CORS** - Backend CORS is automatically updated after frontend deployment
4. **Firebase** - Ensure `serviceAccountKey.json` is in the backend directory

---

## 🆘 Troubleshooting

See the [Troubleshooting section](./DEPLOYMENT_GUIDE.md#troubleshooting) in the main deployment guide.

