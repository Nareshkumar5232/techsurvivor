import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

vi.mock("../src/config/firebaseAdmin.js", () => import("./support/fakeFirebaseAdmin.js"));

import { resetFakeFirestore, setNextVerifyIdTokenResult } from "./support/fakeFirebaseAdmin.js";
import { makeRound, makeUser } from "./support/fixtures.js";
import { authenticate } from "../src/middleware/auth.js";
import { requireAdmin, requireParticipant } from "../src/middleware/role.js";
import { requireRoundLive } from "../src/middleware/roundStatus.js";
import { requireQualified } from "../src/middleware/qualification.js";
import { createRound } from "../src/repositories/eventRepo.js";
import { createAttemptIfNotExists } from "../src/repositories/mcqRepo.js";
import { createUser } from "../src/repositories/userRepo.js";

function fakeReqRes(headers: Record<string, string> = {}) {
  const req = { headers, user: undefined } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn();
  return { req, res, next };
}

/** `authenticate`/`requireRoundLive`/`requireQualified` are wrapped in `asyncHandler`, which
 *  is deliberately fire-and-forget (Express middleware signatures can't return a promise for
 *  the framework to await) - it calls `fn(...).catch(next)` without returning that promise.
 *  So calling one of these directly and `await`-ing the call does NOT wait for the real work;
 *  we have to run the middleware, then flush the microtask/macrotask queue, then inspect what
 *  it did to `next`/`req` - exactly what Express itself effectively does across an event loop
 *  tick. `next` receives an error as its first argument on failure, or is called with no
 *  arguments at all on success. */
async function runAsyncMiddleware(
  mw: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
  res: Response,
  next: ReturnType<typeof vi.fn>,
): Promise<void> {
  mw(req, res, next as unknown as NextFunction);
  await new Promise((resolve) => setImmediate(resolve));
}

