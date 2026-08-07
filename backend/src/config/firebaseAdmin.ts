import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { loadEnv } from "./env.js";

let app: App | undefined;

function getOrInitApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0]!;
    return app;
  }

  const env = loadEnv();
  app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Environment files store the key with literal "\n" sequences; convert
      // them back to real newlines or the PEM key fails to parse.
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
  });
  return app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getOrInitApp());
}

export function getDb(): Firestore {
  return getFirestore(getOrInitApp());
}

export function getFirebaseStorage(): Storage {
  return getStorage(getOrInitApp());
}

export function isFirebaseAdminInitialized(): boolean {
  try {
    getOrInitApp();
    return true;
  } catch {
    return false;
  }
}
