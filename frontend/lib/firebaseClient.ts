import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function createFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
}

/**
 * The Firebase client SDK must never be initialized during Next.js's server-side
 * prerendering pass: there is no `window` there, and build-time environment values may be
 * placeholders (e.g. in CI without real Firebase credentials configured yet). Every real
 * consumer of these exports (AuthProvider's useEffect, apiClient's per-request token fetch,
 * onClick handlers) only runs after hydration in an actual browser, so it's safe for these to
 * be `null` during SSR - nothing dereferences them synchronously during a server render.
 */
export const firebaseApp: FirebaseApp = typeof window !== "undefined" ? createFirebaseApp() : (null as unknown as FirebaseApp);
export const firebaseAuth: Auth = typeof window !== "undefined" ? getAuth(firebaseApp) : (null as unknown as Auth);
