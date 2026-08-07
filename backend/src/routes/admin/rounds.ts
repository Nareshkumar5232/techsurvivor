import { Router } from "express";
import { roundConfigUpdateSchema } from "@tech-survivor/shared";
import type { RoundConfig } from "@tech-survivor/types";
import { getRound, updateRound } from "../../repositories/eventRepo.js";
import { listAttemptsByRound } from "../../repositories/mcqRepo.js";
import { getUserById } from "../../repositories/userRepo.js";
import { ROUND1_ID, ROUND2_ID } from "../../repositories/collections.js";
import { finalizeAllExpiredAttempts } from "../../services/mcqService.js";
import { logAudit } from "../../services/auditService.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

/** Mounted at /api/admin/rounds - start/pause/resume/end/qualification/config for a round. */
export const roundsRouter = Router();
/** Mounted at /api/admin/round1 - read-only Round 1 results views (different prefix than
 *  roundsRouter by spec, so it lives in its own router even though it's the same file). */
export const round1ResultsRouter = Router();

async function loadRoundOrThrow(roundId: string): Promise<RoundConfig> {
  if (roundId !== ROUND1_ID && roundId !== ROUND2_ID) {
    throw new AppError("VALIDATION_ERROR", `Unknown round id: ${roundId}`);
  }
  const round = await getRound(roundId);
  if (!round) throw new AppError("NOT_FOUND", "Round not found");
  return round;
}

roundsRouter.post(
  "/:roundId/start",
  asyncHandler(async (req, res) => {
    const roundId = req.params.roundId!;
    const round = await loadRoundOrThrow(roundId);

    const patch: Partial<RoundConfig> = { status: "live" };
    if (!round.startTime) {
      // First time this round is started: fix the start/end window now.
      const now = new Date();
      patch.startTime = now.toISOString();
      patch.endTime = new Date(now.getTime() + round.durationMinutes * 60_000).toISOString();
    }
    // Else: resuming from "waiting" after a previous start - keep the existing window.

    await updateRound(roundId, patch);
    await logAudit(req.user!, "round_started", "round", roundId, {
      roundId,
      previousStatus: round.status,
      newStatus: "live",
    });
    sendSuccess(res, await getRound(roundId), "Round started");
  }),
);

roundsRouter.post(
  "/:roundId/pause",
  asyncHandler(async (req, res) => {
    const roundId = req.params.roundId!;
    const round = await loadRoundOrThrow(roundId);
    await updateRound(roundId, { status: "paused" });
    await logAudit(req.user!, "round_paused", "round", roundId, {
      roundId,
      previousStatus: round.status,
      newStatus: "paused",
    });
    sendSuccess(res, await getRound(roundId), "Round paused");
  }),
);

roundsRouter.post(
  "/:roundId/resume",
  asyncHandler(async (req, res) => {
    const roundId = req.params.roundId!;
    const round = await loadRoundOrThrow(roundId);
    // Known simplification: resuming does not extend endTime or individual attempt
    // expiresAt values to account for time spent paused.
    await updateRound(roundId, { status: "live" });
    await logAudit(req.user!, "round_resumed", "round", roundId, {
      roundId,
      previousStatus: round.status,
      newStatus: "live",
    });
    sendSuccess(res, await getRound(roundId), "Round resumed");
  }),
);

roundsRouter.post(
  "/:roundId/end",
  asyncHandler(async (req, res) => {
    const roundId = req.params.roundId!;
    const round = await loadRoundOrThrow(roundId);
    await updateRound(roundId, { status: "completed" });
    await logAudit(req.user!, "round_ended", "round", roundId, {
      roundId,
      previousStatus: round.status,
      newStatus: "completed",
    });
    sendSuccess(res, await getRound(roundId), "Round ended");
  }),
);

roundsRouter.post(
  "/round1/calculate-qualification",
  asyncHandler(async (req, res) => {
    const round1 = await getRound(ROUND1_ID);
    if (!round1) throw new AppError("NOT_FOUND", "Round 1 is not configured");

    // Sweep any attempt that is technically expired but still sitting "in_progress"
    // because the participant never made another request after time ran out.
    await finalizeAllExpiredAttempts(round1);

    const attempts = await listAttemptsByRound(ROUND1_ID);
    let qualified = 0;
    let notQualified = 0;
    let pending = 0;
    for (const attempt of attempts) {
      if (attempt.status === "in_progress") pending += 1;
      else if (attempt.qualified === true) qualified += 1;
      else notQualified += 1;
    }

    await logAudit(req.user!, "round1_qualification_calculated", "round", ROUND1_ID, {
      qualified,
      notQualified,
      pending,
      total: attempts.length,
    });

    sendSuccess(res, { qualified, notQualified, pending, total: attempts.length });
  }),
);

roundsRouter.patch(
  "/:roundId",
  asyncHandler(async (req, res) => {
    const roundId = req.params.roundId!;
    const existing = await loadRoundOrThrow(roundId);
    const input = roundConfigUpdateSchema.parse(req.body);
    const { settings, ...rest } = input;
    await updateRound(roundId, {
      ...rest,
      ...(settings ? { settings: { ...existing.settings, ...settings } } : {}),
    });
    const updated = await getRound(roundId);

    await logAudit(req.user!, "round_config_updated", "round", roundId, {
      before: existing,
      after: updated,
    });

    sendSuccess(res, updated, "Round updated");
  }),
);

interface Round1ResultRow {
  fullName: string;
  institution: string;
  rollNumber: string;
}

async function withParticipantInfo<T extends { userId: string }>(
  rows: T[],
): Promise<(T & Round1ResultRow)[]> {
  return Promise.all(
    rows.map(async (row) => {
      const user = await getUserById(row.userId);
      return {
        ...row,
        fullName: user?.fullName ?? "",
        institution: user?.institution ?? "",
        rollNumber: user?.rollNumber ?? "",
      };
    }),
  );
}

round1ResultsRouter.get(
  "/results",
  asyncHandler(async (_req, res) => {
    const attempts = await listAttemptsByRound(ROUND1_ID);
    sendSuccess(res, await withParticipantInfo(attempts));
  }),
);

round1ResultsRouter.get(
  "/qualified",
  asyncHandler(async (_req, res) => {
    const attempts = await listAttemptsByRound(ROUND1_ID);
    const qualifiedAttempts = attempts.filter((a) => a.qualified === true);
    sendSuccess(res, await withParticipantInfo(qualifiedAttempts));
  }),
);
