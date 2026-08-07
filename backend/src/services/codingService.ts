import { randomUUID } from "node:crypto";
import { calculateCodingScore, compareOutput } from "@tech-survivor/shared";
import type {
  CodingProblem,
  CodingProblemPublic,
  RunResult,
  SavedCode,
  SubmissionSummary,
  SupportedLanguage,
  UserProfile,
  Verdict,
} from "@tech-survivor/types";
import { loadEnv } from "../config/env.js";
import { getCompilerProvider } from "../compiler/index.js";
import { mapWithConcurrency } from "../lib/concurrency.js";
import { AppError } from "../lib/errors.js";
import {
  createSubmission,
  getProblem,
  getSavedCode as repoGetSavedCode,
  getSubmission,
  listProblems,
  listSubmissionsForUser,
  updateSubmission,
  upsertSavedCode,
} from "../repositories/codingRepo.js";
import { DEFAULT_EVENT_ID } from "../repositories/collections.js";
import { getUserById } from "../repositories/userRepo.js";
import { recordCodingResult } from "./leaderboardService.js";

const HIDDEN_TEST_CONCURRENCY = 4;

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

const DIFFICULTY_ORDER: Record<CodingProblem["difficulty"], number> = { easy: 0, medium: 1, hard: 2 };

export async function listPublicProblems(): Promise<CodingProblemPublic[]> {
  const problems = await listProblems({ active: true });
  return problems
    .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty])
    .map(toPublicProblem);
}

async function getActiveProblemOrThrow(problemId: string): Promise<CodingProblem> {
  const problem = await getProblem(problemId);
  if (!problem || !problem.active) throw new AppError("NOT_FOUND", "Problem not found");
  return problem;
}

export async function getPublicProblem(problemId: string): Promise<CodingProblemPublic> {
  return toPublicProblem(await getActiveProblemOrThrow(problemId));
}

export async function getSavedCode(
  userId: string,
  problemId: string,
  language: SupportedLanguage,
): Promise<string> {
  const saved = await repoGetSavedCode(userId, problemId, language);
  if (saved) return saved.sourceCode;
  const problem = await getActiveProblemOrThrow(problemId);
  return problem.starterCode[language] ?? "";
}

export async function saveCode(
  userId: string,
  problemId: string,
  language: SupportedLanguage,
  sourceCode: string,
): Promise<void> {
  const saved: SavedCode = {
    userId,
    eventId: DEFAULT_EVENT_ID,
    problemId,
    language,
    sourceCode,
    updatedAt: new Date().toISOString(),
  };
  await upsertSavedCode(saved);
}

function assertLanguageSupported(problem: CodingProblem, language: SupportedLanguage): void {
  if (!problem.supportedLanguages.includes(language)) {
    throw new AppError("INVALID_LANGUAGE", `${language} is not enabled for this problem`);
  }
}

function assertCodeSize(sourceCode: string): void {
  const env = loadEnv();
  const bytes = Buffer.byteLength(sourceCode, "utf8");
  if (bytes > env.MAX_CODE_SIZE_BYTES) {
    throw new AppError("CODE_TOO_LARGE", `Source code exceeds the ${env.MAX_CODE_SIZE_BYTES} byte limit`);
  }
}

