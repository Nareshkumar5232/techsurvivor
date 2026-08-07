import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Scripts read Firebase Admin credentials from backend/.env - copy ` +
        `backend/.env.example to backend/.env and fill it in before running seed/create-admin.`,
    );
  }
  return value;
}

function getApp() {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;
  return initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

export const auth = getAuth(getApp());
export const db = getFirestore(getApp());
