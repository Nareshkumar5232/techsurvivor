import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";
import { dashboardRouter } from "./dashboard.js";
import { participantsRouter } from "./participants.js";
import { mcqRouter } from "./mcq.js";
import { problemsRouter } from "./problems.js";
import { round1ResultsRouter, roundsRouter } from "./rounds.js";
import { submissionsRouter } from "./submissions.js";
import { leaderboardRouter } from "./leaderboard.js";
import { eventRouter } from "./event.js";
import { announcementsRouter } from "./announcements.js";
import { auditLogsRouter } from "./auditLogs.js";
import { exportRouter } from "./export.js";

export const adminRouter = Router();

// Admin accounts don't go through loadProfile/requireProfileComplete - those are
// participant-only concerns. Every admin route only needs a verified admin auth token.
adminRouter.use(authenticate, requireRole("admin"));

adminRouter.use(dashboardRouter);
adminRouter.use("/participants", participantsRouter);
adminRouter.use("/mcq", mcqRouter);
adminRouter.use("/problems", problemsRouter);
adminRouter.use("/rounds", roundsRouter);
adminRouter.use("/round1", round1ResultsRouter);
adminRouter.use("/submissions", submissionsRouter);
adminRouter.use("/leaderboard", leaderboardRouter);
adminRouter.use("/event", eventRouter);
adminRouter.use("/announcements", announcementsRouter);
adminRouter.use("/audit-logs", auditLogsRouter);
adminRouter.use("/results", exportRouter);
