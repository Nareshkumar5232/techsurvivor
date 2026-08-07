import { Router } from "express";
import { languageSchema, saveCodeRequestSchema } from "@tech-survivor/shared";
import { authenticate } from "../middleware/auth.js";
import { loadProfile, requireProfileComplete } from "../middleware/profile.js";
import { requireQualified } from "../middleware/qualification.js";
import { requireRoundStarted } from "../middleware/roundStatus.js";
import { ROUND2_ID } from "../repositories/collections.js";
import { getPublicProblem, getSavedCode, listPublicProblems, saveCode } from "../services/codingService.js";
import { logAudit } from "../services/auditService.js";
import { asyncHandler, sendSuccess } from "../lib/response.js";

export const round2Router = Router();

round2Router.use(authenticate, loadProfile, requireProfileComplete, requireQualified);

round2Router.get(
  "/problems",
  requireRoundStarted(ROUND2_ID),
  asyncHandler(async (_req, res) => {
    sendSuccess(res, await listPublicProblems());
  }),
);

round2Router.get(
  "/problems/:problemId",
  requireRoundStarted(ROUND2_ID),
  asyncHandler(async (req, res) => {
    sendSuccess(res, await getPublicProblem(req.params.problemId!));
  }),
);

round2Router.get(
  "/code/:problemId",
  requireRoundStarted(ROUND2_ID),
  asyncHandler(async (req, res) => {
    const language = languageSchema.parse(req.query.language ?? "cpp");
    const code = await getSavedCode(req.user!.uid, req.params.problemId!, language);
    sendSuccess(res, { language, sourceCode: code });
  }),
);

round2Router.put(
  "/code/:problemId",
  requireRoundStarted(ROUND2_ID),
  asyncHandler(async (req, res) => {
    const input = saveCodeRequestSchema.parse(req.body);
    await saveCode(req.user!.uid, req.params.problemId!, input.language, input.sourceCode);
    sendSuccess(res, null, "Code saved");
  }),
);

round2Router.post(
  "/finish",
  requireRoundStarted(ROUND2_ID),
  asyncHandler(async (req, res) => {
    await logAudit(req.user!, "round2_finished", "user", req.user!.uid);
    sendSuccess(res, null, "Round 2 marked as finished");
  }),
);
