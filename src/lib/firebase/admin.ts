import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

// Firebase Admin SDK initialization for server-side operations
// Uses environment variables for credentials

let adminApp: App | undefined;
let adminAuth: Auth | undefined;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
    return adminApp;
  }

  // Check for service account credentials
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    // Parse JSON service account key from environment variable
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } catch {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON');
    }
  } else {
    // Fall back to application default credentials (for GCP environments)
    // or use project ID only (limited functionality)
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  return adminApp;
}

export function getAdminAuth(): Auth {
  if (adminAuth) return adminAuth;
  adminAuth = getAuth(getAdminApp());
  return adminAuth;
}

export { getAdminApp };
