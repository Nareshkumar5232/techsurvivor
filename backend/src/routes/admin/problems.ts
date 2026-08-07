import { randomUUID } from "node:crypto";
import { Router } from "express";
import { codingProblemAdminSchema, codingProblemAdminUpdateSchema, slugify } from "@tech-survivor/shared";
import type { TestCaseInput } from "@tech-survivor/shared";
import type { CodingProblem, CodingProblemPublic } from "@tech-survivor/types";
import {
  createProblem,
  deleteProblem,
  getProblem,
  listProblems,
  updateProblem,
} from "../../repositories/codingRepo.js";
import { DEFAULT_EVENT_ID } from "../../repositories/collections.js";
import { logAudit } from "../../services/auditService.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const problemsRouter = Router();

/** Assigns a fresh id to any sample/hidden test case that doesn't already have one. */
function withTestCaseIds(cases: TestCaseInput[]): CodingProblem["samples"] {
  return cases.map((c) => ({
    id: c.id ?? randomUUID(),
    input: c.input,
    expectedOutput: c.expectedOutput,
    explanation: c.explanation,
  }));
}

/** Slugifies `base` and appends -2, -3, ... until the result isn't already used by another
 *  problem. `excludeId` lets a problem's own (unchanged) slug not count against itself. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const existing = await listProblems({});
  const taken = new Set(existing.filter((p) => p.id !== excludeId).map((p) => p.slug));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function toPublicProblem(problem: CodingProblem): CodingProblemPublic {
  return {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    description: problem.description,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints,
    samples: problem.samples,
    starterCode: problem.starterCode,
    supportedLanguages: problem.supportedLanguages,
    points: problem.points,
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
  };
}

problemsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, await listProblems({}));
  }),
);

// Admin JSON export intentionally includes hidden test cases - it exists for a re-import
// round trip into another event, and only admins can reach this router at all.
problemsRouter.get(
  "/export",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, await listProblems({}));
  }),
);

problemsRouter.post(
  "/import",
  asyncHandler(async (req, res) => {
    const body = req.body as { problems?: unknown[] };
    const items = Array.isArray(body.problems) ? body.problems : [];
    let created = 0;
    const errors: { index: number; error: string }[] = [];

    for (let index = 0; index < items.length; index++) {
      const result = codingProblemAdminSchema.safeParse(items[index]);
      if (!result.success) {
        errors.push({ index, error: result.error.issues.map((issue) => issue.message).join("; ") });
        continue;
      }
      const now = new Date().toISOString();
      const slug = await uniqueSlug(slugify(result.data.title));
      const problem: CodingProblem = {
        ...result.data,
        id: randomUUID(),
        eventId: DEFAULT_EVENT_ID,
        slug,
        samples: withTestCaseIds(result.data.samples),
        hiddenTestCases: withTestCaseIds(result.data.hiddenTestCases),
        createdAt: now,
        updatedAt: now,
      };
      await createProblem(problem);
      created += 1;
    }

    await logAudit(req.user!, "coding_problems_imported", "codingProblem", null, {
      created,
      errorCount: errors.length,
    });

    sendSuccess(res, { created, errors });
  }),
);

problemsRouter.get(
  "/:problemId/preview",
  asyncHandler(async (req, res) => {
    const problem = await getProblem(req.params.problemId!);
    if (!problem) throw new AppError("NOT_FOUND", "Problem not found");
    sendSuccess(res, toPublicProblem(problem));
  }),
);

problemsRouter.post(
  "/:problemId/duplicate",
  asyncHandler(async (req, res) => {
    const problemId = req.params.problemId!;
    const original = await getProblem(problemId);
    if (!original) throw new AppError("NOT_FOUND", "Problem not found");

    const now = new Date().toISOString();
    const slug = await uniqueSlug(slugify(`${original.title} (Copy)`));
    const copy: CodingProblem = {
      ...original,
      id: randomUUID(),
      slug,
      active: false,
      createdAt: now,
      updatedAt: now,
    };
    await createProblem(copy);
    await logAudit(req.user!, "coding_problem_duplicated", "codingProblem", copy.id, {
      sourceProblemId: problemId,
    });
    sendSuccess(res, copy, "Problem duplicated", 201);
  }),
);

problemsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = codingProblemAdminSchema.parse(req.body);
    const now = new Date().toISOString();
    const slug = await uniqueSlug(slugify(input.title));
    const problem: CodingProblem = {
      ...input,
      id: randomUUID(),
      eventId: DEFAULT_EVENT_ID,
      slug,
      samples: withTestCaseIds(input.samples),
      hiddenTestCases: withTestCaseIds(input.hiddenTestCases),
      createdAt: now,
      updatedAt: now,
    };
    await createProblem(problem);
    await logAudit(req.user!, "coding_problem_created", "codingProblem", problem.id, { problem });
    sendSuccess(res, problem, "Problem created", 201);
  }),
);

problemsRouter.patch(
  "/:problemId",
  asyncHandler(async (req, res) => {
    const problemId = req.params.problemId!;
    const existing = await getProblem(problemId);
    if (!existing) throw new AppError("NOT_FOUND", "Problem not found");

    const input = codingProblemAdminUpdateSchema.parse(req.body);
    // Slug is never touched here by design - codingProblemAdminUpdateSchema has no slug
    // field, and title changes must not silently change a problem's public URL.
    const { samples, hiddenTestCases, ...rest } = input;
    const patch: Partial<CodingProblem> = { ...rest };
    if (samples) patch.samples = withTestCaseIds(samples);
    if (hiddenTestCases) patch.hiddenTestCases = withTestCaseIds(hiddenTestCases);

    await updateProblem(problemId, patch);
    const updated = await getProblem(problemId);

    await logAudit(req.user!, "coding_problem_updated", "codingProblem", problemId, {
      before: existing,
      after: updated,
    });
    sendSuccess(res, updated, "Problem updated");
  }),
);

problemsRouter.delete(
  "/:problemId",
  asyncHandler(async (req, res) => {
    const problemId = req.params.problemId!;
    const existing = await getProblem(problemId);
    if (!existing) throw new AppError("NOT_FOUND", "Problem not found");

    await deleteProblem(problemId);
    await logAudit(req.user!, "coding_problem_deleted", "codingProblem", problemId, { problem: existing });
    sendSuccess(res, null, "Problem deleted");
  }),
);
