import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA_PQC-7uKPPR2Ovm3aWbHdozJbNxIWKCU",
  authDomain: "saverecipe-f4a9c.firebaseapp.com",
  projectId: "saverecipe-f4a9c",
  storageBucket: "saverecipe-f4a9c.firebasestorage.app",
  messagingSenderId: "599694079534",
  appId: "1:599694079534:web:71fa9fe68a4efa7caed1bf",
  measurementId: "G-R3M6XG48DF"
};

// Initialize Firebase (avoid re-initializing if already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Storage
export const storage = getStorage(app);

export default app;
