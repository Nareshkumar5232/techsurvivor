import type { EventConfig, RoundConfig } from "@tech-survivor/types";
import { getDb } from "../config/firebaseAdmin.js";
import { COLLECTIONS, DEFAULT_EVENT_ID } from "./collections.js";

function eventDoc() {
  return getDb().collection(COLLECTIONS.EVENTS).doc(DEFAULT_EVENT_ID);
}

function roundsCol() {
  return eventDoc().collection(COLLECTIONS.ROUNDS);
}

export async function getEvent(): Promise<EventConfig | null> {
  const snap = await eventDoc().get();
  return snap.exists ? (snap.data() as EventConfig) : null;
}

export async function createEvent(event: EventConfig): Promise<void> {
  await eventDoc().set(event);
}

export async function updateEvent(patch: Partial<EventConfig>): Promise<void> {
  await eventDoc().update({ ...patch, updatedAt: new Date().toISOString() });
}

export async function getRound(roundId: string): Promise<RoundConfig | null> {
  const snap = await roundsCol().doc(roundId).get();
  return snap.exists ? (snap.data() as RoundConfig) : null;
}

export async function getRounds(): Promise<RoundConfig[]> {
  const snap = await roundsCol().get();
  return snap.docs.map((d) => d.data() as RoundConfig);
}

export async function createRound(round: RoundConfig): Promise<void> {
  await roundsCol().doc(round.id).set(round);
}

export async function updateRound(roundId: string, patch: Partial<RoundConfig>): Promise<void> {
  await roundsCol().doc(roundId).update(patch);
}
