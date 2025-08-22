import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Check if Firebase configuration is provided via environment variables
const useFirebase = import.meta.env.VITE_FIREBASE_API_KEY &&
                   import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = useFirebase ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} : null;

// Initialize Firebase only if configuration is available and no apps exist
let auth: any = null;
let db: any = null;

if (firebaseConfig) {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.log('Firebase not configured - using mock authentication for development');
}

export { auth, db };
// Check if Firebase is configured
export const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

console.log('Firebase Configuration Check:', {
  apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: !!import.meta.env.VITE_FIREBASE_APP_ID,
  isConfigured: isFirebaseConfigured
});