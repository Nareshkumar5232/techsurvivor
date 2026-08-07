import { Router } from "express";
import type { Verdict } from "@tech-survivor/types";
import { listSubmissionsForEvent } from "../../repositories/codingRepo.js";
import { DEFAULT_EVENT_ID } from "../../repositories/collections.js";
import { reevaluateSubmission } from "../../services/codingService.js";
import { logAudit } from "../../services/auditService.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const submissionsRouter = Router();

submissionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId, problemId, verdict } = req.query;
    // Admin sees full submission records, including sourceCode - intentional, for
    // integrity review.
    let submissions = await listSubmissionsForEvent(DEFAULT_EVENT_ID);

    if (typeof userId === "string") {
      submissions = submissions.filter((s) => s.userId === userId);
    }
    if (typeof problemId === "string") {
      submissions = submissions.filter((s) => s.problemId === problemId);
    }
    if (typeof verdict === "string") {
      submissions = submissions.filter((s) => s.verdict === (verdict as Verdict));
    }

    sendSuccess(res, submissions);
  }),
);

submissionsRouter.post(
  "/:submissionId/reevaluate",
  asyncHandler(async (req, res) => {
    const submissionId = req.params.submissionId!;
    const result = await reevaluateSubmission(submissionId);
    await logAudit(req.user!, "submission_reevaluated", "submission", submissionId, { result });
    sendSuccess(res, result, "Submission re-evaluated");
  }),
);
