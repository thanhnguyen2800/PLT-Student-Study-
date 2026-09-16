import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { Quiz, UserProfile, QuizAttempt, AuditLog } from '../../types';
import appletConfig from '../../../firebase-applet-config.json';

interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
}

let firestoreInstance: Firestore | null = null;
let firebaseAppInstance: FirebaseApp | null = null;
let isConfigured = false;

// Initialize Firebase client on server-side
export function getBackendFirestore(): Firestore | null {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  try {
    const config: FirebaseConfig = {
      ...appletConfig,
      projectId: process.env.FIREBASE_PROJECT_ID || appletConfig.projectId,
      appId: process.env.FIREBASE_APP_ID || appletConfig.appId,
      apiKey: process.env.FIREBASE_API_KEY || appletConfig.apiKey,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
      firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
    };

    if (!config.projectId || !config.apiKey) {
      console.warn('[Firebase Server] Missing projectId or apiKey in firebase-applet-config.json');
      return null;
    }

    const appName = 'STUDENT_STUDY_BACKEND';
    const existingApps = getApps();
    const app = existingApps.find(a => a.name === appName) || initializeApp({
      projectId: config.projectId,
      apiKey: config.apiKey,
      appId: config.appId,
      authDomain: config.authDomain,
      storageBucket: config.storageBucket,
    }, appName);

    firebaseAppInstance = app;

    if (config.firestoreDatabaseId) {
      firestoreInstance = getFirestore(app, config.firestoreDatabaseId);
    } else {
      firestoreInstance = getFirestore(app);
    }

    isConfigured = true;
    console.log(`[Firebase Server] Successfully connected to Firestore (Project: ${config.projectId}, DB: ${config.firestoreDatabaseId || '(default)'})`);
    return firestoreInstance;
  } catch (error) {
    console.error('[Firebase Server] Error initializing Firestore:', error);
    return null;
  }
}

export function isFirestoreReady(): boolean {
  return isConfigured && firestoreInstance !== null;
}

// Clean object for Firestore (removes undefined fields which Firestore rejects)
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): any {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) {
      continue;
    }
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = sanitizeForFirestore(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map(item => (item !== null && typeof item === 'object' ? sanitizeForFirestore(item) : item));
    } else {
      result[key] = val;
    }
  }
  return result;
}

// =============================================================================
// QUIZ OPERATIONS (FIRESTORE)
// =============================================================================

export async function saveQuizToFirestore(quiz: Quiz): Promise<boolean> {
  const db = getBackendFirestore();
  if (!db || !quiz.id) return false;

  try {
    const quizRef = doc(db, 'quizzes', quiz.id);
    const sanitized = sanitizeForFirestore(quiz);
    await setDoc(quizRef, {
      ...sanitized,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firebase Server] Error saving quiz ${quiz.id} to Firestore:`, err);
    return false;
  }
}

export async function deleteQuizFromFirestore(quizId: string): Promise<boolean> {
  const db = getBackendFirestore();
  if (!db || !quizId) return false;

  try {
    const quizRef = doc(db, 'quizzes', quizId);
    await deleteDoc(quizRef);
    return true;
  } catch (err) {
    console.error(`[Firebase Server] Error deleting quiz ${quizId} from Firestore:`, err);
    return false;
  }
}

export async function loadAllQuizzesFromFirestore(): Promise<Quiz[]> {
  const db = getBackendFirestore();
  if (!db) return [];

  try {
    const colRef = collection(db, 'quizzes');
    const snap = await getDocs(colRef);
    const quizzes: Quiz[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as Quiz;
      if (data && data.id) {
        quizzes.push(data);
      }
    });
    return quizzes;
  } catch (err) {
    console.error('[Firebase Server] Error loading quizzes from Firestore:', err);
    return [];
  }
}

// =============================================================================
// USER OPERATIONS (FIRESTORE)
// =============================================================================

export async function saveUserToFirestore(user: UserProfile): Promise<boolean> {
  const db = getBackendFirestore();
  if (!db || !user.uid) return false;

  try {
    const userRef = doc(db, 'users', user.uid);
    const sanitized = sanitizeForFirestore(user);
    await setDoc(userRef, {
      ...sanitized,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firebase Server] Error saving user ${user.uid} to Firestore:`, err);
    return false;
  }
}

