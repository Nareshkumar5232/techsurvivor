"use client";

import { Mail, Phone } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicEvent } from "@/lib/hooks/useEventStatus";

export default function ContactPage() {
  const { data: event, isLoading, isError, error } = usePublicEvent();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Contact organizers</h1>
      <p className="mt-3 text-slate-600">
        Reach out to the event coordinators below for registration issues, technical problems, or
        general questions.
      </p>

      {isLoading && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-10">
          <Alert variant="warning" title="Couldn't load coordinator details">
            {error instanceof Error ? error.message : "Please try again later."}
          </Alert>
        </div>
      )}

      {!isLoading && !isError && event && event.coordinators.length === 0 && (
        <div className="mt-10">
          <Alert variant="info" title="No coordinators published yet">
            Contact details will appear here once the organizers add them.
          </Alert>
        </div>
      )}

      {!isLoading && !isError && event && event.coordinators.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {event.coordinators.map((coordinator) => (
            <Card key={coordinator.email}>
              <CardContent className="p-6">
                <p className="text-lg font-semibold text-navy-900">{coordinator.name}</p>
                <p className="text-sm text-slate-500">{coordinator.role}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <a href={`tel:${coordinator.phone}`} className="flex items-center gap-2 hover:text-brand-blue">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {coordinator.phone}
                  </a>
                  <a href={`mailto:${coordinator.email}`} className="flex items-center gap-2 hover:text-brand-blue">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {coordinator.email}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !isError && !event && (
        <div className="mt-10">
          <Alert variant="info" title="Contact details not available yet">
            Check back once the event has been configured.
          </Alert>
        </div>
      )}
    </div>
  );
}
