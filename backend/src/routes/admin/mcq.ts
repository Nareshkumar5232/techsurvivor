import { randomUUID } from "node:crypto";
import { Router } from "express";
import { mcqQuestionAdminSchema, mcqQuestionAdminUpdateSchema } from "@tech-survivor/shared";
import type { MCQQuestion } from "@tech-survivor/types";
import {
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
} from "../../repositories/mcqRepo.js";
import { DEFAULT_EVENT_ID } from "../../repositories/collections.js";
import { logAudit } from "../../services/auditService.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const mcqRouter = Router();

mcqRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, await listQuestions({}));
  }),
);

// Admin JSON export intentionally includes correctOptionIndex - it exists to be re-imported
// into another event, and only admins can reach this router at all.
mcqRouter.get(
  "/export",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, await listQuestions({}));
  }),
);

mcqRouter.post(
  "/import",
  asyncHandler(async (req, res) => {
    const body = req.body as { questions?: unknown[] };
    const questions = Array.isArray(body.questions) ? body.questions : [];
    let created = 0;
    const errors: { index: number; error: string }[] = [];

    for (let index = 0; index < questions.length; index++) {
      const result = mcqQuestionAdminSchema.safeParse(questions[index]);
      if (!result.success) {
        errors.push({ index, error: result.error.issues.map((issue) => issue.message).join("; ") });
        continue;
      }
      const now = new Date().toISOString();
      const question: MCQQuestion = {
        ...result.data,
        id: randomUUID(),
        eventId: DEFAULT_EVENT_ID,
        createdAt: now,
        updatedAt: now,
      };
      await createQuestion(question);
      created += 1;
    }

    await logAudit(req.user!, "mcq_questions_imported", "mcqQuestion", null, {
      created,
      errorCount: errors.length,
    });

    sendSuccess(res, { created, errors });
  }),
);

mcqRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = mcqQuestionAdminSchema.parse(req.body);
    const now = new Date().toISOString();
    const question: MCQQuestion = {
      ...input,
      id: randomUUID(),
      eventId: DEFAULT_EVENT_ID,
      createdAt: now,
      updatedAt: now,
    };
    await createQuestion(question);
    await logAudit(req.user!, "mcq_question_created", "mcqQuestion", question.id, { question });
    sendSuccess(res, question, "Question created", 201);
  }),
);

mcqRouter.patch(
  "/:questionId",
  asyncHandler(async (req, res) => {
    const questionId = req.params.questionId!;
    const existing = await getQuestion(questionId);
    if (!existing) throw new AppError("NOT_FOUND", "Question not found");

    const input = mcqQuestionAdminUpdateSchema.parse(req.body);
    await updateQuestion(questionId, input);
    const updated = await getQuestion(questionId);

    await logAudit(req.user!, "mcq_question_updated", "mcqQuestion", questionId, {
      before: existing,
      after: updated,
    });
    sendSuccess(res, updated, "Question updated");
  }),
);

mcqRouter.delete(
  "/:questionId",
  asyncHandler(async (req, res) => {
    const questionId = req.params.questionId!;
    const existing = await getQuestion(questionId);
    if (!existing) throw new AppError("NOT_FOUND", "Question not found");

    await deleteQuestion(questionId);
    await logAudit(req.user!, "mcq_question_deleted", "mcqQuestion", questionId, { question: existing });
    sendSuccess(res, null, "Question deleted");
  }),
);
