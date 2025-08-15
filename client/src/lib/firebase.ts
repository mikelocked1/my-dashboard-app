import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCRpIJ-kfEuX6iRUZCAqJ8ZSIQOqKQi8mU",
  authDomain: "health-compound.firebaseapp.com",
  projectId: "health-compound",
  storageBucket: "health-compound.firebasestorage.app",
  messagingSenderId: "808721261273",
  appId: "1:808721261273:web:c65762c1d14842488794c8",
  measurementId: "G-L0QGXCZW8B",
};

// Initialize Firebase only if no apps exist (prevents duplicate app error during HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
