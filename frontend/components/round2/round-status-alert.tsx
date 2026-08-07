import type { ParticipantRoundStatus } from "@tech-survivor/types";
import { Alert } from "@/components/ui/alert";
import { NotQualifiedAlert } from "@/components/round2/not-qualified-alert";

/** One alert per non-accessible Round 2 status. Only "locked" | "not_started" | "paused" |
 *  "closed" | "available" are ever returned for round2 (see
 *  apps/api/src/services/eventService.ts:round2ParticipantStatus) - the default branch is a
 *  defensive fallback for any other ParticipantRoundStatus value. */
export function RoundStatusAlert({ status }: { status: ParticipantRoundStatus }) {
  switch (status) {
    case "locked":
    case "not_qualified":
      return <NotQualifiedAlert />;
    case "not_started":
      return (
        <Alert variant="info" title="Round 2 hasn't started yet">
          Check back once the event coordinators start the round.
        </Alert>
      );
    case "paused":
      return (
        <Alert variant="warning" title="Round 2 is paused">
          The round is temporarily paused by the event coordinators. It will resume shortly.
        </Alert>
      );
    case "closed":
      return (
        <Alert variant="info" title="Round 2 has closed">
          The submission window for Round 2 has ended.
        </Alert>
      );
    default:
      return (
        <Alert variant="info" title="Round 2 is not currently available">
          Please check back later.
        </Alert>
      );
  }
}
