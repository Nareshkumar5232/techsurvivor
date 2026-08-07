import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/config/firebaseAdmin.js", () => import("./support/fakeFirebaseAdmin.js"));

import { resetFakeFirestore, setNextVerifyIdTokenResult } from "./support/fakeFirebaseAdmin.js";
import { makeCodingProblem, makeEvent, makeRound, makeUser } from "./support/fixtures.js";
import { createApp } from "../src/app.js";
import { createProblem } from "../src/repositories/codingRepo.js";
import { createEvent, createRound } from "../src/repositories/eventRepo.js";
import { createAttemptIfNotExists } from "../src/repositories/mcqRepo.js";
import { createUser } from "../src/repositories/userRepo.js";
import { saveSnapshot } from "../src/repositories/leaderboardRepo.js";
import { recordCodingResult } from "../src/services/leaderboardService.js";

const app = createApp();

function asAdmin() {
  setNextVerifyIdTokenResult({ uid: "admin-1", email: "admin@example.com", email_verified: true, role: "admin" });
}

function asParticipant(uid = "user-1") {
  setNextVerifyIdTokenResult({ uid, email: "participant@example.com", email_verified: true, role: "participant" });
}

describe("Admin API is inaccessible to participants", () => {
  beforeEach(() => resetFakeFirestore());

  it("returns 403 UNAUTHORIZED for a participant hitting an admin route", async () => {
    asParticipant();
    const res = await request(app).get("/api/admin/dashboard").set("Authorization", "Bearer token");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 for an admin hitting the same route", async () => {
    asAdmin();
    const res = await request(app).get("/api/admin/dashboard").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 401 with no token at all", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});

describe("Hidden test cases never appear in a Round 2 API response", () => {
  beforeEach(async () => {
    resetFakeFirestore();
    await createUser(makeUser({ uid: "user-1", profileComplete: true }));
    await createRound(makeRound({ id: "round2", type: "coding", status: "live" }));
    await createProblem(makeCodingProblem());
    await createAttemptIfNotExists({
      id: "user-1_round1",
      userId: "user-1",
      eventId: "main",
      roundId: "round1",
      assignedQuestionIds: [],
      optionOrders: {},
      answers: {},
      markedForReview: [],
      startTime: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      score: 18,
      percentage: 90,
      correctCount: 18,
      incorrectCount: 2,
      unansweredCount: 0,
      qualified: true,
      status: "submitted",
      monitoringEvents: [],
    });
  });

  it("GET /api/round2/problems/:problemId omits hiddenTestCases entirely", async () => {
    asParticipant("user-1");
    const res = await request(app)
      .get("/api/round2/problems/problem-easy")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty("hiddenTestCases");
    expect(JSON.stringify(res.body)).not.toContain("hiddenTestCases");
  });

  it("an unqualified participant is blocked from Round 2 entirely (NOT_QUALIFIED)", async () => {
    await createUser(makeUser({ uid: "user-2", profileComplete: true }));
    await createAttemptIfNotExists({
      id: "user-2_round1",
      userId: "user-2",
      eventId: "main",
      roundId: "round1",
      assignedQuestionIds: [],
      optionOrders: {},
      answers: {},
      markedForReview: [],
      startTime: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      score: 8,
      percentage: 40,
      correctCount: 8,
      incorrectCount: 12,
      unansweredCount: 0,
      qualified: false,
      status: "submitted",
      monitoringEvents: [],
    });

    asParticipant("user-2");
    const res = await request(app)
      .get("/api/round2/problems/problem-easy")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("NOT_QUALIFIED");
  });
});

describe("Frozen leaderboard shows the published snapshot, not live results", () => {
  beforeEach(async () => {
    resetFakeFirestore();
  });

  it("does not expose newer live scores once frozen", async () => {
    await createEvent(makeEvent({ leaderboardVisibility: "visible" }));
    const user = makeUser({ uid: "user-1", fullName: "Alice" });
    await createUser(user);

    await recordCodingResult(user, "easy", 50, "wrong_answer", new Date().toISOString());
    // Freeze the leaderboard at this point (score=50).
    const { getLiveLeaderboard } = await import("../src/services/leaderboardService.js");
    const snapshotAtFreeze = await getLiveLeaderboard();
    await saveSnapshot(snapshotAtFreeze);
    await createEvent(makeEvent({ leaderboardVisibility: "frozen" }));

    // A new, higher score comes in AFTER the freeze.
    await recordCodingResult(user, "easy", 100, "accepted", new Date().toISOString());

    const res = await request(app).get("/api/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body.data.isFrozen).toBe(true);
    const entry = res.body.data.entries.find((e: { userId: string }) => e.userId === "user-1");
    expect(entry.easyScore).toBe(50); // the snapshot, not the live 100
  });
});
