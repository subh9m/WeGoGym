import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD3cmaVnvmP4oFbSNaYsvpnKdDpeY5YqFI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wegogym-planner.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wegogym-planner",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wegogym-planner.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "826727366293",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:826727366293:web:2dedc1ab41779f379de59c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const functions = getFunctions(app);
export default app;
