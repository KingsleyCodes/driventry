// lib/firebase-admin.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth'; // Importing the correct service for auth

// Check if service account key exists
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing');
}

let serviceAccount;
try {
  // Decode base64 service account key
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
  );
  console.log('✅ Service account decoded successfully for project:', serviceAccount.project_id);
} catch (error) {
  console.error('❌ Failed to decode service account key:', error);
  throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
}

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw error;
  }
}

// 1. Get the Firestore instance
export const adminDb = getFirestore();

// 2. FIX: Configure adminDb to ignore 'undefined' properties
// This prevents the "Cannot use 'undefined' as a Firestore value" error.
adminDb.settings({
    ignoreUndefinedProperties: true
});

// 3. Export the Auth service (since you used getAuth in your API route)
export const auth = getAuth();