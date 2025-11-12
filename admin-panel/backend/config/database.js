require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Get service account path from environment
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

// Resolve absolute path
const absolutePath = path.resolve(__dirname, '../', serviceAccountPath);

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to use service account key file first
    let serviceAccount;
    try {
      serviceAccount = require(absolutePath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized with service account key');
    } catch (fileError) {
      // If file doesn't exist, try using Application Default Credentials (for Cloud Run)
      console.log('⚠️ Service account file not found, trying Application Default Credentials...');
      admin.initializeApp({
        // Cloud Run automatically provides credentials via Application Default Credentials
      });
      console.log('✅ Firebase Admin initialized with Application Default Credentials');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    // Don't throw - let the app start and fail gracefully on API calls
    console.error('⚠️ Firebase initialization failed. Some features may not work.');
  }
}

// Export Firebase Admin and Firestore
const db = admin.firestore();

module.exports = {
  admin,
  db,
};

