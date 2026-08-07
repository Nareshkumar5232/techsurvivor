import type { EventConfig, EventStatusView, ParticipantRoundStatus, RoundConfig } from "@tech-survivor/types";
import { getEvent, getRound } from "../repositories/eventRepo.js";
import { getAttempt } from "../repositories/mcqRepo.js";
import { ROUND1_ID, ROUND2_ID } from "../repositories/collections.js";
import { AppError } from "../lib/errors.js";

function round2ParticipantStatus(round: RoundConfig, qualified: boolean): ParticipantRoundStatus {
  if (!qualified) return "locked";
  if (round.status === "waiting") return "not_started";
  if (round.status === "paused") return "paused";
  if (round.status === "completed" || round.status === "locked") return "closed";
  return "available";
}

async function round1ParticipantStatus(round: RoundConfig, userId: string): Promise<ParticipantRoundStatus> {
  const attempt = await getAttempt(userId, ROUND1_ID);
  if (attempt) {
    if (attempt.status === "in_progress") return "in_progress";
    return attempt.qualified ? "qualified" : "not_qualified";
  }
  if (round.status === "waiting") return "not_started";
  if (round.status === "paused") return "paused";
  if (round.status === "completed" || round.status === "locked") return "closed";
  return "available";
}

export async function getEventConfigOrThrow(): Promise<EventConfig> {
  const event = await getEvent();
  if (!event) throw new AppError("NOT_FOUND", "Event has not been configured yet");
  return event;
}

export async function getEventStatusForUser(userId: string): Promise<EventStatusView> {
  const event = await getEventConfigOrThrow();
  const [round1, round2] = await Promise.all([getRound(ROUND1_ID), getRound(ROUND2_ID)]);
  if (!round1 || !round2) throw new AppError("NOT_FOUND", "Event rounds are not configured yet");

  const attempt = await getAttempt(userId, ROUND1_ID);
  const qualified = attempt?.qualified === true;

  return {
    event,
    round1: { config: round1, participantStatus: await round1ParticipantStatus(round1, userId) },
    round2: { config: round2, participantStatus: round2ParticipantStatus(round2, qualified) },
  };
}
