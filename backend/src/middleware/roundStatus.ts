import type { NextFunction, Request, Response } from "express";
import { getRound } from "../repositories/eventRepo.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/response.js";

/** Loads the round and rejects the request unless it is currently live and within its
 *  configured time window. Attaches the round to req.round for downstream handlers. */
export function requireRoundLive(roundId: string) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const round = await getRound(roundId);
    if (!round) throw new AppError("NOT_FOUND", "Round is not configured");

    if (round.status === "waiting") {
      throw new AppError("ROUND_NOT_STARTED", `${round.name} has not started yet`);
    }
    if (round.status === "paused") {
      throw new AppError("ROUND_PAUSED", `${round.name} is currently paused`);
    }
    if (round.status === "completed" || round.status === "locked") {
      throw new AppError("ROUND_CLOSED", `${round.name} is closed`);
    }

    if (round.endTime && new Date() > new Date(round.endTime)) {
      throw new AppError("ROUND_EXPIRED", `${round.name} has ended`);
    }

    req.round = round;
    next();
  });
}

/** Looser variant for read-only endpoints that should work even when a round is paused
 *  or completed (e.g. viewing a past result), but not before it starts or once locked. */
export function requireRoundStarted(roundId: string) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const round = await getRound(roundId);
    if (!round) throw new AppError("NOT_FOUND", "Round is not configured");
    if (round.status === "waiting") {
      throw new AppError("ROUND_NOT_STARTED", `${round.name} has not started yet`);
    }
    if (round.status === "locked") {
      throw new AppError("ROUND_CLOSED", `${round.name} is closed`);
    }
    req.round = round;
    next();
  });
}
