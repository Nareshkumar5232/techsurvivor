import { PENALTY_MINUTES_PER_WRONG_SUBMISSION } from "@tech-survivor/config";
import { assignRanks } from "@tech-survivor/shared";
import type { CodingDifficulty, LeaderboardEntry, UserProfile, Verdict } from "@tech-survivor/types";
import { getSnapshot, listEntries, saveSnapshot, upsertEntryTransaction } from "../repositories/leaderboardRepo.js";
import { getEventConfigOrThrow } from "./eventService.js";
import { listUsers } from "../repositories/userRepo.js";

function emptyEntry(user: UserProfile): LeaderboardEntry {
  return {
    userId: user.uid,
    participantName: user.fullName,
    institution: user.institution,
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
    updatedAt: new Date().toISOString(),
  };
}

const SCORE_FIELD: Record<CodingDifficulty, "easyScore" | "mediumScore" | "hardScore"> = {
  easy: "easyScore",
  medium: "mediumScore",
  hard: "hardScore",
};
const ACCEPTED_FIELD: Record<CodingDifficulty, "easyAccepted" | "mediumAccepted" | "hardAccepted"> = {
  easy: "easyAccepted",
  medium: "mediumAccepted",
  hard: "hardAccepted",
};

function recomputeAggregate(entry: LeaderboardEntry): LeaderboardEntry {
  const acceptedProblemCount = [entry.easyAccepted, entry.mediumAccepted, entry.hardAccepted].filter(
    Boolean,
  ).length;
  return { ...entry, acceptedProblemCount };
}

/** Merges one coding submission's result into the participant's leaderboard entry. A lower
 *  score for the same difficulty/problem can never overwrite a previously stored higher one -
 *  Math.max enforces that directly inside the transaction. */
export async function recordCodingResult(
  user: UserProfile,
  difficulty: CodingDifficulty,
  score: number,
  verdict: Verdict,
  submittedAt: string,
): Promise<LeaderboardEntry> {
  return upsertEntryTransaction(user.uid, (current) => {
    const base = current ?? emptyEntry(user);
    const scoreField = SCORE_FIELD[difficulty];
    const acceptedField = ACCEPTED_FIELD[difficulty];
    const wasAccepted = base[acceptedField];
    const isAccepted = verdict === "accepted";

    const next: LeaderboardEntry = {
      ...base,
      participantName: user.fullName,
      institution: user.institution,
      [scoreField]: Math.max(base[scoreField], score),
      updatedAt: new Date().toISOString(),
    };

    if (isAccepted && !wasAccepted) {
      next[acceptedField] = true;
      next.lastAcceptedAt = submittedAt;
    } else if (!isAccepted && !wasAccepted) {
      next.penaltyTime = base.penaltyTime + PENALTY_MINUTES_PER_WRONG_SUBMISSION;
    }

    return recomputeAggregate(next);
  });
}

export async function recordRound1Score(user: UserProfile, score: number): Promise<LeaderboardEntry> {
  return upsertEntryTransaction(user.uid, (current) => {
    const base = current ?? emptyEntry(user);
    return recomputeAggregate({
      ...base,
      participantName: user.fullName,
      institution: user.institution,
      round1Score: score,
      updatedAt: new Date().toISOString(),
    });
  });
}

function withComputedTotal(entry: LeaderboardEntry, includeRound1: boolean): LeaderboardEntry {
  const totalScore = entry.easyScore + entry.mediumScore + entry.hardScore + (includeRound1 ? entry.round1Score : 0);
  return { ...entry, totalScore };
}

export interface LeaderboardOptions {
  excludeDisqualified?: boolean;
}

/** Always computed live: totalScore depends on the event's current includeRound1ScoreInFinal
 *  setting (an admin can flip it after Round 1 ends and see results change immediately) and
 *  rank is derived by sorting, never stored. */
export async function getLiveLeaderboard(options: LeaderboardOptions = {}): Promise<LeaderboardEntry[]> {
  const [event, entries] = await Promise.all([getEventConfigOrThrow(), listEntries()]);
  let withTotals = entries.map((e) => withComputedTotal(e, event.includeRound1ScoreInFinal));

  if (options.excludeDisqualified !== false) {
    const disqualifiedUsers = await listUsers({ status: "disqualified" });
    const disqualifiedIds = new Set(disqualifiedUsers.map((u) => u.uid));
    withTotals = withTotals.filter((e) => !disqualifiedIds.has(e.userId));
  }

  return assignRanks(withTotals);
}

export async function getEntryForUser(userId: string): Promise<LeaderboardEntry | null> {
  const leaderboard = await getLiveLeaderboard({ excludeDisqualified: false });
  return leaderboard.find((e) => e.userId === userId) ?? null;
}

export async function publishSnapshot(): Promise<LeaderboardEntry[]> {
  const live = await getLiveLeaderboard();
  await saveSnapshot(live);
  return live;
}

export async function getPublicLeaderboard(): Promise<{ entries: LeaderboardEntry[]; isFrozen: boolean }> {
  const event = await getEventConfigOrThrow();
  if (event.leaderboardVisibility === "hidden") {
    return { entries: [], isFrozen: false };
  }
  if (event.leaderboardVisibility === "frozen" || event.leaderboardVisibility === "published") {
    const snapshot = await getSnapshot();
    return { entries: snapshot?.entries ?? [], isFrozen: event.leaderboardVisibility === "frozen" };
  }
  return { entries: await getLiveLeaderboard(), isFrozen: false };
}
