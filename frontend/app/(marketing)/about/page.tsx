"use client";

import { Code2, ListChecks, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicEvent } from "@/lib/hooks/useEventStatus";

export default function AboutPage() {
  const { data: event, isLoading, isError, error } = usePublicEvent();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">About the event</h1>

      {isLoading && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-6">
          <Alert variant="warning" title="Couldn't load event details">
            {error instanceof Error ? error.message : "Please try again later."}
          </Alert>
        </div>
      )}

      {!isLoading && !isError && event && (
        <div className="mt-6 space-y-4 text-slate-600">
          <p className="text-lg">
            <span className="font-semibold text-navy-900">{event.name}</span> is organized by{" "}
            {event.organization}.
          </p>
          <p>{event.description}</p>
        </div>
      )}

      {!isLoading && !isError && !event && (
        <p className="mt-6 text-slate-600">Event details will appear here once the event is configured.</p>
      )}

      <div className="mt-12 space-y-6">
        <p className="text-slate-600">
          Tech Survivor is a two-round, solo-participation technical event designed to test both
          conceptual knowledge and practical coding ability under time pressure.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col items-start gap-2 p-5">
              <ListChecks className="h-6 w-6 text-brand-blue" aria-hidden="true" />
              <p className="font-semibold text-navy-900">Qualify</p>
              <p className="text-sm text-slate-600">
                Everyone starts with a 20-question MCQ round to test fundamentals.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-start gap-2 p-5">
              <Code2 className="h-6 w-6 text-brand-purple" aria-hidden="true" />
              <p className="font-semibold text-navy-900">Compete</p>
              <p className="text-sm text-slate-600">
                Qualifiers move to a live coding contest with three graded problems.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-start gap-2 p-5">
              <ShieldCheck className="h-6 w-6 text-green-600" aria-hidden="true" />
              <p className="font-semibold text-navy-900">Fair play</p>
              <p className="text-sm text-slate-600">
                One account per participant, with activity monitoring throughout both rounds.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
