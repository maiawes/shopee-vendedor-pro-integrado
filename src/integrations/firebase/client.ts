import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web configuration is public by design. Security is enforced by
// Firebase Authentication and the Firestore rules (ownerId == auth.uid).
const firebaseConfig = {
  apiKey: "AIzaSyAsUNQ7MhAnxGmQSPBUcnBxsIK4LZvWq7Y",
  authDomain: "perfumecontrol-maia-2026.firebaseapp.com",
  projectId: "perfumecontrol-maia-2026",
  storageBucket: "perfumecontrol-maia-2026.firebasestorage.app",
  messagingSenderId: "303494726947",
  appId: "1:303494726947:web:61b87694218051f3d7b896",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
