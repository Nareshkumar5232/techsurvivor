import { Router } from "express";
import type { MCQAttempt } from "@tech-survivor/types";
import { listUsers } from "../../repositories/userRepo.js";
import { listAttemptsByRound } from "../../repositories/mcqRepo.js";
import { listProblems, listSubmissionsForEvent } from "../../repositories/codingRepo.js";
import { DEFAULT_EVENT_ID, ROUND1_ID } from "../../repositories/collections.js";
import { asyncHandler, sendSuccess } from "../../lib/response.js";

export const dashboardRouter = Router();

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Groups ISO timestamps into one {date, count} point per calendar day present in the data. */
function countByDay(timestamps: string[]): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const iso of timestamps) {
    const key = dayKey(iso);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, count]) => ({ date, count }));
}

/** Buckets finalized MCQ scores into fixed-width ranges of 4 (e.g. "0-3", "4-7", ...),
 *  always covering at least 0-19 and extending further only if a score exceeds that. */
function mcqScoreBuckets(attempts: MCQAttempt[]): { scoreRange: string; count: number }[] {
  const bucketSize = 4;
  const finishedScores = attempts
    .map((a) => a.score)
    .filter((score): score is number => score !== null && score !== undefined);
  const highest = finishedScores.reduce((max, score) => Math.max(max, score), 0);
  const maxBucketStart = Math.max(16, Math.floor(highest / bucketSize) * bucketSize);

  const buckets: { start: number; count: number }[] = [];
  for (let start = 0; start <= maxBucketStart; start += bucketSize) {
    buckets.push({ start, count: 0 });
  }
  for (const score of finishedScores) {
    const clampedIndex = Math.min(Math.max(0, Math.floor(score / bucketSize)), buckets.length - 1);
    const bucket = buckets[clampedIndex];
    if (bucket) bucket.count += 1;
  }
  return buckets.map((b) => ({ scoreRange: `${b.start}-${b.start + bucketSize - 1}`, count: b.count }));
}

dashboardRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [users, attempts, submissions, problems] = await Promise.all([
      listUsers(),
      listAttemptsByRound(ROUND1_ID),
      listSubmissionsForEvent(DEFAULT_EVENT_ID),
      listProblems(),
    ]);

    const attemptByUserId = new Map(attempts.map((a) => [a.userId, a]));
    // "Submission" in the dashboard/business sense means a judged final answer, not a
    // practice "run" - every submission-shaped metric below is scoped to kind === "submit".
    const submitSubmissions = submissions.filter((s) => s.kind === "submit");

    const totalRegistrations = users.length;
    const verifiedParticipants = users.filter((u) => u.emailVerified).length;
    const round1Started = attempts.length;
    const round1Submitted = attempts.filter(
      (a) => a.status === "submitted" || a.status === "auto_submitted",
    ).length;
    const qualifiedParticipants = attempts.filter((a) => a.qualified === true).length;
    const round2Participants = new Set(submitSubmissions.map((s) => s.userId)).size;
    const codeSubmissions = submitSubmissions.length;
    const acceptedSubmissions = submitSubmissions.filter((s) => s.verdict === "accepted").length;
    const activeParticipants = users.filter((u) => u.status === "active").length;
    const disqualifiedParticipants = users.filter((u) => u.status === "disqualified").length;

    let qualified = 0;
    let notQualified = 0;
    let pending = 0;
    for (const user of users) {
      const attempt = attemptByUserId.get(user.uid);
      if (!attempt || attempt.status === "in_progress") pending += 1;
      else if (attempt.qualified === true) qualified += 1;
      else notQualified += 1;
    }

    const languageCounts = new Map<string, number>();
    for (const s of submitSubmissions) {
      languageCounts.set(s.language, (languageCounts.get(s.language) ?? 0) + 1);
    }

    const problemSuccessRate = problems.map((problem) => {
      const problemSubmissions = submitSubmissions.filter((s) => s.problemId === problem.id);
      const attemptsCount = problemSubmissions.length;
      const accepted = problemSubmissions.filter((s) => s.verdict === "accepted").length;
      return {
        problemId: problem.id,
        title: problem.title,
        attempts: attemptsCount,
        accepted,
        successRate: attemptsCount > 0 ? Math.round((accepted / attemptsCount) * 100) : 0,
      };
    });

    const verdictCounts = new Map<string, number>();
    for (const s of submitSubmissions) {
      verdictCounts.set(s.verdict, (verdictCounts.get(s.verdict) ?? 0) + 1);
    }

    sendSuccess(res, {
      totalRegistrations,
      verifiedParticipants,
      round1Started,
      round1Submitted,
      qualifiedParticipants,
      round2Participants,
      codeSubmissions,
      acceptedSubmissions,
      activeParticipants,
      disqualifiedParticipants,
      charts: {
        registrationTrend: countByDay(users.map((u) => u.createdAt)),
        mcqScoreDistribution: mcqScoreBuckets(attempts),
        qualificationRate: { qualified, notQualified, pending },
        languageUsage: [...languageCounts.entries()].map(([language, count]) => ({ language, count })),
        problemSuccessRate,
        verdictDistribution: [...verdictCounts.entries()].map(([verdict, count]) => ({ verdict, count })),
        submissionActivity: countByDay(submitSubmissions.map((s) => s.submittedAt)),
      },
    });
  }),
);
