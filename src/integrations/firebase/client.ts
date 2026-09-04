import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The browser key is supplied through an ignored local/CI environment file.
// Access is additionally restricted to the authorized application domains.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "perfumecontrol-maia-2026.firebaseapp.com",
  projectId: "perfumecontrol-maia-2026",
  storageBucket: "perfumecontrol-maia-2026.firebasestorage.app",
  messagingSenderId: "303494726947",
  appId: "1:303494726947:web:61b87694218051f3d7b896",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
