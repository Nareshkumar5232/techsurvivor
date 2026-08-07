"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { eventConfigUpdateSchema, coordinatorSchema } from "@tech-survivor/shared";
import type { EventConfig } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { usePublicEvent } from "@/lib/hooks/useEventStatus";
import { isoToLocalInput, localInputToIso } from "@/lib/datetimeLocal";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/** Client-side form schema. Mirrors `eventConfigUpdateSchema` field-for-field, except the
 *  four datetime fields: `<input type="datetime-local">` produces "YYYY-MM-DDTHH:mm" which
 *  Zod's `.datetime()` rejects (it wants a full ISO string with seconds + offset). We validate
 *  those as plain required strings here for a responsive form, convert them to real ISO with
 *  `localInputToIso`, then re-validate the whole payload against the real
 *  `eventConfigUpdateSchema` right before sending - so the request that hits the wire is
 *  guaranteed to pass the same schema the server uses. */
const eventFormSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000),
  organization: z.string().trim().max(200),
  logoUrl: z.string().trim().max(2000),
  registrationStart: z.string().min(1, "Required"),
  registrationEnd: z.string().min(1, "Required"),
  eventStart: z.string().min(1, "Required"),
  eventEnd: z.string().min(1, "Required"),
  leaderboardVisibility: z.enum(["hidden", "visible", "frozen", "published"]),
  includeRound1ScoreInFinal: z.boolean(),
  coordinators: z.array(coordinatorSchema),
  prizeDetails: z.string().trim().max(5000),
});
type EventFormValues = z.infer<typeof eventFormSchema>;

function toFormValues(event: EventConfig): EventFormValues {
  return {
    name: event.name,
    description: event.description,
    organization: event.organization,
    logoUrl: event.logoUrl ?? "",
    registrationStart: isoToLocalInput(event.registrationStart),
    registrationEnd: isoToLocalInput(event.registrationEnd),
    eventStart: isoToLocalInput(event.eventStart),
    eventEnd: isoToLocalInput(event.eventEnd),
    leaderboardVisibility: event.leaderboardVisibility,
    includeRound1ScoreInFinal: event.includeRound1ScoreInFinal,
    coordinators: event.coordinators,
    prizeDetails: event.prizeDetails,
  };
}

export default function EventSettingsPage() {
  const { data: event, isLoading, isError } = usePublicEvent();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      organization: "",
      logoUrl: "",
      registrationStart: "",
      registrationEnd: "",
      eventStart: "",
      eventEnd: "",
      leaderboardVisibility: "hidden",
      includeRound1ScoreInFinal: false,
      coordinators: [],
      prizeDetails: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "coordinators" });

  useEffect(() => {
    if (event) reset(toFormValues(event));
  }, [event, reset]);

  const mutation = useMutation({
    mutationFn: (values: EventFormValues) => {
      const payload = eventConfigUpdateSchema.parse({
        name: values.name,
        description: values.description,
        organization: values.organization,
        logoUrl: values.logoUrl.trim() ? values.logoUrl.trim() : null,
        registrationStart: localInputToIso(values.registrationStart),
        registrationEnd: localInputToIso(values.registrationEnd),
        eventStart: localInputToIso(values.eventStart),
        eventEnd: localInputToIso(values.eventEnd),
        leaderboardVisibility: values.leaderboardVisibility,
        includeRound1ScoreInFinal: values.includeRound1ScoreInFinal,
        coordinators: values.coordinators,
        prizeDetails: values.prizeDetails,
      });
      return apiClient.patch<EventConfig>("/admin/event", payload);
    },
    onSuccess: (updated) => {
      toast.success("Event settings saved");
      queryClient.setQueryData(["event"], updated);
      reset(toFormValues(updated));
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Could not save event settings");
    },
  });

  function onSubmit(values: EventFormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Event Settings</h1>
        <p className="text-sm text-slate-500">Configure the event&apos;s identity, schedule, and result behavior.</p>
      </div>

      {isError && <Alert variant="error">Could not load current event settings.</Alert>}
      {isLoading && <Skeleton className="h-96 w-full" />}

      {event && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="name">Event name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} {...register("description")} />
                {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" {...register("organization")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input id="logoUrl" type="url" placeholder="https://..." {...register("logoUrl")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>All times are interpreted in your browser&apos;s local timezone.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="registrationStart">Registration opens</Label>
                <Input id="registrationStart" type="datetime-local" {...register("registrationStart")} />
                {errors.registrationStart && <p className="text-xs text-red-600">{errors.registrationStart.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="registrationEnd">Registration closes</Label>
                <Input id="registrationEnd" type="datetime-local" {...register("registrationEnd")} />
                {errors.registrationEnd && <p className="text-xs text-red-600">{errors.registrationEnd.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eventStart">Event starts</Label>
                <Input id="eventStart" type="datetime-local" {...register("eventStart")} />
                {errors.eventStart && <p className="text-xs text-red-600">{errors.eventStart.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eventEnd">Event ends</Label>
                <Input id="eventEnd" type="datetime-local" {...register("eventEnd")} />
                {errors.eventEnd && <p className="text-xs text-red-600">{errors.eventEnd.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leaderboardVisibility">Leaderboard visibility</Label>
                <Select id="leaderboardVisibility" {...register("leaderboardVisibility")}>
                  <option value="hidden">Hidden</option>
                  <option value="visible">Visible</option>
                  <option value="frozen">Frozen</option>
                  <option value="published">Published</option>
                </Select>
                <p className="text-xs text-slate-500">
                  Use the Leaderboard page to change this with a confirmation step - it snapshots results.
                </p>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input
                  id="includeRound1ScoreInFinal"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  {...register("includeRound1ScoreInFinal")}
                />
                <Label htmlFor="includeRound1ScoreInFinal" className="cursor-pointer">
                  Include Round 1 score in the final leaderboard total
                </Label>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="prizeDetails">Prize details</Label>
                <Textarea id="prizeDetails" rows={4} {...register("prizeDetails")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Coordinators</CardTitle>
                <CardDescription>Contact people shown to participants.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", role: "", phone: "", email: "" })}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Add coordinator
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {fields.length === 0 && <p className="text-sm text-slate-500">No coordinators added yet.</p>}
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`coordinators.${index}.name`}>Name</Label>
                    <Input id={`coordinators.${index}.name`} {...register(`coordinators.${index}.name`)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`coordinators.${index}.role`}>Role</Label>
                    <Input id={`coordinators.${index}.role`} {...register(`coordinators.${index}.role`)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`coordinators.${index}.phone`}>Phone</Label>
                    <Input id={`coordinators.${index}.phone`} {...register(`coordinators.${index}.phone`)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`coordinators.${index}.email`}>Email</Label>
                    <Input id={`coordinators.${index}.email`} type="email" {...register(`coordinators.${index}.email`)} />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove coordinator" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                    </Button>
                  </div>
                  {errors.coordinators?.[index] && (
                    <p className="col-span-full text-xs text-red-600">
                      Check this coordinator&apos;s fields - all are required and email must be valid.
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => reset(toFormValues(event))} disabled={isSubmitting}>
              Reset
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
