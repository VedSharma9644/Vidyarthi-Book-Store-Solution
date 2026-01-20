# Network Error Troubleshooting Guide

## Error: ERR_NETWORK - Cannot connect to server

This error occurs when your app cannot reach the backend server at:
`https://vidyarthi-backend-594708558503.us-central1.run.app`

## Common Causes & Solutions

### 1. Backend Server is Down or Not Accessible

**Check if backend is running:**
```bash
# Test from browser or terminal
curl https://vidyarthi-backend-594708558503.us-central1.run.app/health

# Or open in browser:
https://vidyarthi-backend-594708558503.us-central1.run.app/health
```

**Solution:**
- Verify Google Cloud Run service is running
- Check Google Cloud Console for service status
- Ensure the service is deployed and active

### 2. Android Network Security Configuration

Android 9+ (API 28+) blocks cleartext traffic by default. Since you're using HTTPS, this shouldn't be the issue, but we should add a network security config to ensure proper SSL handling.

**Create network security config:**

1. Create file: `android/app/src/main/res/xml/network_security_config.xml`
2. Add this content:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">vidyarthi-backend-594708558503.us-central1.run.app</domain>
        <domain includeSubdomains="true">admin-panel-backend-594708558503.us-central1.run.app</domain>
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </domain-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

3. Update `AndroidManifest.xml` to reference it:

Add this inside `<application>` tag:
```xml
<application
    ...
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 3. Internet Permission Missing

**Check:** Your `AndroidManifest.xml` should have:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

✅ Already present in your manifest.

### 4. SSL Certificate Issues

**Possible causes:**
- Self-signed certificate
- Certificate expired
- Certificate chain issues

**Solution:**
- Verify SSL certificate is valid: `openssl s_client -connect vidyarthi-backend-594708558503.us-central1.run.app:443`
- Google Cloud Run should provide valid certificates automatically

### 5. Firewall or Network Restrictions

**Check:**
- Corporate firewall blocking the domain
- VPN interfering with connections
- Mobile data saver mode enabled
- Restricted network profile

**Solution:**
- Try on different network (mobile data vs WiFi)
- Disable VPN temporarily
- Check Android data saver settings
- Try on different device/emulator

### 6. Google Cloud Run Service Issues

**Check:**
- Service is deployed and active
- Service has proper IAM permissions
- Service is not paused or stopped
- Region is correct

**Solution:**
```bash
# Check service status
gcloud run services describe vidyarthi-backend --region us-central1

# Check service URL
gcloud run services describe vidyarthi-backend --region us-central1 --format="value(status.url)"
```

### 7. Timeout Issues

Your timeout is set to 10 seconds. If the server is slow to respond:

**Solution:** Increase timeout in `config/apiConfig.js`:
```javascript
TIMEOUT: 30000, // 30 seconds
```

### 8. Emulator/Device Network Issues

**For Emulator:**
- Ensure emulator has internet access
- Try `adb shell ping vidyarthi-backend-594708558503.us-central1.run.app`
- Check emulator network settings

**For Physical Device:**
- Ensure device has internet connection
- Try accessing the URL in device browser
- Check if device can resolve DNS

### 9. OneDrive Sync Service Interference

The "@OneDrive.Sync.Service" you mentioned might be:
- A Windows process (unrelated to Android)
- A background service interfering with network
- A false positive in logs

**Solution:**
- This is likely unrelated to the Android network error
- Focus on the actual network connectivity issues

## Quick Diagnostic Steps

1. **Test Backend Accessibility:**
   ```bash
   curl https://vidyarthi-backend-594708558503.us-central1.run.app/health
   ```

2. **Test from Device Browser:**
   - Open Chrome on your Android device
   - Navigate to: `https://vidyarthi-backend-594708558503.us-central1.run.app/health`
   - If this works, the issue is in the app configuration

3. **Check App Logs:**
   ```bash
   # Android
   adb logcat | grep -i "network\|ssl\|certificate"
   
   # Or filter React Native logs
   npx react-native log-android
   ```

4. **Test with Different Network:**
   - Try mobile data instead of WiFi
   - Try different WiFi network
   - Disable VPN if active

5. **Verify API Configuration:**
   - Check `config/apiConfig.js` has correct BASE_URL
   - Ensure no typos in URL
   - Verify HTTPS (not HTTP)

## Most Likely Solutions

Based on the error, try these in order:

1. **Add Network Security Config** (Most likely fix for Android 9+)
2. **Verify Backend is Running** (Check Google Cloud Console)
3. **Test Backend URL** (Use browser or curl)
4. **Check Network Connection** (Try different network)
5. **Increase Timeout** (If server is slow)

## Testing After Fix

After applying fixes, test with:
```javascript
// In your app, test the health endpoint
import ApiService from './services/apiService';

ApiService.healthCheck()
  .then(result => console.log('Health check:', result))
  .catch(error => console.error('Health check failed:', error));
```


