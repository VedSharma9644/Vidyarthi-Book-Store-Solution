/**
 * Script to update Razorpay API Keys in Firestore (Test or Live)
 *
 * IMPORTANT: Run from the backend folder where firebase-admin is installed.
 *
 * Usage:
 *   From "Vidyarthi Mobile App backend" folder:
 *     node ../website/updateRazorpayKeys.js [test|live]
 *
 *   Use "test" for Razorpay test keys (testing purchases).
 *   Use "live" for Razorpay live keys (production).
 *   If omitted, defaults to "live".
 *
 *   Example - set TEST keys:
 *     node ../website/updateRazorpayKeys.js test
 *
 *   Example - set LIVE keys:
 *     node ../website/updateRazorpayKeys.js live
 */

const path = require('path');
const fs = require('fs');

let admin;

// Try to require firebase-admin from backend's node_modules first
const backendNodeModules = path.resolve(__dirname, '../Vidyarthi Mobile App backend/node_modules/firebase-admin');
const backendAdminPath = path.resolve(backendNodeModules, 'package.json');

try {
    if (fs.existsSync(backendAdminPath)) {
        // Use backend's firebase-admin
        admin = require(backendNodeModules);
    } else {
        // Try regular require (for when firebase-admin is installed in website folder)
        admin = require('firebase-admin');
    }
} catch (error) {
    console.error('❌ Error: firebase-admin is not installed.');
    console.error('   Please run this script from the backend folder:');
    console.error('   cd "Vidyarthi Mobile App backend"');
    console.error('   node ../website/updateRazorpayKeys.js');
    console.error('\n   OR install firebase-admin in website folder:');
    console.error('   cd website');
    console.error('   npm install firebase-admin');
    console.error('   node updateRazorpayKeys.js');
    process.exit(1);
}

// Initialize Firebase Admin
try {
    // Try to use service account key file from backend folder
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
        path.resolve(__dirname, '../Vidyarthi Mobile App backend/serviceAccountKey.json');
    
    let serviceAccount;
    try {
        serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized with service account key');
    } catch (fileError) {
        // If file doesn't exist, try using Application Default Credentials
        console.log('⚠️ Service account file not found, trying Application Default Credentials...');
        admin.initializeApp({
            // Cloud Run automatically provides credentials via Application Default Credentials
        });
        console.log('✅ Firebase Admin initialized with Application Default Credentials');
    }
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
}

const db = admin.firestore();

// Razorpay Keys: Test (for testing purchases) and Live (production)
const KEYS = {
    test: {
        apiKey: 'rzp_test_S68IxG9jhFN8bL',
        secretKey: 'FIhfzgbtzRL7Wc5krcJSuFD1',
    },
    live: {
        apiKey: 'rzp_live_S5c1BFQpL8tS7m',
        secretKey: 'ozXuyD1GL3dxxnzbais9avww',
    },
};

const mode = (process.argv[2] || 'live').toLowerCase();
if (mode !== 'test' && mode !== 'live') {
    console.error('Usage: node updateRazorpayKeys.js [test|live]');
    process.exit(1);
}
const { apiKey, secretKey } = KEYS[mode];

async function updateRazorpayKeys() {
    try {
        console.log(`🔄 Updating Razorpay ${mode.toUpperCase()} Keys in Firestore...`);
        
        const existingConfigs = await db.collection('paymentGatewayConfigs')
            .where('gatewayName', '==', 'Razorpay')
            .get();
        
        if (!existingConfigs.empty) {
            const batch = db.batch();
            existingConfigs.forEach(doc => {
                batch.update(doc.ref, { isActive: false });
            });
            const newConfigRef = db.collection('paymentGatewayConfigs').doc();
            batch.set(newConfigRef, {
                gatewayName: 'Razorpay',
                apiKey,
                secretKey,
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await batch.commit();
            console.log(`✅ Successfully updated Razorpay ${mode.toUpperCase()} Keys in Firestore`);
        } else {
            await db.collection('paymentGatewayConfigs').add({
                gatewayName: 'Razorpay',
                apiKey,
                secretKey,
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ Successfully created Razorpay ${mode.toUpperCase()} Keys in Firestore`);
        }
        
        console.log(`   API Key: ${apiKey}`);
        console.log(`   Secret Key: ${secretKey.substring(0, 10)}...`);
        console.log('\n✅ Done. Backend will use these keys for payment operations.');
        
    } catch (error) {
        console.error('❌ Error updating Razorpay keys:', error);
        process.exit(1);
    }
}

// Run the update
updateRazorpayKeys()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });

