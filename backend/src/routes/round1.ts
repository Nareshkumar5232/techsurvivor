import { Router } from "express";
import { mcqAnswerSchema, mcqMarkReviewSchema, monitoringEventSchema } from "@tech-survivor/shared";
import { authenticate } from "../middleware/auth.js";
import { loadProfile, requireProfileComplete } from "../middleware/profile.js";
import { requireRoundLive, requireRoundStarted } from "../middleware/roundStatus.js";
import { ROUND1_ID } from "../repositories/collections.js";
import {
  getAttemptView,
  getResult,
  recordMonitoringEvent,
  saveAnswer,
  setMarkedForReview,
  startAttempt,
  submitAttempt,
} from "../services/mcqService.js";
import { asyncHandler, sendSuccess } from "../lib/response.js";

export const round1Router = Router();

round1Router.post(
  "/start",
  authenticate,
  loadProfile,
  requireProfileComplete,
  requireRoundLive(ROUND1_ID),
  asyncHandler(async (req, res) => {
    const view = await startAttempt(req.user!.uid, req.round!);
    sendSuccess(res, view);
  }),
);

round1Router.get(
  "/attempt",
  authenticate,
  loadProfile,
  requireRoundStarted(ROUND1_ID),
  asyncHandler(async (req, res) => {
    const view = await getAttemptView(req.user!.uid, req.round!);
    sendSuccess(res, view);
  }),
);

round1Router.put(
  "/answer",
  authenticate,
  loadProfile,
  requireRoundLive(ROUND1_ID),
  asyncHandler(async (req, res) => {
    const input = mcqAnswerSchema.parse(req.body);
    await saveAnswer(req.user!.uid, input.questionId, input.optionIndex);
    sendSuccess(res, null, "Answer saved");
  }),
);

round1Router.put(
  "/mark-review",
  authenticate,
  loadProfile,
  requireRoundLive(ROUND1_ID),
  asyncHandler(async (req, res) => {
    const input = mcqMarkReviewSchema.parse(req.body);
    await setMarkedForReview(req.user!.uid, input.questionId, input.marked);
    sendSuccess(res, null, "Updated");
  }),
);

round1Router.post(
  "/monitoring-event",
  authenticate,
  loadProfile,
  asyncHandler(async (req, res) => {
    const input = monitoringEventSchema.parse(req.body);
    await recordMonitoringEvent(req.user!.uid, input.type);
    sendSuccess(res, null);
  }),
);

round1Router.post(
  "/submit",
  authenticate,
  loadProfile,
  requireRoundStarted(ROUND1_ID),
  asyncHandler(async (req, res) => {
    const result = await submitAttempt(req.user!.uid, req.round!);
    sendSuccess(res, result, "Round 1 submitted");
  }),
);

round1Router.get(
  "/result",
  authenticate,
  loadProfile,
  requireRoundStarted(ROUND1_ID),
  asyncHandler(async (req, res) => {
    const result = await getResult(req.user!.uid, req.round!);
    sendSuccess(res, result);
  }),
);
