import type { UserProfile, UserStatus } from "@tech-survivor/types";
import { getDb } from "../config/firebaseAdmin.js";
import { COLLECTIONS } from "./collections.js";

function usersCol() {
  return getDb().collection(COLLECTIONS.USERS);
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  const snap = await usersCol().doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as UserProfile;
}

export async function createUser(profile: UserProfile): Promise<void> {
  await usersCol().doc(profile.uid).create(profile);
}

export async function updateUser(uid: string, patch: Partial<UserProfile>): Promise<void> {
  await usersCol().doc(uid).update({ ...patch, updatedAt: new Date().toISOString() });
}

export async function findByRollNumber(rollNumber: string): Promise<UserProfile | null> {
  const snap = await usersCol().where("rollNumber", "==", rollNumber).limit(1).get();
  return snap.empty ? null : (snap.docs[0]!.data() as UserProfile);
}

export async function findByEventRegistrationId(eventRegistrationId: string): Promise<UserProfile | null> {
  const snap = await usersCol().where("eventRegistrationId", "==", eventRegistrationId).limit(1).get();
  return snap.empty ? null : (snap.docs[0]!.data() as UserProfile);
}

export interface ListUsersFilter {
  status?: UserStatus;
  search?: string;
}

export async function listUsers(filter: ListUsersFilter = {}): Promise<UserProfile[]> {
  let query: FirebaseFirestore.Query = usersCol();
  if (filter.status) {
    query = query.where("status", "==", filter.status);
  }
  const snap = await query.get();
  let users = snap.docs.map((d) => d.data() as UserProfile);
  if (filter.search) {
    const term = filter.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.rollNumber.toLowerCase().includes(term),
    );
  }
  return users;
}

export async function setDisqualified(uid: string, disqualified: boolean, reason: string | null): Promise<void> {
  await usersCol().doc(uid).update({
    disqualified,
    disqualificationReason: reason,
    status: disqualified ? "disqualified" : "active",
    updatedAt: new Date().toISOString(),
  });
}
