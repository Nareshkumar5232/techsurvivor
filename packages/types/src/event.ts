export type EventStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "round1_waiting"
  | "round1_live"
  | "round1_paused"
  | "round1_completed"
  | "round2_waiting"
  | "round2_live"
  | "round2_paused"
  | "round2_completed"
  | "results_published";

export type LeaderboardVisibility = "hidden" | "visible" | "frozen" | "published";

export interface EventConfig {
  id: string;
  name: string;
  description: string;
  organization: string;
  logoUrl: string | null;
  registrationStart: string;
  registrationEnd: string;
  eventStart: string;
  eventEnd: string;
  status: EventStatus;
  leaderboardVisibility: LeaderboardVisibility;
  includeRound1ScoreInFinal: boolean;
  coordinators: { name: string; role: string; phone: string; email: string }[];
  prizeDetails: string;
  createdAt: string;
  updatedAt: string;
}

export type RoundType = "mcq" | "coding";

export type RoundStatus =
  | "waiting"
  | "live"
  | "paused"
  | "completed"
  | "locked";

export interface RoundConfig {
  id: string;
  eventId: string;
  name: string;
  type: RoundType;
  status: RoundStatus;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  questionCount: number;
  qualificationPercentage: number;
  qualificationMinimumScore: number;
  instructions: string;
  settings: {
    warningsBeforeDisqualification: number;
    allowAnswerReview: boolean;
  };
}

/** Computed per-participant round status shown on the dashboard - derived from the round's
 *  admin-controlled status plus that participant's own attempt/qualification state. */
export type ParticipantRoundStatus =
  | "not_started"
  | "available"
  | "in_progress"
  | "submitted"
  | "qualified"
  | "not_qualified"
  | "locked"
  | "paused"
  | "closed";

export interface EventStatusView {
  event: EventConfig;
  round1: { config: RoundConfig; participantStatus: ParticipantRoundStatus };
  round2: { config: RoundConfig; participantStatus: ParticipantRoundStatus };
}

export type AnnouncementPriority = "info" | "warning" | "urgent";
export type AnnouncementAudience = "all" | "participants" | "admins" | "qualified";

export interface Announcement {
  id: string;
  eventId: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  publishAt: string;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
