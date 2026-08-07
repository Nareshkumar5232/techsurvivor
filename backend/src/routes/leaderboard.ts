import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getEntryForUser, getPublicLeaderboard } from "../services/leaderboardService.js";
import { asyncHandler, sendSuccess } from "../lib/response.js";

export const leaderboardRouter = Router();

leaderboardRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { entries, isFrozen } = await getPublicLeaderboard();
    sendSuccess(res, { entries, isFrozen });
  }),
);

leaderboardRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    sendSuccess(res, await getEntryForUser(req.user!.uid));
  }),
);
