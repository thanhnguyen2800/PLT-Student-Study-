import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Safe environment config extraction (supports Vite and Next.js env naming)
const getEnv = (key: string, nextKey: string): string => {
  if (typeof window !== 'undefined') {
    const metaEnv = (import.meta as any).env || {};
    return (metaEnv[key] as string) || (metaEnv[nextKey] as string) || '';
  }
  return process.env[key] || process.env[nextKey] || '';
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL', 'NEXT_PUBLIC_FIREBASE_DATABASE_URL'),
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let realtimeDb: Database | null = null;
let storage: FirebaseStorage | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
};

export const getClientAuth = (): Auth | null => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!auth) {
    auth = getAuth(firebaseApp);
  }
  return auth;
};

export const getClientFirestore = (): Firestore | null => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }
  return firestore;
};

export const getClientRealtimeDb = (): Database | null => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp || !firebaseConfig.databaseURL) return null;
  if (!realtimeDb) {
    realtimeDb = getDatabase(firebaseApp);
  }
  return realtimeDb;
};

export const getClientStorage = (): FirebaseStorage | null => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!storage) {
    storage = getStorage(firebaseApp);
  }
  return storage;
};
