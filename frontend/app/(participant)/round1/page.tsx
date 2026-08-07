"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MCQAttemptView } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { useEventStatus } from "@/lib/hooks/useEventStatus";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FullPageSpinner } from "@/components/ui/spinner";
import { ExamSession } from "./_components/ExamSession";

const LOCKED_MESSAGES: Record<"locked" | "paused" | "closed", string> = {
  locked: "Round 1 is currently locked for you.",
  paused: "Round 1 is paused by the organizers. Please wait for it to resume.",
  closed: "Round 1 has closed.",
};

export default function Round1Page() {
  const router = useRouter();
  const eventStatus = useEventStatus();
  const participantStatus = eventStatus.data?.round1.participantStatus;

  const [attempt, setAttempt] = useState<MCQAttemptView | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Restore in-progress state on load/refresh, or discover that the round hasn't been
  // started by this participant yet. Skipped for statuses where the backend would reject
  // the call outright (not_started -> ROUND_NOT_STARTED) or where it's irrelevant.
  useEffect(() => {
    if (!participantStatus) return;
    if (participantStatus === "available" || participantStatus === "in_progress") {
      let cancelled = false;
      setAttemptLoading(true);
      setAttemptError(null);
      apiClient
        .get<MCQAttemptView | null>("/round1/attempt")
        .then((view) => {
          if (cancelled) return;
          setAttempt(view);
        })
        .catch((err) => {
          if (!cancelled) {
            setAttemptError(err instanceof ApiClientError ? err.message : "Could not load your attempt.");
          }
        })
        .finally(() => {
          if (!cancelled) setAttemptLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [participantStatus]);

  // Once we know the attempt is no longer in progress (submitted/auto_submitted/expired,
  // or the round status already says so), send the participant to their result.
  useEffect(() => {
    if (attempt && attempt.status !== "in_progress") {
      router.replace("/round1/result");
      return;
    }
    if (
      participantStatus === "qualified" ||
      participantStatus === "not_qualified" ||
      participantStatus === "submitted"
    ) {
      router.replace("/round1/result");
    }
  }, [attempt, participantStatus, router]);

  async function handleStart() {
    setStarting(true);
    try {
      const view = await apiClient.post<MCQAttemptView>("/round1/start");
      setAttempt(view);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not start Round 1. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  if (eventStatus.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (eventStatus.isError || !eventStatus.data) {
    return <Alert variant="error">Could not load Round 1 status. Please refresh the page.</Alert>;
  }

  // State C: an active attempt in progress takes priority over everything else, including
  // a stale participantStatus from the last 15s event-status poll.
  if (attempt && attempt.status === "in_progress") {
    return <ExamSession roundName={eventStatus.data.round1.config.name || "Round 1"} initialAttempt={attempt} />;
  }

  // attempt is non-null here only if its status isn't "in_progress" (that case already
  // returned above), so its presence alone means we're waiting on the redirect effect.
  if (
    participantStatus === "qualified" ||
    participantStatus === "not_qualified" ||
    participantStatus === "submitted" ||
    attempt !== null
  ) {
    return <FullPageSpinner label="Redirecting to your result..." />;
  }

  if (attemptLoading && !attempt) {
    return <FullPageSpinner label="Loading Round 1..." />;
  }

  // State B: round not open to exam UI right now.
  if (participantStatus === "locked" || participantStatus === "paused" || participantStatus === "closed") {
    return (
      <Alert variant="warning" title="Round 1 unavailable">
        {LOCKED_MESSAGES[participantStatus]}
      </Alert>
    );
  }

  // State A: not started yet (round waiting, or round live but this participant hasn't started).
  const { config } = eventStatus.data.round1;
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{config.name || "Round 1"} - Instructions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="whitespace-pre-line text-sm text-slate-700">{config.instructions}</p>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">Questions</dt>
              <dd className="text-sm font-medium text-navy-900">{config.questionCount}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Duration</dt>
              <dd className="text-sm font-medium text-navy-900">{config.durationMinutes} minutes</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Qualification</dt>
              <dd className="text-sm font-medium text-navy-900">
                {config.qualificationMinimumScore} marks ({config.qualificationPercentage}%)
              </dd>
            </div>
          </dl>

          {attemptError && <Alert variant="error">{attemptError}</Alert>}

          {participantStatus === "not_started" && (
            <Alert variant="info">Round 1 has not started yet. It will open at the scheduled time.</Alert>
          )}

          <Button onClick={handleStart} disabled={starting || attemptLoading} className="self-start">
            {starting ? "Starting..." : "Start Round 1"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
