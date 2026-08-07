"use client";

import { CalendarCheck, CalendarX, FlagOff, PlayCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicEvent } from "@/lib/hooks/useEventStatus";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "TBA";
  return dateFormatter.format(date);
}

export default function SchedulePage() {
  const { data: event, isLoading, isError, error } = usePublicEvent();

  const milestones = event
    ? [
        { label: "Registration opens", date: event.registrationStart, icon: CalendarCheck },
        { label: "Registration closes", date: event.registrationEnd, icon: CalendarX },
        { label: "Event begins", date: event.eventStart, icon: PlayCircle },
        { label: "Event ends", date: event.eventEnd, icon: FlagOff },
      ]
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Schedule</h1>
      <p className="mt-3 text-slate-600">Key dates and times for this event.</p>

      {isLoading && (
        <div className="mt-10 space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-10">
          <Alert variant="warning" title="Couldn't load the schedule">
            {error instanceof Error ? error.message : "Please try again later."}
          </Alert>
        </div>
      )}

      {!isLoading && !isError && !event && (
        <div className="mt-10">
          <Alert variant="info" title="Schedule not published yet">
            Dates will appear here once the organizers configure the event.
          </Alert>
        </div>
      )}

      {!isLoading && !isError && event && (
        <ol className="mt-10 space-y-6 border-l border-slate-200 pl-6">
          {milestones.map(({ label, date, icon: Icon }) => (
            <li key={label} className="relative">
              <span className="absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-white">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="font-semibold text-navy-900">{label}</p>
              <p className="text-sm text-slate-600">{formatDate(date)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
