import type { LeaderboardEntry } from "@tech-survivor/types";
import { getDb } from "../config/firebaseAdmin.js";
import { COLLECTIONS, DEFAULT_EVENT_ID } from "./collections.js";

interface LeaderboardSnapshot {
  entries: LeaderboardEntry[];
  publishedAt: string;
}

function leaderboardParentDoc() {
  return getDb().collection(COLLECTIONS.LEADERBOARDS).doc(DEFAULT_EVENT_ID);
}

function entriesCol() {
  return leaderboardParentDoc().collection(COLLECTIONS.ENTRIES);
}

export async function getEntry(userId: string): Promise<LeaderboardEntry | null> {
  const snap = await entriesCol().doc(userId).get();
  return snap.exists ? (snap.data() as LeaderboardEntry) : null;
}

export async function listEntries(): Promise<LeaderboardEntry[]> {
  const snap = await entriesCol().get();
  return snap.docs.map((d) => d.data() as LeaderboardEntry);
}

/** Reads the current entry (if any) inside a transaction and lets the caller decide the
 *  merged result - used so a lower coding score can never clobber a previously stored
 *  higher one for the same problem. */
export async function upsertEntryTransaction(
  userId: string,
  updater: (current: LeaderboardEntry | null) => LeaderboardEntry,
): Promise<LeaderboardEntry> {
  const ref = entriesCol().doc(userId);
  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data() as LeaderboardEntry) : null;
    const next = updater(current);
    tx.set(ref, next);
    return next;
  });
}

export async function getSnapshot(): Promise<LeaderboardSnapshot | null> {
  const snap = await leaderboardParentDoc().get();
  const data = snap.data();
  if (!data?.snapshot) return null;
  return { entries: data.snapshot as LeaderboardEntry[], publishedAt: data.snapshotAt as string };
}

export async function saveSnapshot(entries: LeaderboardEntry[]): Promise<void> {
  await leaderboardParentDoc().set(
    { snapshot: entries, snapshotAt: new Date().toISOString() },
    { merge: true },
  );
}