export async function runCode(
  problemId: string,
  language: SupportedLanguage,
  sourceCode: string,
  customInput?: string,
): Promise<RunResult> {
  const problem = await getActiveProblemOrThrow(problemId);
  assertLanguageSupported(problem, language);
  assertCodeSize(sourceCode);

  const compiler = getCompilerProvider();
  const env = loadEnv();

  if (customInput !== undefined) {
    const result = await compiler.execute({
      language,
      sourceCode,
      stdin: customInput,
      timeLimitSeconds: problem.timeLimit,
      memoryLimitMb: problem.memoryLimit,
    });
    return {
      status: result.status === "failed" ? "failed" : "completed",
      verdict: result.verdict,
      stdout: truncate(result.stdout, env.MAX_OUTPUT_SIZE_BYTES),
      stderr: result.stderr,
      compilerOutput: result.compileOutput,
      runtime: result.timeSeconds,
      memory: result.memoryKb,
    };
  }

  const sampleResults = await mapWithConcurrency(problem.samples, HIDDEN_TEST_CONCURRENCY, async (sample) => {
    const result = await compiler.execute({
      language,
      sourceCode,
      stdin: sample.input,
      timeLimitSeconds: problem.timeLimit,
      memoryLimitMb: problem.memoryLimit,
    });
    const actualOutput = truncate(result.stdout ?? "", env.MAX_OUTPUT_SIZE_BYTES);
    const passed =
      result.verdict === "accepted" &&
      compareOutput(actualOutput, sample.expectedOutput, problem.comparisonMode, problem.floatTolerance);
    return {
      testCaseId: sample.id,
      passed,
      actualOutput,
      expectedOutput: sample.expectedOutput,
      verdict: result.verdict,
      stderr: result.stderr,
      compileOutput: result.compileOutput,
      runtime: result.timeSeconds,
      memory: result.memoryKb,
    };
  });

  const firstFailure = sampleResults.find((r) => r.verdict !== "accepted");
  const overallVerdict: Verdict = firstFailure
    ? firstFailure.verdict
    : sampleResults.every((r) => r.passed)
      ? "accepted"
      : "wrong_answer";

  return {
    status: "completed",
    verdict: overallVerdict,
    stdout: sampleResults[0]?.actualOutput ?? null,
    stderr: sampleResults.find((r) => r.stderr)?.stderr ?? null,
    compilerOutput: sampleResults.find((r) => r.compileOutput)?.compileOutput ?? null,
    runtime: Math.max(...sampleResults.map((r) => r.runtime ?? 0), 0) || null,
    memory: Math.max(...sampleResults.map((r) => r.memory ?? 0), 0) || null,
    sampleResults: sampleResults.map(({ testCaseId, passed, actualOutput, expectedOutput }) => ({
      testCaseId,
      passed,
      actualOutput,
      expectedOutput,
    })),
  };
}

function truncate(text: string | null, maxBytes: number): string {
  if (!text) return "";
  const buf = Buffer.from(text, "utf8");
  if (buf.byteLength <= maxBytes) return text;
  return `${buf.subarray(0, maxBytes).toString("utf8")}\n...[output truncated]`;
}

interface HiddenTestExecutionResult {
  passedTests: number;
  totalTests: number;
  overallVerdict: Verdict;
  runtime: number | null;
  memory: number | null;
  compilerOutput: string | null;
}

/** Runs every hidden test case for `problem` against `sourceCode` and reduces the results
 *  into a single verdict/score-ready summary. Shared by a fresh submission (submitCode) and
 *  an admin-triggered re-evaluation of an existing one (reevaluateSubmission) so both paths
 *  score identically. */
async function executeHiddenTests(
  problem: CodingProblem,
  language: SupportedLanguage,
  sourceCode: string,
): Promise<HiddenTestExecutionResult> {
  const compiler = getCompilerProvider();

  const results = await mapWithConcurrency(
    problem.hiddenTestCases,
    HIDDEN_TEST_CONCURRENCY,
    async (testCase) => {
      const execResult = await compiler.execute({
        language,
        sourceCode,
        stdin: testCase.input,
        timeLimitSeconds: problem.timeLimit,
        memoryLimitMb: problem.memoryLimit,
      });
      const actualOutput = truncate(execResult.stdout ?? "", loadEnv().MAX_OUTPUT_SIZE_BYTES);
      const passed =
        execResult.verdict === "accepted" &&
        compareOutput(actualOutput, testCase.expectedOutput, problem.comparisonMode, problem.floatTolerance);
      return { passed, verdict: execResult.verdict, timeSeconds: execResult.timeSeconds, memoryKb: execResult.memoryKb, compileOutput: execResult.compileOutput };
    },
  );

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const firstFailure = results.find((r) => r.verdict !== "accepted");
  const overallVerdict: Verdict = firstFailure
    ? firstFailure.verdict
    : passedTests === totalTests
      ? "accepted"
      : "wrong_answer";

  const runtime = Math.max(...results.map((r) => r.timeSeconds ?? 0), 0) || null;
  const memory = Math.max(...results.map((r) => r.memoryKb ?? 0), 0) || null;
  const compilerOutput = results.find((r) => r.compileOutput)?.compileOutput ?? null;

  return { passedTests, totalTests, overallVerdict, runtime, memory, compilerOutput };
}

