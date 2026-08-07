import type { ParticipantRoundStatus } from "@tech-survivor/types";
import type { BadgeProps } from "@/components/ui/badge";

/** Human-readable label for a participant's computed status on a round. Shared by the
 *  dashboard round cards and the Round 1 landing page so the two never drift apart. */
export const ROUND_STATUS_LABELS: Record<ParticipantRoundStatus, string> = {
  not_started: "Not Started",
  available: "Available",
  in_progress: "In Progress",
  submitted: "Submitted",
  qualified: "Qualified",
  not_qualified: "Not Qualified",
  locked: "Locked",
  paused: "Paused",
  closed: "Closed",
};

export const ROUND_STATUS_BADGE_VARIANT: Record<ParticipantRoundStatus, BadgeProps["variant"]> = {
  not_started: "outline",
  available: "info",
  in_progress: "warning",
  submitted: "secondary",
  qualified: "success",
  not_qualified: "destructive",
  locked: "secondary",
  paused: "secondary",
  closed: "secondary",
};
