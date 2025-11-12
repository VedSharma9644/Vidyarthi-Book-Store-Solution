# Firebase Storage Security Rules

## Recommended Rules for Book Cover Images

After setting up Firebase Storage, update your security rules to the following:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Book cover images - public read, admin write only
    match /book-covers/{imageId} {
      // Allow public read access (needed for mobile app to display images)
      allow read: if true;
      
      // Write access only from backend (Admin SDK bypasses these rules anyway)
      // But we restrict it here for additional security
      allow write: if false; // Only backend Admin SDK can write
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Why These Rules?

1. **Public Read (`allow read: if true`)**: 
   - Mobile app needs to display book cover images
   - Images are meant to be publicly accessible
   - No sensitive data in images

2. **No Client Write (`allow write: if false`)**:
   - Only backend server (using Admin SDK) can upload images
   - Admin SDK bypasses security rules, so uploads will still work
   - Prevents unauthorized uploads from clients

3. **Default Deny**:
   - All other paths are denied by default
   - Only book-covers folder is accessible

## How to Update Rules

1. Go to Firebase Console → Storage → Rules tab
2. Replace the default rules with the rules above
3. Click "Publish"

## Note

Since your backend uses Firebase Admin SDK, it bypasses these security rules. The rules primarily protect against:
- Unauthorized client-side uploads
- Access to other storage paths
- Unauthorized reads from other folders

