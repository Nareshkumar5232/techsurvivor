import { ROUND1_QUALIFICATION_MIN_SCORE } from "@tech-survivor/config";
import type { LeaderboardEntry, ScoringMode } from "@tech-survivor/types";

export interface MCQScoringQuestion {
  id: string;
  marks: number;
  negativeMarks: number;
  correctOptionIndex: number;
}

export interface MCQScoringResult {
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

export function calculateMcqScore(
  questions: MCQScoringQuestion[],
  answers: Record<string, number>,
): MCQScoringResult {
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const q of questions) {
    const selected = answers[q.id];
    if (selected === undefined || selected === null) {
      unansweredCount += 1;
      continue;
    }
    if (selected === q.correctOptionIndex) {
      score += q.marks;
      correctCount += 1;
    } else {
      score -= q.negativeMarks;
      incorrectCount += 1;
    }
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

  return { score, percentage, correctCount, incorrectCount, unansweredCount };
}

export function isQualified(score: number, minimumScore = ROUND1_QUALIFICATION_MIN_SCORE): boolean {
  return score >= minimumScore;
}

/**
 * score = problemPoints x passedHiddenTests / totalHiddenTests, rounded to the nearest
 * whole point. All-or-nothing mode awards full points only when every hidden test passes.
 */
export function calculateCodingScore(
  problemPoints: number,
  passedTests: number,
  totalTests: number,
  scoringMode: ScoringMode,
): number {
  if (totalTests <= 0) return 0;
  if (scoringMode === "all_or_nothing") {
    return passedTests === totalTests ? problemPoints : 0;
  }
  return Math.round((problemPoints * passedTests) / totalTests);
}

/**
 * Ranking order: higher total score > more accepted problems > lower penalty time
 * > earlier final accepted submission. Returns a comparator suitable for Array.sort
 * (negative => a ranks above b).
 */
export function compareLeaderboardEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  if (b.acceptedProblemCount !== a.acceptedProblemCount) {
    return b.acceptedProblemCount - a.acceptedProblemCount;
  }
  if (a.penaltyTime !== b.penaltyTime) return a.penaltyTime - b.penaltyTime;

  const aTime = a.lastAcceptedAt ? new Date(a.lastAcceptedAt).getTime() : Infinity;
  const bTime = b.lastAcceptedAt ? new Date(b.lastAcceptedAt).getTime() : Infinity;
  return aTime - bTime;
}

export function assignRanks(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort(compareLeaderboardEntries);
  return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
