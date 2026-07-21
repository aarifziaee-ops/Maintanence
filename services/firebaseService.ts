
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Firestore, setLogLevel } from 'firebase/firestore';
import { AppState } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
const COLLECTION_NAME = 'app_data';
const DOC_ID = 'main_db';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const CONFIG_FROM_ENV: FirebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
};

export const initFirebase = (config?: FirebaseConfig) => {
  try {
    const configToUse = config || CONFIG_FROM_ENV;
    
    // Check if already initialized
    if (getApps().length > 0) {
       app = getApps()[0];
       if (!db) db = getFirestore(app);
       return true;
    }

    // If not initialized, we need config
    if (!configToUse || !configToUse.apiKey || !configToUse.projectId) {
        return false;
    }

    const cleanConfig = {
      ...configToUse,
      apiKey: configToUse.apiKey.trim(),
      projectId: configToUse.projectId.trim(),
      authDomain: configToUse.authDomain ? configToUse.authDomain.trim() : `${configToUse.projectId.trim()}.firebaseapp.com`
    };
    app = initializeApp(cleanConfig);
    db = getFirestore(app);
    setLogLevel('silent');
    console.log("Firebase/Firestore initialized successfully");
    
    return true;
  } catch (error) {
    console.warn("Firebase initialization failed:", error instanceof Error ? error.message : error);
    return false;
  }
};

export const saveToCloud = async (data: AppState): Promise<boolean> => {
  if (!db) return false;

  try {
    // CRITICAL FIX: Firestore throws error if data contains 'undefined' values.
    // JSON stringify/parse removes undefined fields, making the object safe for Firestore.
    const cleanData = JSON.parse(JSON.stringify(data));
    
    await setDoc(doc(db, COLLECTION_NAME, DOC_ID), cleanData);
    console.log("Data saved to cloud successfully");
    return true;
  } catch (error) {
    console.warn("Failed to save to cloud:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
};

export const loadFromCloud = async (): Promise<AppState | null> => {
  if (!db) return null;

  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Data loaded from cloud");
      return docSnap.data() as AppState;
    } else {
      console.log("No cloud data found!");
      return null;
    }
  } catch (error) {
    console.warn("Failed to load from cloud:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
};

export const isCloudEnabled = (): boolean => {
  return !!db;
};
