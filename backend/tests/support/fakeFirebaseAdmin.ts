import { FakeFirestore } from "./fakeFirestore.js";

/**
 * Drop-in replacement for `src/config/firebaseAdmin.ts`, used via
 * `vi.mock("../src/config/firebaseAdmin.js", () => import("./support/fakeFirebaseAdmin.js"))`
 * in test files. Exposes the exact same function names as the real module so every
 * repository file (which imports getDb/getFirebaseAuth from there) keeps working unmodified.
 */

export const fakeDb = new FakeFirestore();

type DecodedTokenResult = { uid: string; email?: string; email_verified?: boolean; role?: string } | Error;

let nextVerifyResult: DecodedTokenResult = new Error("no fake token configured");

export function setNextVerifyIdTokenResult(result: DecodedTokenResult): void {
  nextVerifyResult = result;
}

export function getDb() {
  return fakeDb;
}

export function getFirebaseAuth() {
  return {
    async verifyIdToken() {
      if (nextVerifyResult instanceof Error) throw nextVerifyResult;
      return nextVerifyResult;
    },
  };
}

export function getFirebaseStorage() {
  throw new Error("FakeFirebaseAdmin: storage is not supported in tests");
}

export function isFirebaseAdminInitialized(): boolean {
  return true;
}

export function resetFakeFirestore(): void {
  fakeDb.reset();
  nextVerifyResult = new Error("no fake token configured");
}
