import { describe, expect, it } from "vitest";
import {
  assignRanks,
  calculateCodingScore,
  calculateMcqScore,
  isQualified,
} from "./scoring.js";
import type { LeaderboardEntry } from "@tech-survivor/types";

function makeQuestions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i}`,
    marks: 1,
    negativeMarks: 0,
    correctOptionIndex: 0,
  }));
}

describe("calculateMcqScore + isQualified", () => {
  it("14/20 correct does not qualify", () => {
    const questions = makeQuestions(20);
    const answers: Record<string, number> = {};
    for (let i = 0; i < 14; i++) answers[`q${i}`] = 0;
    for (let i = 14; i < 20; i++) answers[`q${i}`] = 1;

    const result = calculateMcqScore(questions, answers);
    expect(result.score).toBe(14);
    expect(isQualified(result.score)).toBe(false);
  });

  it("15/20 correct qualifies", () => {
    const questions = makeQuestions(20);
    const answers: Record<string, number> = {};
    for (let i = 0; i < 15; i++) answers[`q${i}`] = 0;
    for (let i = 15; i < 20; i++) answers[`q${i}`] = 1;

    const result = calculateMcqScore(questions, answers);
    expect(result.score).toBe(15);
    expect(result.percentage).toBe(75);
    expect(isQualified(result.score)).toBe(true);
  });

  it("counts unanswered questions separately from incorrect ones", () => {
    const questions = makeQuestions(3);
    const result = calculateMcqScore(questions, { q0: 0 });
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(0);
    expect(result.unansweredCount).toBe(2);
  });

  it("applies negative marking when configured", () => {
    const questions = [{ id: "q0", marks: 2, negativeMarks: 0.5, correctOptionIndex: 0 }];
    const result = calculateMcqScore(questions, { q0: 1 });
    expect(result.score).toBe(-0.5);
    expect(result.incorrectCount).toBe(1);
  });
});

describe("calculateCodingScore", () => {
  it("awards full points only on 100% pass for all-or-nothing mode", () => {
    expect(calculateCodingScore(100, 9, 10, "all_or_nothing")).toBe(0);
    expect(calculateCodingScore(100, 10, 10, "all_or_nothing")).toBe(100);
  });

  it("prorates points for partial scoring", () => {
    expect(calculateCodingScore(300, 6, 10, "partial")).toBe(180);
  });
});

describe("assignRanks / compareLeaderboardEntries", () => {
  function entry(overrides: Partial<LeaderboardEntry>): LeaderboardEntry {
    return {
      userId: "u",
      participantName: "P",
      institution: "I",
      easyScore: 0,
      mediumScore: 0,
      hardScore: 0,
      easyAccepted: false,
      mediumAccepted: false,
      hardAccepted: false,
      round1Score: 0,
      totalScore: 0,
      acceptedProblemCount: 0,
      penaltyTime: 0,
      lastAcceptedAt: null,
      rank: 0,
      updatedAt: new Date(0).toISOString(),
      ...overrides,
    };
  }

  it("ranks higher total score first", () => {
    const ranked = assignRanks([
      entry({ userId: "a", totalScore: 300 }),
      entry({ userId: "b", totalScore: 500 }),
    ]);
    expect(ranked[0]!.userId).toBe("b");
    expect(ranked[0]!.rank).toBe(1);
  });

  it("breaks ties by accepted count, then penalty time, then earlier final accept", () => {
    const ranked = assignRanks([
      entry({ userId: "a", totalScore: 300, acceptedProblemCount: 2, penaltyTime: 50 }),
      entry({ userId: "b", totalScore: 300, acceptedProblemCount: 2, penaltyTime: 20 }),
      entry({ userId: "c", totalScore: 300, acceptedProblemCount: 3, penaltyTime: 999 }),
    ]);
    expect(ranked.map((e) => e.userId)).toEqual(["c", "b", "a"]);
  });
});
