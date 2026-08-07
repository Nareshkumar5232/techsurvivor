import { calculateMcqScore, isQualified, seededShuffle, seedFromString } from "@tech-survivor/shared";
import { ROUND1_QUESTION_COUNT } from "@tech-survivor/config";
import type {
  MCQAttempt,
  MCQAttemptView,
  MCQQuestion,
  MCQQuestionPublic,
  MCQResultView,
  MCQReviewItem,
  MonitoringEventType,
  RoundConfig,
} from "@tech-survivor/types";
import {
  attemptDocRef,
  attemptId,
  createAttemptIfNotExists,
  getAttempt,
  getQuestionsByIds,
  listAttemptsByRound,
  listQuestions,
  transactAttempt,
  updateAttempt,
} from "../repositories/mcqRepo.js";
import { getUserById } from "../repositories/userRepo.js";
import { DEFAULT_EVENT_ID, ROUND1_ID } from "../repositories/collections.js";
import { AppError } from "../lib/errors.js";
import { recordRound1Score } from "./leaderboardService.js";

function displayedOptions(question: MCQQuestion, order: number[]): string[] {
  return order.map((originalIndex) => question.options[originalIndex]!);
}

function toPublicQuestion(question: MCQQuestion, order: number[]): MCQQuestionPublic {
  return {
    id: question.id,
    question: question.question,
    options: displayedOptions(question, order),
    marks: question.marks,
  };
}

export function isExpired(attempt: MCQAttempt): boolean {
  return new Date() >= new Date(attempt.expiresAt);
}

async function buildResultView(attempt: MCQAttempt, round: RoundConfig): Promise<MCQResultView> {
  const questions = await getQuestionsByIds(attempt.assignedQuestionIds);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const totalMarks = attempt.assignedQuestionIds.reduce((sum, qid) => sum + (byId.get(qid)?.marks ?? 0), 0);

  const timeUsedSeconds = Math.round(
    (new Date(attempt.submittedAt ?? new Date()).getTime() - new Date(attempt.startTime).getTime()) / 1000,
  );

  let review: MCQReviewItem[] | null = null;
  if (round.settings.allowAnswerReview) {
    review = attempt.assignedQuestionIds.map((qid) => {
      const q = byId.get(qid)!;
      const order = attempt.optionOrders[qid]!;
      const selectedPosition = attempt.answers[qid];
      return {
        questionId: qid,
        question: q.question,
        options: displayedOptions(q, order),
        selectedOptionIndex: selectedPosition ?? null,
        correctOptionIndex: order.indexOf(q.correctOptionIndex),
        explanation: q.explanation,
      };
    });
  }

  return {
    score: attempt.score ?? 0,
    totalMarks,
    percentage: attempt.percentage ?? 0,
    qualified: attempt.qualified ?? false,
    correctCount: attempt.correctCount ?? 0,
    incorrectCount: attempt.incorrectCount ?? 0,
    unansweredCount: attempt.unansweredCount ?? 0,
    timeUsedSeconds,
    review,
  };
}

export async function finalizeAttempt(
  attempt: MCQAttempt,
  round: RoundConfig,
  status: "submitted" | "auto_submitted",
): Promise<MCQAttempt> {
  const questions = await getQuestionsByIds(attempt.assignedQuestionIds);
  const byId = new Map(questions.map((q) => [q.id, q]));

  const originalIndexAnswers: Record<string, number> = {};
  for (const [qid, position] of Object.entries(attempt.answers)) {
    const order = attempt.optionOrders[qid];
    if (order) originalIndexAnswers[qid] = order[position]!;
  }

  const scoringQuestions = attempt.assignedQuestionIds.map((qid) => {
    const q = byId.get(qid)!;
    return { id: qid, marks: q.marks, negativeMarks: q.negativeMarks, correctOptionIndex: q.correctOptionIndex };
  });

  const result = calculateMcqScore(scoringQuestions, originalIndexAnswers);
  const qualified = isQualified(result.score, round.qualificationMinimumScore);
  const now = new Date().toISOString();

  const patch: Partial<MCQAttempt> = {
    score: result.score,
    percentage: result.percentage,
    correctCount: result.correctCount,
    incorrectCount: result.incorrectCount,
    unansweredCount: result.unansweredCount,
    qualified,
    status,
    submittedAt: now,
  };

  await updateAttempt(attempt.id, patch);

  const user = await getUserById(attempt.userId);
  if (user) await recordRound1Score(user, result.score);

  return { ...attempt, ...patch };
}

/** Every mutating/reading operation on an attempt runs through here first: if the server
 *  clock says the round has expired but the attempt is still "in_progress", it is finalized
 *  right now as auto_submitted. This is what actually enforces "the timer cannot be beaten
 *  by never calling submit" without needing a separate cron job. */
async function withExpiryCheck(attempt: MCQAttempt, round: RoundConfig): Promise<MCQAttempt> {
  if (attempt.status === "in_progress" && isExpired(attempt)) {
    return finalizeAttempt(attempt, round, "auto_submitted");
  }
  return attempt;
}

