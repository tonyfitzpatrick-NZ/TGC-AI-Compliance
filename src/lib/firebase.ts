import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// src/lib/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "tgc-ai-compliance.firebaseapp.com",
  projectId: "tgc-ai-compliance",
  storageBucket: "tgc-ai-compliance.firebasestorage.app",
  messagingSenderId: "786308393149",
  appId: "1:786308393149:web:fc5577715cdd5319f62fd4",
  measurementId: "G-ZRH83R0MQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