describe("authenticate middleware", () => {
  beforeEach(() => resetFakeFirestore());

  it("rejects a request with no Authorization header", async () => {
    const { req, res, next } = fakeReqRes();
    await runAsyncMiddleware(authenticate, req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]![0]).toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("rejects an invalid token", async () => {
    setNextVerifyIdTokenResult(new Error("bad token"));
    const { req, res, next } = fakeReqRes({ authorization: "Bearer garbage" });
    await runAsyncMiddleware(authenticate, req, res, next);
    expect(next.mock.calls[0]![0]).toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("attaches req.user with the server-issued role claim, never a client-supplied one", async () => {
    setNextVerifyIdTokenResult({ uid: "u1", email: "a@b.com", email_verified: true, role: "admin" });
    const { req, res, next } = fakeReqRes({ authorization: "Bearer good" });
    await runAsyncMiddleware(authenticate, req, res, next);
    expect(req.user).toEqual({ uid: "u1", email: "a@b.com", emailVerified: true, role: "admin" });
    expect(next.mock.calls[0]![0]).toBeUndefined();
  });

  it("defaults to participant when no role claim is present", async () => {
    setNextVerifyIdTokenResult({ uid: "u2", email: "c@d.com", email_verified: false });
    const { req, res, next } = fakeReqRes({ authorization: "Bearer good" });
    await runAsyncMiddleware(authenticate, req, res, next);
    expect(req.user?.role).toBe("participant");
  });
});

describe("role middleware - participants cannot reach admin-only handlers", () => {
  it("requireAdmin rejects a participant", () => {
    const { req, res, next } = fakeReqRes();
    req.user = { uid: "u1", email: "a@b.com", emailVerified: true, role: "participant" };
    expect(() => requireAdmin(req, res, next as unknown as NextFunction)).toThrow(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("requireAdmin allows an admin", () => {
    const { req, res, next } = fakeReqRes();
    req.user = { uid: "u1", email: "a@b.com", emailVerified: true, role: "admin" };
    requireAdmin(req, res, next as unknown as NextFunction);
    expect(next).toHaveBeenCalledOnce();
  });

  it("requireParticipant rejects an admin", () => {
    const { req, res, next } = fakeReqRes();
    req.user = { uid: "u1", email: "a@b.com", emailVerified: true, role: "admin" };
    expect(() => requireParticipant(req, res, next as unknown as NextFunction)).toThrow(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
  });
});

describe("requireRoundLive", () => {
  beforeEach(() => resetFakeFirestore());

  it("rejects when the round hasn't started", async () => {
    await createRound(makeRound({ id: "round1", status: "waiting" }));
    const { req, res, next } = fakeReqRes();
    await runAsyncMiddleware(requireRoundLive("round1"), req, res, next);
    expect(next.mock.calls[0]![0]).toMatchObject({ code: "ROUND_NOT_STARTED" });
  });

  it("rejects when the round is paused", async () => {
    await createRound(makeRound({ id: "round1", status: "paused" }));
    const { req, res, next } = fakeReqRes();
    await runAsyncMiddleware(requireRoundLive("round1"), req, res, next);
    expect(next.mock.calls[0]![0]).toMatchObject({ code: "ROUND_PAUSED" });
  });

  it("rejects when the round is completed", async () => {
    await createRound(makeRound({ id: "round1", status: "completed" }));
    const { req, res, next } = fakeReqRes();
    await runAsyncMiddleware(requireRoundLive("round1"), req, res, next);
    expect(next.mock.calls[0]![0]).toMatchObject({ code: "ROUND_CLOSED" });
  });

  it("rejects once the round's end time has passed, even if status is still live", async () => {
    await createRound(
      makeRound({ id: "round1", status: "live", endTime: new Date(Date.now() - 1000).toISOString() }),
    );
    const { req, res, next } = fakeReqRes();
    await runAsyncMiddleware(requireRoundLive("round1"), req, res, next);
    expect(next.mock.calls[0]![0]).toMatchObject({ code: "ROUND_EXPIRED" });
  });

  it("allows the request through and attaches req.round when live and within the window", async () => {
    await createRound(
      makeRound({ id: "round1", status: "live", endTime: new Date(Date.now() + 60_000).toISOString() }),
    );
    const { req, res, next } = fakeReqRes();
    await runAsyncMiddleware(requireRoundLive("round1"), req, res, next);
    expect(next.mock.calls[0]![0]).toBeUndefined();
    expect(req.round?.id).toBe("round1");
  });
});

describe("requireQualified - Round 2 access control", () => {
  beforeEach(async () => {
    resetFakeFirestore();
    await createUser(makeUser({ uid: "u1" }));
  });

  it("blocks a participant with no Round 1 attempt at all", async () => {
    const { req, res, next } = fakeReqRes();
    req.user = { uid: "u1", email: "a@b.com", emailVerified: true, role: "participant" };
    await runAsyncMiddleware(requireQualified, req, res, next);
    expect(next.mock.calls[0]![0]).toMatchObject({ code: "NOT_QUALIFIED" });
  });

  it("blocks a participant whose attempt exists but did not qualify", async () => {
    await createAttemptIfNotExists({
      id: "u1_round1",
      userId: "u1",
      eventId: "main",
      roundId: "round1",
      assignedQuestionIds: [],
      optionOrders: {},
      answers: {},
      markedForReview: [],
      startTime: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      score: 10,
      percentage: 50,
      correctCount: 10,
      incorrectCount: 10,
      unansweredCount: 0,
      qualified: false,
      status: "submitted",
      monitoringEvents: [],
    });
    const { req, res, next } = fakeReqRes();
    req.user = { uid: "u1", email: "a@b.com", emailVerified: true, role: "participant" };
    await runAsyncMiddleware(requireQualified, req, res, next);
    expect(next.mock.calls[0]![0]).toMatchObject({ code: "NOT_QUALIFIED" });
  });

  it("allows a qualified participant through", async () => {
    await createAttemptIfNotExists({
      id: "u1_round1",
      userId: "u1",
      eventId: "main",
      roundId: "round1",
      assignedQuestionIds: [],
      optionOrders: {},
      answers: {},
      markedForReview: [],
      startTime: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      score: 16,
      percentage: 80,
      correctCount: 16,
      incorrectCount: 4,
      unansweredCount: 0,
      qualified: true,
      status: "submitted",
      monitoringEvents: [],
    });
    const { req, res, next } = fakeReqRes();
    req.user = { uid: "u1", email: "a@b.com", emailVerified: true, role: "participant" };
    await runAsyncMiddleware(requireQualified, req, res, next);
    expect(next.mock.calls[0]![0]).toBeUndefined();
  });
});
