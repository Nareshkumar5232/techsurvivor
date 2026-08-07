import type { UserProfile } from "@tech-survivor/types";
import { auth, db } from "./firebaseAdmin.js";

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const raw of process.argv.slice(2)) {
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]!] = match[2]!;
  }
  return args;
}

export interface UpsertAdminInput {
  email: string;
  password?: string;
  name?: string;
}

/** Creates (or promotes an existing) Firebase Auth user to an admin: sets the "role":"admin"
 *  custom claim and writes/merges a matching Firestore users/{uid} profile. Used by both the
 *  create-admin CLI and the seed script (so there is exactly one place this logic lives). */
export async function upsertAdmin({ email, password, name }: UpsertAdminInput): Promise<string> {
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
  } catch {
    if (!password) {
      throw new Error(
        `No Firebase Auth user exists for ${email} yet, and no --password was given to create one.`,
      );
    }
    const created = await auth.createUser({ email, password, emailVerified: true });
    uid = created.uid;
  }

  await auth.setCustomUserClaims(uid, { role: "admin" });

  const now = new Date().toISOString();
  const existingDoc = await db.collection("users").doc(uid).get();
  const existingData = existingDoc.data();
  const profile: UserProfile = {
    uid,
    role: "admin",
    fullName: name ?? (existingData?.fullName as string | undefined) ?? "Event Administrator",
    email,
    emailVerified: true,
    institution: (existingData?.institution as string | undefined) ?? "Tech Survivor Organizing Committee",
    department: (existingData?.department as string | undefined) ?? "Administration",
    year: (existingData?.year as string | undefined) ?? "-",
    rollNumber: (existingData?.rollNumber as string | undefined) ?? `admin-${uid.slice(0, 8)}`,
    phone: (existingData?.phone as string | undefined) ?? "-",
    eventRegistrationId: null,
    profileComplete: true,
    status: "active",
    disqualified: false,
    disqualificationReason: null,
    createdAt: (existingData?.createdAt as string | undefined) ?? now,
    updatedAt: now,
  };
  await db.collection("users").doc(uid).set(profile, { merge: true });

  return uid;
}

async function main(): Promise<void> {
  const { email, password, name } = parseArgs();
  if (!email) {
    console.error(
      "Usage: npm run create-admin -- --email=admin@example.com [--password=SetAStrongPassword1] [--name=\"Admin Name\"]",
    );
    process.exitCode = 1;
    return;
  }

  const uid = await upsertAdmin({ email, password, name });
  console.log(`\n${email} is now an administrator (uid: ${uid}).`);
  console.log("The custom claim takes effect the next time that account signs in or refreshes its ID token.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("create-admin failed:", err);
    process.exit(1);
  });
