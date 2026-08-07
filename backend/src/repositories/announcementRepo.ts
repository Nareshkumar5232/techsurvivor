import type { Announcement } from "@tech-survivor/types";
import { getDb } from "../config/firebaseAdmin.js";
import { COLLECTIONS } from "./collections.js";

function announcementsCol() {
  return getDb().collection(COLLECTIONS.ANNOUNCEMENTS);
}

export async function createAnnouncement(announcement: Announcement): Promise<void> {
  await announcementsCol().doc(announcement.id).set(announcement);
}

export async function updateAnnouncement(id: string, patch: Partial<Announcement>): Promise<void> {
  await announcementsCol()
    .doc(id)
    .update({ ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await announcementsCol().doc(id).delete();
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const snap = await announcementsCol().get();
  return snap.docs.map((d) => d.data() as Announcement);
}

export async function listActiveAnnouncements(now: string): Promise<Announcement[]> {
  const all = await listAnnouncements();
  return all.filter(
    (a) => a.active && a.publishAt <= now && (!a.expiresAt || a.expiresAt >= now),
  );
}
