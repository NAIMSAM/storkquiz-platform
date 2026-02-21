import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Configuration Firebase — valeurs injectées dynamiquement au runtime ou via .env en local
const firebaseConfig = {
  apiKey: window._env_?.FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: window._env_?.FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: window._env_?.FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: window._env_?.FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window._env_?.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: window._env_?.FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: window._env_?.FIREBASE_DATABASE_URL || import.meta.env.VITE_FIREBASE_DATABASE_URL
};

let db: any = null;
let auth: any = null;
let isFirebaseInitialized = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
    console.log("🔥 Initialisation Firebase...");
    const app = initializeApp(firebaseConfig);

    // Initialisation Services
    db = getDatabase(app);
    auth = getAuth(app);

    isFirebaseInitialized = true;
    console.log("✅ Firebase connecté : Auth & Database actifs.");
  } else {
    console.warn("⚠️ Configuration Firebase incomplète. Vérifiez votre fichier .env");
  }
} catch (e) {
  console.error("❌ Erreur critique Firebase:", e);
}

export { db, auth, isFirebaseInitialized };
export { ref, set, onValue, push };