export async function startAttempt(userId: string, round: RoundConfig): Promise<MCQAttemptView> {
  const existing = await getAttempt(userId, ROUND1_ID);
  if (existing) {
    const checked = await withExpiryCheck(existing, round);
    return buildAttemptView(checked);
  }

  const activeQuestions = await listQuestions({ active: true });
  if (activeQuestions.length === 0) {
    throw new AppError("INTERNAL_ERROR", "No MCQ questions are configured for this event");
  }

  const questionSeed = seedFromString(`${userId}:${ROUND1_ID}:questions`);
  const assignedQuestionIds = seededShuffle(activeQuestions.map((q) => q.id), questionSeed).slice(
    0,
    Math.min(ROUND1_QUESTION_COUNT, activeQuestions.length),
  );

  const optionOrders: Record<string, number[]> = {};
  for (const qid of assignedQuestionIds) {
    const q = activeQuestions.find((question) => question.id === qid)!;
    const optionSeed = seedFromString(`${userId}:${qid}:options`);
    optionOrders[qid] = seededShuffle(q.options.map((_, i) => i), optionSeed);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + round.durationMinutes * 60_000);

  const attempt: MCQAttempt = {
    id: attemptId(userId, ROUND1_ID),
    userId,
    eventId: DEFAULT_EVENT_ID,
    roundId: ROUND1_ID,
    assignedQuestionIds,
    optionOrders,
    answers: {},
    markedForReview: [],
    startTime: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    submittedAt: null,
    score: null,
    percentage: null,
    correctCount: null,
    incorrectCount: null,
    unansweredCount: null,
    qualified: null,
    status: "in_progress",
    monitoringEvents: [],
  };

  const { attempt: created } = await createAttemptIfNotExists(attempt);
  return buildAttemptView(created);
}

async function buildAttemptView(attempt: MCQAttempt): Promise<MCQAttemptView> {
  const questions = await getQuestionsByIds(attempt.assignedQuestionIds);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const orderedQuestions: MCQQuestionPublic[] = attempt.assignedQuestionIds.map((qid) =>
    toPublicQuestion(byId.get(qid)!, attempt.optionOrders[qid]!),
  );

  return {
    id: attempt.id,
    roundId: attempt.roundId,
    questions: orderedQuestions,
    answers: attempt.answers,
    markedForReview: attempt.markedForReview,
    startTime: attempt.startTime,
    expiresAt: attempt.expiresAt,
    status: attempt.status,
  };
}

export async function getAttemptView(userId: string, round: RoundConfig): Promise<MCQAttemptView | null> {
  const attempt = await getAttempt(userId, ROUND1_ID);
  if (!attempt) return null;
  const checked = await withExpiryCheck(attempt, round);
  return buildAttemptView(checked);
}

export async function saveAnswer(userId: string, questionId: string, optionIndex: number): Promise<void> {
  const id = attemptId(userId, ROUND1_ID);
  await transactAttempt(id, (attempt, tx) => {
    if (!attempt) throw new AppError("NOT_FOUND", "Start the round before answering");
    if (attempt.status !== "in_progress") throw new AppError("ALREADY_SUBMITTED", "This attempt was already submitted");
    if (isExpired(attempt)) throw new AppError("ROUND_EXPIRED", "Time is up for this round");
    if (!attempt.assignedQuestionIds.includes(questionId)) {
      throw new AppError("VALIDATION_ERROR", "That question is not part of your attempt");
    }
    tx.update(attemptDocRef(id), { answers: { ...attempt.answers, [questionId]: optionIndex } });
  });
}

export async function setMarkedForReview(
  userId: string,
  questionId: string,
  marked: boolean,
): Promise<void> {
  const id = attemptId(userId, ROUND1_ID);
  await transactAttempt(id, (attempt, tx) => {
    if (!attempt) throw new AppError("NOT_FOUND", "Start the round before marking questions");
    if (attempt.status !== "in_progress") throw new AppError("ALREADY_SUBMITTED", "This attempt was already submitted");
    if (isExpired(attempt)) throw new AppError("ROUND_EXPIRED", "Time is up for this round");
    const set = new Set(attempt.markedForReview);
    if (marked) set.add(questionId);
    else set.delete(questionId);
    tx.update(attemptDocRef(id), { markedForReview: [...set] });
  });
}

export async function recordMonitoringEvent(userId: string, type: MonitoringEventType): Promise<void> {
  const id = attemptId(userId, ROUND1_ID);
  await transactAttempt(id, (attempt, tx) => {
    if (!attempt) return;
    tx.update(attemptDocRef(id), {
      monitoringEvents: [...attempt.monitoringEvents, { type, timestamp: new Date().toISOString() }],
    });
  });
}

export async function submitAttempt(userId: string, round: RoundConfig): Promise<MCQResultView> {
  const id = attemptId(userId, ROUND1_ID);
  const finalized = await transactAttempt(id, async (attempt) => {
    if (!attempt) throw new AppError("NOT_FOUND", "Start the round before submitting");
    if (attempt.status !== "in_progress") {
      throw new AppError("ALREADY_SUBMITTED", "This attempt was already submitted");
    }
    return attempt;
  });

  const status = isExpired(finalized) ? "auto_submitted" : "submitted";
  const result = await finalizeAttempt(finalized, round, status);
  return buildResultView(result, round);
}

export async function getResult(userId: string, round: RoundConfig): Promise<MCQResultView> {
  const attempt = await getAttempt(userId, ROUND1_ID);
  if (!attempt) throw new AppError("NOT_FOUND", "You have not started this round");
  const checked = await withExpiryCheck(attempt, round);
  if (checked.status === "in_progress") {
    throw new AppError("CONFLICT", "This attempt has not been submitted yet");
  }
  return buildResultView(checked, round);
}

/** Admin sweep: finalizes every attempt for the round that is still "in_progress" but whose
 *  timer has already expired. Participants who never call GET/PUT/POST on their own attempt
 *  again after time runs out would otherwise stay "in_progress" forever - this lets an admin
 *  force the sweep before computing qualification instead of waiting for a per-user request. */
export async function finalizeAllExpiredAttempts(round: RoundConfig): Promise<void> {
  const attempts = await listAttemptsByRound(round.id);
  await Promise.all(
    attempts
      .filter((attempt) => attempt.status === "in_progress" && isExpired(attempt))
      .map((attempt) => finalizeAttempt(attempt, round, "auto_submitted")),
  );
}
