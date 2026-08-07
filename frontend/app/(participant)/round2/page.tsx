"use client";

import Link from "next/link";
import { Code2, Trophy } from "lucide-react";
import { ApiClientError } from "@/lib/apiClient";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/round2/difficulty-badge";
import { NotQualifiedAlert } from "@/components/round2/not-qualified-alert";
import { RoundStatusAlert } from "@/components/round2/round-status-alert";
import { VerdictBadge } from "@/components/verdict-badge";
import { useEventStatus } from "@/lib/hooks/useEventStatus";
import { bestSubmissionByProblem, useRound2Problems, useSubmissionHistory } from "@/lib/hooks/useRound2";
import { cn } from "@/lib/utils";

export default function Round2ListPage() {
  const eventStatusQuery = useEventStatus();
  const status = eventStatusQuery.data?.round2.participantStatus;
  const accessible = status === "available" || status === "in_progress";

  const problemsQuery = useRound2Problems(accessible);
  const historyQuery = useSubmissionHistory();
  const problemsNotQualified =
    problemsQuery.error instanceof ApiClientError && problemsQuery.error.code === "NOT_QUALIFIED";

  if (eventStatusQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  if (eventStatusQuery.isError) {
    return (
      <Alert variant="error" title="Could not load Round 2 status">
        Please refresh the page. If the problem persists, contact an event coordinator.
      </Alert>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Round 2 - Coding</h1>
        <p className="mt-1 text-sm text-slate-500">Solve as many of the three problems as you can before time runs out.</p>
      </div>

      {!accessible && status !== undefined && <RoundStatusAlert status={status} />}

      {accessible && problemsQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      )}

      {accessible && problemsQuery.isError && (problemsNotQualified ? (
        <NotQualifiedAlert />
      ) : (
        <Alert variant="error" title="Could not load problems">
          Please refresh the page and try again.
        </Alert>
      ))}

      {accessible && problemsQuery.data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problemsQuery.data.map((problem) => {
            const best = bestSubmissionByProblem(historyQuery.data, problem.id);
            return (
              <Card key={problem.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <Badge variant="secondary">{problem.points} pts</Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {best ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
                      <span className="font-medium text-navy-900">
                        Best: {best.score}/{problem.points}
                      </span>
                      <VerdictBadge verdict={best.verdict} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Not attempted yet</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/round2/${problem.id}`}
                    className={cn(buttonVariants({ variant: "primary" }), "w-full")}
                  >
                    <Code2 className="h-4 w-4" aria-hidden="true" />
                    Solve
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
