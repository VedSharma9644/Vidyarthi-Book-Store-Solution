require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Get service account path from environment
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

// Resolve absolute path
const absolutePath = path.resolve(__dirname, '../../', serviceAccountPath);

let serviceAccount;
try {
    serviceAccount = require(absolutePath);
} catch (error) {
    console.error('Error loading Firebase service account:', error.message);
    console.error('Make sure serviceAccountKey.json exists in the backend root folder');
    throw error;
}

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized successfully');
}

// Export Firebase Admin and Firestore
const db = admin.firestore();

module.exports = {
    admin,
    db,
};


