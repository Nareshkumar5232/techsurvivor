import type { MCQAttempt, MCQQuestion } from "@tech-survivor/types";
import { getDb } from "../config/firebaseAdmin.js";
import { COLLECTIONS } from "./collections.js";

function questionsCol() {
  return getDb().collection(COLLECTIONS.MCQ_QUESTIONS);
}

function attemptsCol() {
  return getDb().collection(COLLECTIONS.MCQ_ATTEMPTS);
}

export function attemptId(userId: string, roundId: string): string {
  return `${userId}_${roundId}`;
}

export async function createQuestion(question: MCQQuestion): Promise<void> {
  await questionsCol().doc(question.id).set(question);
}

export async function updateQuestion(id: string, patch: Partial<MCQQuestion>): Promise<void> {
  await questionsCol()
    .doc(id)
    .update({ ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteQuestion(id: string): Promise<void> {
  await questionsCol().doc(id).delete();
}

export async function getQuestion(id: string): Promise<MCQQuestion | null> {
  const snap = await questionsCol().doc(id).get();
  return snap.exists ? (snap.data() as MCQQuestion) : null;
}

export async function listQuestions(filter: { active?: boolean } = {}): Promise<MCQQuestion[]> {
  let query: FirebaseFirestore.Query = questionsCol();
  if (filter.active !== undefined) {
    query = query.where("active", "==", filter.active);
  }
  const snap = await query.get();
  return snap.docs.map((d) => d.data() as MCQQuestion);
}

export async function getQuestionsByIds(ids: string[]): Promise<MCQQuestion[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
  const results = await Promise.all(
    chunks.map((chunk) =>
      questionsCol()
        .where("__name__", "in", chunk)
        .get()
        .then((snap) => snap.docs.map((d) => d.data() as MCQQuestion)),
    ),
  );
  return results.flat();
}

export async function getAttempt(userId: string, roundId: string): Promise<MCQAttempt | null> {
  const snap = await attemptsCol().doc(attemptId(userId, roundId)).get();
  return snap.exists ? (snap.data() as MCQAttempt) : null;
}

/** Atomically creates the attempt only if one does not already exist - the only way an
 *  attempt document for a given (user, round) pair can come into being. */
export async function createAttemptIfNotExists(attempt: MCQAttempt): Promise<{ created: boolean; attempt: MCQAttempt }> {
  const ref = attemptsCol().doc(attemptId(attempt.userId, attempt.roundId));
  return getDb().runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      return { created: false, attempt: existing.data() as MCQAttempt };
    }
    tx.set(ref, attempt);
    return { created: true, attempt };
  });
}

export async function updateAttempt(id: string, patch: Partial<MCQAttempt>): Promise<void> {
  await attemptsCol().doc(id).update(patch);
}

/** Runs `updater` inside a transaction over the attempt doc, guaranteeing the read-then-write
 *  is atomic - used for autosave, submission, and any other state transition. */
export async function transactAttempt<T>(
  id: string,
  updater: (attempt: MCQAttempt | null, tx: FirebaseFirestore.Transaction) => T | Promise<T>,
): Promise<T> {
  const ref = attemptsCol().doc(id);
  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data() as MCQAttempt) : null;
    return updater(current, tx);
  });
}

export function attemptDocRef(id: string) {
  return attemptsCol().doc(id);
}

export async function listAttemptsByRound(roundId: string): Promise<MCQAttempt[]> {
  const snap = await attemptsCol().where("roundId", "==", roundId).get();
  return snap.docs.map((d) => d.data() as MCQAttempt);
}