export async function getUserByEmailFromFirestore(email: string): Promise<UserProfile | null> {
  const users = await loadAllUsersFromFirestore();
  const target = email.toLowerCase().trim();
  return users.find(user => user.email.toLowerCase().trim() === target) || null;
}

export async function deleteUserFromFirestore(uid: string): Promise<boolean> {
  const db = getBackendFirestore();
  if (!db || !uid) return false;

  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    return true;
  } catch (err) {
    console.error(`[Firebase Server] Error deleting user ${uid} from Firestore:`, err);
    return false;
  }
}

export async function loadAllUsersFromFirestore(): Promise<UserProfile[]> {
  const db = getBackendFirestore();
  if (!db) return [];

  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    const users: UserProfile[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as UserProfile;
      if (data && data.uid) {
        users.push(data);
      }
    });
    return users;
  } catch (err) {
    console.error('[Firebase Server] Error loading users from Firestore:', err);
    return [];
  }
}

// =============================================================================
// ATTEMPT OPERATIONS (FIRESTORE)
// =============================================================================

export async function saveAttemptToFirestore(attempt: QuizAttempt): Promise<boolean> {
  const db = getBackendFirestore();
  if (!db || !attempt.id) return false;

  try {
    const attemptRef = doc(db, 'quizAttempts', attempt.id);
    const sanitized = sanitizeForFirestore(attempt);
    await setDoc(attemptRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firebase Server] Error saving attempt ${attempt.id} to Firestore:`, err);
    return false;
  }
}

export async function loadAllAttemptsFromFirestore(): Promise<QuizAttempt[]> {
  const db = getBackendFirestore();
  if (!db) return [];

  try {
    const colRef = collection(db, 'quizAttempts');
    const snap = await getDocs(colRef);
    const list: QuizAttempt[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as QuizAttempt;
      if (data && data.id) {
        list.push(data);
      }
    });
    return list;
  } catch (err) {
    console.error('[Firebase Server] Error loading attempts from Firestore:', err);
    return [];
  }
}

// =============================================================================
// AUDIT LOG OPERATIONS (FIRESTORE)
// =============================================================================

export async function saveAuditLogToFirestore(log: AuditLog): Promise<boolean> {
  const db = getBackendFirestore();
  if (!db || !log.id) return false;

  try {
    const logRef = doc(db, 'auditLogs', log.id);
    const sanitized = sanitizeForFirestore(log);
    await setDoc(logRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firebase Server] Error saving audit log ${log.id} to Firestore:`, err);
    return false;
  }
}

export async function loadAllAuditLogsFromFirestore(): Promise<AuditLog[]> {
  const db = getBackendFirestore();
  if (!db) return [];

  try {
    const colRef = collection(db, 'auditLogs');
    const snap = await getDocs(colRef);
    const list: AuditLog[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as AuditLog;
      if (data && data.id) {
        list.push(data);
      }
    });
    return list;
  } catch (err) {
    console.error('[Firebase Server] Error loading audit logs from Firestore:', err);
    return [];
  }
}

// =============================================================================
// GAME SESSION OPERATIONS (FIRESTORE REALTIME DATABASE SYNC)
// =============================================================================

export async function saveGameSessionToFirestore(session: any): Promise<boolean> {
  const db = getBackendFirestore();
  const sessionId = session?.pin || session?.id;
  if (!db || !sessionId) return false;

  try {
    const sessionRef = doc(db, 'gameSessions', String(sessionId));
    const sanitized = sanitizeForFirestore({
      ...session,
      id: String(sessionId),
      pin: String(sessionId),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(sessionRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firebase Server] Error saving game session ${sessionId} to Firestore:`, err);
    return false;
  }
}

export async function getGameSessionFromFirestore(sessionId: string): Promise<any | null> {
  const db = getBackendFirestore();
  if (!db || !sessionId) return null;

  try {
    const sessionRef = doc(db, 'gameSessions', String(sessionId));
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error(`[Firebase Server] Error fetching game session ${sessionId} from Firestore:`, err);
    return null;
  }
}

export async function deleteGameSessionFromFirestore(sessionId: string): Promise<boolean> {
  const db = getBackendFirestore();
  if (!db || !sessionId) return false;

  try {
    const sessionRef = doc(db, 'gameSessions', String(sessionId));
    await deleteDoc(sessionRef);
    return true;
  } catch (err) {
    console.error(`[Firebase Server] Error deleting game session ${sessionId} from Firestore:`, err);
    return false;
  }
}