export async function submitCode(
  user: UserProfile,
  problemId: string,
  language: SupportedLanguage,
  sourceCode: string,
): Promise<SubmissionSummary> {
  const problem = await getActiveProblemOrThrow(problemId);
  assertLanguageSupported(problem, language);
  assertCodeSize(sourceCode);

  const submittedAt = new Date().toISOString();
  const id = randomUUID();

  const { passedTests, totalTests, overallVerdict, runtime, memory, compilerOutput } = await executeHiddenTests(
    problem,
    language,
    sourceCode,
  );

  const score = calculateCodingScore(problem.points, passedTests, totalTests, problem.scoringMode);
  const completedAt = new Date().toISOString();

  await createSubmission({
    id,
    userId: user.uid,
    eventId: DEFAULT_EVENT_ID,
    problemId,
    language,
    sourceCode,
    kind: "submit",
    status: "completed",
    verdict: overallVerdict,
    passedTests,
    totalTests,
    score,
    runtime,
    memory,
    compilerOutput,
    submittedAt,
    completedAt,
  });

  await recordCodingResult(user, problem.difficulty, score, overallVerdict, submittedAt);

  return {
    id,
    problemId,
    language,
    kind: "submit",
    status: "completed",
    verdict: overallVerdict,
    passedTests,
    totalTests,
    score,
    runtime,
    memory,
    compilerOutput,
    submittedAt,
    completedAt,
  };
}

export async function getSubmissionHistory(userId: string, problemId?: string): Promise<SubmissionSummary[]> {
  const submissions = await listSubmissionsForUser(userId, problemId);
  return submissions.map((s) => ({
    id: s.id,
    problemId: s.problemId,
    language: s.language,
    kind: s.kind,
    status: s.status,
    verdict: s.verdict,
    passedTests: s.passedTests,
    totalTests: s.totalTests,
    score: s.score,
    runtime: s.runtime,
    memory: s.memory,
    compilerOutput: s.compilerOutput,
    submittedAt: s.submittedAt,
    completedAt: s.completedAt,
  }));
}

/** Admin-only: re-runs an existing submission's stored source code against the problem's
 *  current hidden test cases and overwrites that same submission doc with the fresh result -
 *  used when a problem's test cases were fixed after participants had already submitted.
 *  recordCodingResult's own Math.max guards the leaderboard, so a lower re-eval score can
 *  never lower a previously recorded higher one; no extra protection is added here. */
export async function reevaluateSubmission(submissionId: string): Promise<SubmissionSummary> {
  const submission = await getSubmission(submissionId);
  if (!submission) throw new AppError("NOT_FOUND", "Submission not found");

  const problem = await getProblem(submission.problemId);
  if (!problem) throw new AppError("NOT_FOUND", "Problem not found");

  const { passedTests, totalTests, overallVerdict, runtime, memory, compilerOutput } = await executeHiddenTests(
    problem,
    submission.language,
    submission.sourceCode,
  );

  const score = calculateCodingScore(problem.points, passedTests, totalTests, problem.scoringMode);
  const completedAt = new Date().toISOString();

  await updateSubmission(submissionId, {
    verdict: overallVerdict,
    passedTests,
    totalTests,
    score,
    runtime,
    memory,
    compilerOutput,
    completedAt,
  });

  const user = await getUserById(submission.userId);
  if (user) {
    await recordCodingResult(user, problem.difficulty, score, overallVerdict, submission.submittedAt);
  }

  return {
    id: submission.id,
    problemId: submission.problemId,
    language: submission.language,
    kind: submission.kind,
    status: "completed",
    verdict: overallVerdict,
    passedTests,
    totalTests,
    score,
    runtime,
    memory,
    compilerOutput,
    submittedAt: submission.submittedAt,
    completedAt,
  };
}
