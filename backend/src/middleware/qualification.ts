import type { NextFunction, Request, Response } from "express";
import { getAttempt } from "../repositories/mcqRepo.js";
import { ROUND1_ID } from "../repositories/collections.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../lib/response.js";

/** Round 2 gate: only a participant whose Round 1 attempt is marked qualified may pass. */
export const requireQualified = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) throw new AppError("UNAUTHENTICATED", "Authentication required");
  const attempt = await getAttempt(req.user.uid, ROUND1_ID);
  if (!attempt || attempt.qualified !== true) {
    throw new AppError("NOT_QUALIFIED", "You did not qualify for Round 2");
  }
  next();
});
