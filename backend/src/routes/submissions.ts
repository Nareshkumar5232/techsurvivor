import { Router } from "express";
import { runCodeRequestSchema, submitCodeRequestSchema } from "@tech-survivor/shared";
import { authenticate } from "../middleware/auth.js";
import { loadProfile, requireProfileComplete } from "../middleware/profile.js";
import { requireQualified } from "../middleware/qualification.js";
import { requireRoundLive } from "../middleware/roundStatus.js";
import { runRateLimiter, submitRateLimiter } from "../middleware/rateLimit.js";
import { ROUND2_ID } from "../repositories/collections.js";
import { getSubmission as repoGetSubmission } from "../repositories/codingRepo.js";
import { getSubmissionHistory, runCode, submitCode } from "../services/codingService.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler, sendSuccess } from "../lib/response.js";

export const submissionsRouter = Router();

submissionsRouter.use(authenticate, loadProfile, requireProfileComplete, requireQualified);

submissionsRouter.post(
  "/run",
  runRateLimiter,
  requireRoundLive(ROUND2_ID),
  asyncHandler(async (req, res) => {
    const input = runCodeRequestSchema.parse(req.body);
    const result = await runCode(input.problemId, input.language, input.sourceCode, input.customInput);
    sendSuccess(res, result);
  }),
);

submissionsRouter.post(
  "/",
  submitRateLimiter,
  requireRoundLive(ROUND2_ID),
  asyncHandler(async (req, res) => {
    const input = submitCodeRequestSchema.parse(req.body);
    const result = await submitCode(req.profile!, input.problemId, input.language, input.sourceCode);
    sendSuccess(res, result, "Submission evaluated", 201);
  }),
);

submissionsRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const problemId = typeof req.query.problemId === "string" ? req.query.problemId : undefined;
    sendSuccess(res, await getSubmissionHistory(req.user!.uid, problemId));
  }),
);

submissionsRouter.get(
  "/:submissionId",
  asyncHandler(async (req, res) => {
    const submission = await repoGetSubmission(req.params.submissionId!);
    if (!submission || (submission.userId !== req.user!.uid && req.user!.role !== "admin")) {
      throw new AppError("NOT_FOUND", "Submission not found");
    }
    sendSuccess(res, {
      id: submission.id,
      problemId: submission.problemId,
      language: submission.language,
      kind: submission.kind,
      status: submission.status,
      verdict: submission.verdict,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      score: submission.score,
      runtime: submission.runtime,
      memory: submission.memory,
      compilerOutput: submission.compilerOutput,
      submittedAt: submission.submittedAt,
      completedAt: submission.completedAt,
    });
  }),
);
