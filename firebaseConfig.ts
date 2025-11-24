// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { Storage, getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Import getReactNativePersistence for React Native persistence
// In Firebase v12, it should be available from firebase/auth
let getReactNativePersistence: ((storage: any) => any) | null = null;

// Try multiple import paths for compatibility
try {
  // Method 1: Try direct import (Firebase v12+)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const authModule = require("firebase/auth");
  if (authModule?.getReactNativePersistence) {
    getReactNativePersistence = authModule.getReactNativePersistence;
  }
} catch {
  try {
    // Method 2: Try from react-native subpath
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rnAuth = require("firebase/auth/react-native");
    if (rnAuth?.getReactNativePersistence) {
      getReactNativePersistence = rnAuth.getReactNativePersistence;
    }
  } catch {
    // If not available, we'll use initializeAuth without explicit persistence
    // This will still work but may show a warning
  }
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDG4z61DGOoSVFekLsf7T0_AlK2Fk2Y_WA",
  authDomain: "secondapp-d20ec.firebaseapp.com",
  projectId: "secondapp-d20ec",
  storageBucket: "secondapp-d20ec.firebasestorage.app",
  messagingSenderId: "833911179653",
  appId: "1:833911179653:web:0e0fd5cf75d5476ed85cec",
  measurementId: "G-3937F8G7F8"
};

// Initialize Firebase
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw new Error("Failed to initialize Firebase. Please check your configuration.");
}

// Initialize Auth with proper persistence for React Native
let auth: Auth;
try {
  if (Platform.OS === "web") {
    // For web, use standard getAuth
    auth = getAuth(app);
  } else {
    // For React Native, use initializeAuth with AsyncStorage for persistence
    try {
      if (getReactNativePersistence) {
        // Try to initialize with AsyncStorage persistence
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } else {
        // Fallback: initialize without explicit persistence
        auth = initializeAuth(app);
      }
    } catch (error: any) {
      // If auth is already initialized, just get it
      if (error?.code === "auth/already-initialized") {
        auth = getAuth(app);
      } else {
        // Final fallback to getAuth
        console.warn("Using getAuth fallback:", error?.message);
        auth = getAuth(app);
      }
    }
  }
} catch (error) {
  console.error("Firebase Auth initialization error:", error);
  throw new Error("Failed to initialize Firebase Authentication. Please ensure Email/Password sign-in is enabled in Firebase Console.");
}

// Initialize Firestore
let db: Firestore;
try {
  db = getFirestore(app);
} catch (error) {
  console.error("Firestore initialization error:", error);
  throw new Error("Failed to initialize Firestore. Please check your Firebase configuration.");
}

// Initialize Storage (optional - only if Storage is needed)
let storage: Storage | null = null;
try {
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase Storage initialization warning:", error);
  // Don't throw error - Storage is optional for basic functionality
  // Only log warning so app can still run without Storage
}

export { app, auth, db, storage };

