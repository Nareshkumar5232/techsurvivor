import { Router } from "express";
import { getUserById, listUsers } from "../../repositories/userRepo.js";
import { listAttemptsByRound } from "../../repositories/mcqRepo.js";
import { listSubmissionsForEvent } from "../../repositories/codingRepo.js";
import { DEFAULT_EVENT_ID, ROUND1_ID } from "../../repositories/collections.js";
import { getLiveLeaderboard } from "../../services/leaderboardService.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler } from "../../lib/response.js";

export const exportRouter = Router();

const EXPORT_TYPES = ["participants", "round1", "qualified", "submissions", "leaderboard"] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

/** Builds a CSV string by hand (no dependency): quotes any field containing a comma, quote,
 *  or newline by wrapping it in double quotes and doubling internal quotes, joins fields
 *  with commas and rows with CRLF. */
function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  function escapeField(value: unknown): string {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const lines = [headers.map(escapeField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeField(row[header])).join(","));
  }
  return lines.join("\r\n");
}

async function buildParticipantsCsv(): Promise<string> {
  const users = await listUsers();
  const rows: Record<string, unknown>[] = users.map((u) => ({
    fullName: u.fullName,
    email: u.email,
    institution: u.institution,
    department: u.department,
    year: u.year,
    rollNumber: u.rollNumber,
    phone: u.phone,
    status: u.status,
    disqualified: u.disqualified,
  }));
  return toCsv(
    ["fullName", "email", "institution", "department", "year", "rollNumber", "phone", "status", "disqualified"],
    rows,
  );
}

async function buildRound1Csv(onlyQualified: boolean): Promise<string> {
  const attempts = await listAttemptsByRound(ROUND1_ID);
  const filtered = onlyQualified ? attempts.filter((a) => a.qualified === true) : attempts;
  const rows: Record<string, unknown>[] = await Promise.all(
    filtered.map(async (attempt) => {
      const user = await getUserById(attempt.userId);
      return {
        fullName: user?.fullName ?? "",
        rollNumber: user?.rollNumber ?? "",
        score: attempt.score,
        percentage: attempt.percentage,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unansweredCount: attempt.unansweredCount,
        qualified: attempt.qualified,
        status: attempt.status,
      };
    }),
  );
  return toCsv(
    [
      "fullName",
      "rollNumber",
      "score",
      "percentage",
      "correctCount",
      "incorrectCount",
      "unansweredCount",
      "qualified",
      "status",
    ],
    rows,
  );
}

async function buildSubmissionsCsv(): Promise<string> {
  const submissions = await listSubmissionsForEvent(DEFAULT_EVENT_ID);
  const rows: Record<string, unknown>[] = submissions.map((s) => ({
    userId: s.userId,
    problemId: s.problemId,
    language: s.language,
    kind: s.kind,
    verdict: s.verdict,
    passedTests: s.passedTests,
    totalTests: s.totalTests,
    score: s.score,
    submittedAt: s.submittedAt,
  }));
  return toCsv(
    ["userId", "problemId", "language", "kind", "verdict", "passedTests", "totalTests", "score", "submittedAt"],
    rows,
  );
}

async function buildLeaderboardCsv(): Promise<string> {
  const entries = await getLiveLeaderboard({ excludeDisqualified: false });
  const rows: Record<string, unknown>[] = entries.map((e) => ({
    rank: e.rank,
    participantName: e.participantName,
    institution: e.institution,
    easyScore: e.easyScore,
    mediumScore: e.mediumScore,
    hardScore: e.hardScore,
    totalScore: e.totalScore,
    acceptedProblemCount: e.acceptedProblemCount,
    penaltyTime: e.penaltyTime,
  }));
  return toCsv(
    [
      "rank",
      "participantName",
      "institution",
      "easyScore",
      "mediumScore",
      "hardScore",
      "totalScore",
      "acceptedProblemCount",
      "penaltyTime",
    ],
    rows,
  );
}

function isExportType(value: string): value is ExportType {
  return (EXPORT_TYPES as readonly string[]).includes(value);
}

const CSV_BUILDERS: Record<ExportType, () => Promise<string>> = {
  participants: buildParticipantsCsv,
  round1: () => buildRound1Csv(false),
  qualified: () => buildRound1Csv(true),
  submissions: buildSubmissionsCsv,
  leaderboard: buildLeaderboardCsv,
};

exportRouter.get(
  "/export",
  asyncHandler(async (req, res) => {
    const type = req.query.type;
    if (typeof type !== "string" || !isExportType(type)) {
      throw new AppError("VALIDATION_ERROR", `Unknown export type: ${String(type)}`);
    }

    const csv = await CSV_BUILDERS[type]();

    const filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }),
);
