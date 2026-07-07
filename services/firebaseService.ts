
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

export const initFirebase = (config?: FirebaseConfig) => {
  try {
    // Check if already initialized
    if (getApps().length > 0) {
       app = getApps()[0];
       if (!db) db = getFirestore(app);
       return true;
    }

    // If not initialized, we need config
    if (!config || !config.apiKey || !config.projectId) {
        return false;
    }

    app = initializeApp(config);
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
