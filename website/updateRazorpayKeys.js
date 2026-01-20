/**
 * Script to update Razorpay Live API Keys in Firestore
 * 
 * IMPORTANT: This script must be run from the backend folder where firebase-admin is installed
 * 
 * Usage:
 * 1. Navigate to: "Vidyarthi Mobile App backend" folder
 * 2. Make sure serviceAccountKey.json exists in that folder
 * 3. Run: node ../website/updateRazorpayKeys.js
 * 
 * OR if firebase-admin is installed in website folder:
 * 1. cd website
 * 2. npm install firebase-admin
 * 3. node updateRazorpayKeys.js
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

// Live Razorpay Keys
const LIVE_API_KEY = 'rzp_live_S5c1BFQpL8tS7m';
const LIVE_SECRET_KEY = 'ozXuyD1GL3dxxnzbais9avww';

async function updateRazorpayKeys() {
    try {
        console.log('🔄 Updating Razorpay Live Keys in Firestore...');
        
        // Check if a Razorpay config already exists
        const existingConfigs = await db.collection('paymentGatewayConfigs')
            .where('gatewayName', '==', 'Razorpay')
            .get();
        
        if (!existingConfigs.empty) {
            // Update existing configs - deactivate old ones and create/activate new live one
            const batch = db.batch();
            
            // Deactivate all existing Razorpay configs
            existingConfigs.forEach(doc => {
                batch.update(doc.ref, { isActive: false });
            });
            
            // Create or update the live config
            const liveConfigRef = db.collection('paymentGatewayConfigs').doc();
            batch.set(liveConfigRef, {
                gatewayName: 'Razorpay',
                apiKey: LIVE_API_KEY,
                secretKey: LIVE_SECRET_KEY,
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            await batch.commit();
            console.log('✅ Successfully updated Razorpay Live Keys in Firestore');
            console.log(`   API Key: ${LIVE_API_KEY}`);
            console.log(`   Secret Key: ${LIVE_SECRET_KEY.substring(0, 10)}...`);
        } else {
            // Create new config if none exists
            await db.collection('paymentGatewayConfigs').add({
                gatewayName: 'Razorpay',
                apiKey: LIVE_API_KEY,
                secretKey: LIVE_SECRET_KEY,
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('✅ Successfully created Razorpay Live Keys in Firestore');
            console.log(`   API Key: ${LIVE_API_KEY}`);
            console.log(`   Secret Key: ${LIVE_SECRET_KEY.substring(0, 10)}...`);
        }
        
        console.log('\n✅ Razorpay Live Keys have been updated successfully!');
        console.log('   The backend will now use these keys for all payment operations.');
        
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

