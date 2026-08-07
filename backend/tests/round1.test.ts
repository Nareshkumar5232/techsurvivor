import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/firebaseAdmin.js", () => import("./support/fakeFirebaseAdmin.js"));

import { resetFakeFirestore } from "./support/fakeFirebaseAdmin.js";
import { makeQuestions, makeRound, makeUser } from "./support/fixtures.js";
import { createQuestion, getAttempt } from "../src/repositories/mcqRepo.js";
import { createUser } from "../src/repositories/userRepo.js";
import {
  getAttemptView,
  getResult,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from "../src/services/mcqService.js";
import { AppError } from "../src/lib/errors.js";

const USER_ID = "user-1";

async function seedQuestions() {
  const questions = makeQuestions(20);
  for (const q of questions) await createQuestion(q);
  return questions;
}

/** Options are shuffled per participant/question, so "the correct answer" is not always
 *  displayed at position 0 - look up the raw attempt's optionOrders (server-only data) to
 *  find which displayed position actually corresponds to the correct original option. */
async function correctDisplayedPosition(userId: string, questionId: string): Promise<number> {
  const attempt = await getAttempt(userId, "round1");
  const order = attempt!.optionOrders[questionId]!;
  return order.indexOf(0); // every fixture question's correctOptionIndex is 0
}

function wrongDisplayedPosition(correctPosition: number): number {
  return (correctPosition + 1) % 4;
}

describe("Round 1 qualification boundary", () => {
  beforeEach(async () => {
    resetFakeFirestore();
    await createUser(makeUser({ uid: USER_ID }));
    await seedQuestions();
  });

  it("14/20 correct does NOT qualify", async () => {
    const round = makeRound({ qualificationMinimumScore: 15 });
    const view = await startAttempt(USER_ID, round);

    for (let i = 0; i < 20; i++) {
      const qid = view.questions[i]!.id;
      const correctPos = await correctDisplayedPosition(USER_ID, qid);
      await saveAnswer(USER_ID, qid, i < 14 ? correctPos : wrongDisplayedPosition(correctPos));
    }

    const result = await submitAttempt(USER_ID, round);
    expect(result.score).toBe(14);
    expect(result.qualified).toBe(false);
  });

  it("15/20 correct DOES qualify", async () => {
    const round = makeRound({ qualificationMinimumScore: 15 });
    const view = await startAttempt(USER_ID, round);

    for (let i = 0; i < 20; i++) {
      const qid = view.questions[i]!.id;
      const correctPos = await correctDisplayedPosition(USER_ID, qid);
      await saveAnswer(USER_ID, qid, i < 15 ? correctPos : wrongDisplayedPosition(correctPos));
    }

    const result = await submitAttempt(USER_ID, round);
    expect(result.score).toBe(15);
    expect(result.qualified).toBe(true);
  });
});

describe("Round 1 duplicate submission protection", () => {
  beforeEach(async () => {
    resetFakeFirestore();
    await createUser(makeUser({ uid: USER_ID }));
    await seedQuestions();
  });

  it("cannot be submitted twice", async () => {
    const round = makeRound();
    await startAttempt(USER_ID, round);
    await submitAttempt(USER_ID, round);

    await expect(submitAttempt(USER_ID, round)).rejects.toMatchObject({
      code: "ALREADY_SUBMITTED",
    });
  });
});

describe("Round 1 timer persistence across refresh", () => {
  beforeEach(async () => {
    resetFakeFirestore();
    await createUser(makeUser({ uid: USER_ID }));
    await seedQuestions();
  });

  it("refreshing (re-fetching the attempt) does not reset expiresAt", async () => {
    const round = makeRound({ durationMinutes: 30 });
    const first = await startAttempt(USER_ID, round);

    // Simulate a page refresh: fetch the attempt again a moment later.
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = await getAttemptView(USER_ID, round);

    expect(second).not.toBeNull();
    expect(second!.expiresAt).toBe(first.expiresAt);
    expect(second!.startTime).toBe(first.startTime);
  });

  it("expired rounds reject new answers, and auto-submit on the next touch", async () => {
    const round = makeRound({ durationMinutes: 30 });
    const view = await startAttempt(USER_ID, round);
    const firstQid = view.questions[0]!.id;
    const correctPos = await correctDisplayedPosition(USER_ID, firstQid);
    await saveAnswer(USER_ID, firstQid, correctPos);

    // Force expiry by rewriting the stored attempt's expiresAt into the past.
    const past = new Date(Date.now() - 1000).toISOString();
    const { updateAttempt, attemptId } = await import("../src/repositories/mcqRepo.js");
    await updateAttempt(attemptId(USER_ID, "round1"), { expiresAt: past });

    await expect(saveAnswer(USER_ID, view.questions[1]!.id, 0)).rejects.toMatchObject({
      code: "ROUND_EXPIRED",
    });

    const resultAfterExpiry = await getResult(USER_ID, round);
    expect(resultAfterExpiry.score).toBe(1);
  });
});

describe("AppError sanity", () => {
  it("carries the error code through", () => {
    const err = new AppError("NOT_QUALIFIED", "nope");
    expect(err.code).toBe("NOT_QUALIFIED");
    expect(err.status).toBe(403);
  });
});
