import type { CodingProblem, SavedCode, Submission } from "@tech-survivor/types";
import { getDb } from "../config/firebaseAdmin.js";
import { COLLECTIONS } from "./collections.js";

function problemsCol() {
  return getDb().collection(COLLECTIONS.CODING_PROBLEMS);
}

function savedCodeCol() {
  return getDb().collection(COLLECTIONS.SAVED_CODE);
}

function submissionsCol() {
  return getDb().collection(COLLECTIONS.SUBMISSIONS);
}

export async function createProblem(problem: CodingProblem): Promise<void> {
  await problemsCol().doc(problem.id).set(problem);
}

export async function updateProblem(id: string, patch: Partial<CodingProblem>): Promise<void> {
  await problemsCol()
    .doc(id)
    .update({ ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteProblem(id: string): Promise<void> {
  await problemsCol().doc(id).delete();
}

export async function getProblem(id: string): Promise<CodingProblem | null> {
  const snap = await problemsCol().doc(id).get();
  return snap.exists ? (snap.data() as CodingProblem) : null;
}

export async function listProblems(filter: { active?: boolean } = {}): Promise<CodingProblem[]> {
  let query: FirebaseFirestore.Query = problemsCol();
  if (filter.active !== undefined) {
    query = query.where("active", "==", filter.active);
  }
  const snap = await query.get();
  return snap.docs.map((d) => d.data() as CodingProblem);
}

function savedCodeId(userId: string, problemId: string, language: string): string {
  return `${userId}_${problemId}_${language}`;
}

export async function getSavedCode(userId: string, problemId: string, language: string): Promise<SavedCode | null> {
  const snap = await savedCodeCol().doc(savedCodeId(userId, problemId, language)).get();
  return snap.exists ? (snap.data() as SavedCode) : null;
}

export async function upsertSavedCode(saved: SavedCode): Promise<void> {
  await savedCodeCol()
    .doc(savedCodeId(saved.userId, saved.problemId, saved.language))
    .set(saved, { merge: true });
}

export async function createSubmission(submission: Submission): Promise<void> {
  await submissionsCol().doc(submission.id).set(submission);
}

export async function updateSubmission(id: string, patch: Partial<Submission>): Promise<void> {
  await submissionsCol().doc(id).update(patch);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const snap = await submissionsCol().doc(id).get();
  return snap.exists ? (snap.data() as Submission) : null;
}

export async function listSubmissionsForUser(userId: string, problemId?: string): Promise<Submission[]> {
  let query: FirebaseFirestore.Query = submissionsCol().where("userId", "==", userId);
  if (problemId) query = query.where("problemId", "==", problemId);
  const snap = await query.orderBy("submittedAt", "desc").get();
  return snap.docs.map((d) => d.data() as Submission);
}

export async function listSubmissionsForEvent(eventId: string): Promise<Submission[]> {
  const snap = await submissionsCol().where("eventId", "==", eventId).get();
  return snap.docs.map((d) => d.data() as Submission);
}

export async function getBestSubmissionScore(userId: string, problemId: string): Promise<number> {
  const snap = await submissionsCol()
    .where("userId", "==", userId)
    .where("problemId", "==", problemId)
    .where("kind", "==", "submit")
    .where("status", "==", "completed")
    .get();
  let best = 0;
  for (const doc of snap.docs) {
    const score = (doc.data() as Submission).score;
    if (score > best) best = score;
  }
  return best;
}
