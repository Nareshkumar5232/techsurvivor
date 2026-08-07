import { Router } from "express";
import { leaderboardVisibilitySchema } from "@tech-survivor/shared";
import { updateEvent } from "../../repositories/eventRepo.js";
import { DEFAULT_EVENT_ID } from "../../repositories/collections.js";
import { getLiveLeaderboard, publishSnapshot } from "../../services/leaderboardService.js";
import { logAudit } from "../../services/auditService.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const leaderboardRouter = Router();

leaderboardRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    // Admin always sees the live, unfiltered leaderboard regardless of visibility settings
    // or disqualification.
    sendSuccess(res, await getLiveLeaderboard({ excludeDisqualified: false }));
  }),
);

leaderboardRouter.patch(
  "/visibility",
  asyncHandler(async (req, res) => {
    const input = leaderboardVisibilitySchema.parse(req.body);
    await updateEvent({ leaderboardVisibility: input.visibility });

    if (input.visibility === "frozen" || input.visibility === "published") {
      // Freeze/publish a fresh snapshot immediately so what participants see at the moment
      // of transition matches the live leaderboard at that instant.
      await publishSnapshot();
    }

    await logAudit(req.user!, "leaderboard_visibility_changed", "event", DEFAULT_EVENT_ID, {
      visibility: input.visibility,
    });

    sendSuccess(res, { visibility: input.visibility }, "Leaderboard visibility updated");
  }),
);
