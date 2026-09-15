import admin from 'firebase-admin';

let isInitialized = false;

export const isFirebaseAdminConfigured = (): boolean => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  return Boolean(projectId && clientEmail && privateKey);
};

export const getFirebaseAdmin = (): typeof admin | null => {
  if (isInitialized && (admin as any).apps?.length > 0) {
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    // Format private key if escaped newlines are present
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if ((admin as any).apps?.length === 0) {
      (admin as any).initializeApp({
        credential: (admin as any).credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`,
      });
    }

    isInitialized = true;
    return admin;
  } catch (error) {
    console.warn('[Firebase Admin] Initialization failed:', error);
    return null;
  }
};

export const getAdminAuth = (): any | null => {
  const adm = getFirebaseAdmin();
  return adm ? (adm as any).auth() : null;
};

export const getAdminFirestore = (): any | null => {
  const adm = getFirebaseAdmin();
  return adm ? (adm as any).firestore() : null;
};

export const getAdminDatabase = (): any | null => {
  const adm = getFirebaseAdmin();
  return adm ? (adm as any).database() : null;
};
