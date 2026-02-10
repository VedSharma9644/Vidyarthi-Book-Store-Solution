# Shiprocket API Setup Guide

## How to Get Your Shiprocket API Credentials

### Step 1: Log into Shiprocket Dashboard
1. Go to [https://app.shiprocket.in](https://app.shiprocket.in)
2. Log in with your main Shiprocket account credentials

### Step 2: Navigate to API Settings
1. Go to [https://app.shiprocket.in/sellers/settings/additional-settings/api-users](https://app.shiprocket.in/sellers/settings/additional-settings/api-users)
2. Or navigate: **Settings** → **Additional Settings** → **API Users**

### Step 3: Check What Credentials You See

On the API Users page, you'll see one of two types of credentials:

#### **Option A: API Key and Secret Key** (Most Common)
If you see fields labeled "API Key" and "Secret Key":
- Copy the **API Key** value
- Copy the **Secret Key** value
- These are your authentication credentials

#### **Option B: Email/Username and Password**
If you see fields labeled "Email" or "Username" and "Password":
- Copy the **Email/Username** value (e.g., `ved+api@gmail.com`)
- Copy the **Password** value
- These are your authentication credentials

### Step 4: Configure Your .env File

#### If you have API Key and Secret Key:
```env
SHIPROCKET_API_KEY=your_api_key_here
SHIPROCKET_API_SECRET=your_api_secret_here
SHIPROCKET_PICKUP_LOCATION=warehouse
```

#### If you have Email/Username and Password:
```env
SHIPROCKET_EMAIL=ved+api@gmail.com
# OR use SHIPROCKET_USERNAME instead:
# SHIPROCKET_USERNAME=ved+api@gmail.com
SHIPROCKET_PASSWORD=your_password_here
SHIPROCKET_PICKUP_LOCATION=warehouse
```

**Note:** The code will automatically detect which method you're using based on which variables are set in your `.env` file.

### ⚠️ Pickup Location (required for orders to appear in Shiprocket)

**Orders will not show in Shiprocket** until you have:

1. **Added a Pickup Address in Shiprocket**
   - In Shiprocket: **Settings** → **Pickup Address** → add your warehouse/office address.
   - Note the **exact name** you give it (e.g. "Primary Warehouse", "Default Loc", "Main Store").

2. **Set `SHIPROCKET_PICKUP_LOCATION` to that exact name**
   - Example: `SHIPROCKET_PICKUP_LOCATION=Primary Warehouse`
   - If you leave it as `warehouse`, you must have a pickup address named **"warehouse"** in Shiprocket.
   - The name is case-sensitive and must match exactly.

3. **Create the Shiprocket order from the admin panel**
   - Open the order → click **"Create Shiprocket Order"**. Orders are not auto-created; you must do this per order (or use bulk later).

If the pickup location name does not match any address in Shiprocket, the API may fail or return an order without a shipment ID.

## Production (e.g. Cloud Run)

On the live server, **environment variables are not loaded from a `.env` file**. You must set them in the hosting platform:

- **Google Cloud Run:** Set `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` (or API key/secret) as environment variables or secrets when deploying/updating the service. See `DEPLOYMENT.md` for the exact `gcloud run services update` command.
- If these are missing, "Create Shiprocket Order" will fail with a message like: *"Shiprocket is not configured on this server. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD..."*

## Testing

After adding credentials, restart your backend server and try creating a Shiprocket order from the admin panel. Check the server logs for any authentication errors.

## Troubleshooting

### Error: "Invalid email or password"
- Double-check the email address (case-sensitive)
- Verify the password is correct
- Make sure there are no extra spaces in `.env` file

### Error: "No token in response"
- Check if your Shiprocket account has API access enabled
- Verify your account is active and not suspended

### No email received
- Check spam/junk folders
- Verify email address in Shiprocket settings
- Contact Shiprocket support for assistance


