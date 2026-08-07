"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalculatorIcon, Pause, Play, RefreshCw, RotateCcw, Square } from "lucide-react";
import { roundConfigUpdateSchema, type RoundConfigUpdateInput } from "@tech-survivor/shared";
import type { RoundConfig, RoundStatus } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { useEventStatus } from "@/lib/hooks/useEventStatus";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type RoundKey = "round1" | "round2";
type RoundAction = "start" | "pause" | "resume" | "end" | "reset";

const STATUS_BADGE: Record<RoundStatus, BadgeProps["variant"]> = {
  waiting: "secondary",
  live: "success",
  paused: "warning",
  completed: "info",
  locked: "destructive",
};

const ACTION_COPY: Record<RoundAction, { label: string; icon: typeof Play; title: string; description: string }> = {
  start: {
    label: "Start",
    icon: Play,
    title: "Start this round?",
    description: "Participants will immediately be able to begin. The timing window is fixed the first time a round starts.",
  },
  pause: {
    label: "Pause",
    icon: Pause,
    title: "Pause this round?",
    description: "All participants currently attempting this round will be blocked from further action until resumed.",
  },
  resume: {
    label: "Resume",
    icon: RotateCcw,
    title: "Resume this round?",
    description: "Participants will be able to continue where they left off. Note: the round's end time is not extended for time spent paused.",
  },
  end: {
    label: "End",
    icon: Square,
    title: "End this round?",
    description: "This closes the round for every participant immediately and cannot be undone from this screen.",
  },
  reset: {
    label: "Reset",
    icon: RefreshCw,
    title: "Reset this round for a new batch?",
    description:
      "This immediately cuts off anyone currently in this round and clears its start/end time back to a blank slate. Use this between batches/sessions - already-submitted results are not affected. Afterward, click Start to open a fresh full-duration window.",
  },
};

function availableActions(status: RoundStatus): RoundAction[] {
  switch (status) {
    case "waiting":
      return ["start"];
    case "live":
      return ["pause", "end", "reset"];
    case "paused":
      return ["resume", "end", "reset"];
    case "completed":
      return ["reset"];
    default:
      return [];
  }
}

function RoundSettingsForm({ round, roundKey }: { round: RoundConfig; roundKey: RoundKey }) {
  const queryClient = useQueryClient();
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoundConfigUpdateInput>({
    resolver: zodResolver(roundConfigUpdateSchema),
    defaultValues: {
      name: round.name,
      durationMinutes: round.durationMinutes,
      qualificationPercentage: round.qualificationPercentage,
      qualificationMinimumScore: round.qualificationMinimumScore,
      instructions: round.instructions,
      settings: { ...round.settings },
    },
  });

  useEffect(() => {
    reset({
      name: round.name,
      durationMinutes: round.durationMinutes,
      qualificationPercentage: round.qualificationPercentage,
      qualificationMinimumScore: round.qualificationMinimumScore,
      instructions: round.instructions,
      settings: { ...round.settings },
    });
  }, [round, reset]);

  const mutation = useMutation({
    mutationFn: (values: RoundConfigUpdateInput) => apiClient.patch<RoundConfig>(`/admin/rounds/${roundKey}`, values),
    onSuccess: () => {
      toast.success("Round settings saved");
      queryClient.invalidateQueries({ queryKey: ["event", "status"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Could not save round settings"),
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${roundKey}-name`}>Round name</Label>
          <Input id={`${roundKey}-name`} {...register("name")} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${roundKey}-duration`}>Duration (minutes)</Label>
          <Input id={`${roundKey}-duration`} type="number" {...register("durationMinutes", { valueAsNumber: true })} />
          {errors.durationMinutes && <p className="text-xs text-red-600">{errors.durationMinutes.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${roundKey}-warnings`}>Warnings before disqualification</Label>
          <Input
            id={`${roundKey}-warnings`}
            type="number"
            {...register("settings.warningsBeforeDisqualification", { valueAsNumber: true })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${roundKey}-qp`}>Qualification percentage</Label>
          <Input id={`${roundKey}-qp`} type="number" {...register("qualificationPercentage", { valueAsNumber: true })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${roundKey}-qms`}>Qualification minimum score</Label>
          <Input id={`${roundKey}-qms`} type="number" {...register("qualificationMinimumScore", { valueAsNumber: true })} />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <input
            id={`${roundKey}-review`}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            {...register("settings.allowAnswerReview")}
          />
          <Label htmlFor={`${roundKey}-review`} className="cursor-pointer">Allow answer review after submission</Label>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${roundKey}-instructions`}>Instructions</Label>
        <Textarea id={`${roundKey}-instructions`} rows={3} {...register("instructions")} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save round settings"}
        </Button>
      </div>
    </form>
  );
}

function RoundPanel({ roundKey, title, round }: { roundKey: RoundKey; title: string; round: RoundConfig }) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<RoundAction | null>(null);
  const [qualificationResult, setQualificationResult] = useState<{
    qualified: number;
    notQualified: number;
    pending: number;
    total: number;
  } | null>(null);
  const [confirmingCalculate, setConfirmingCalculate] = useState(false);

  const actionMutation = useMutation({
    mutationFn: (action: RoundAction) => apiClient.post<RoundConfig>(`/admin/rounds/${roundKey}/${action}`),
    onSuccess: (_, action) => {
      toast.success(action === "reset" ? "Round reset" : `Round ${ACTION_COPY[action].label.toLowerCase()}ed`);
      queryClient.invalidateQueries({ queryKey: ["event", "status"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Round action failed"),
    onSettled: () => setPendingAction(null),
  });

  const calculateMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ qualified: number; notQualified: number; pending: number; total: number }>(
        "/admin/rounds/round1/calculate-qualification",
      ),
    onSuccess: (result) => {
      setQualificationResult(result);
      toast.success("Qualification calculated");
      queryClient.invalidateQueries({ queryKey: ["admin", "participants"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Could not calculate qualification"),
    onSettled: () => setConfirmingCalculate(false),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{round.type === "mcq" ? "Multiple choice qualification round" : "Live coding round"}</CardDescription>
        </div>
        <Badge variant={STATUS_BADGE[round.status]}>{round.status}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {availableActions(round.status).map((action) => {
            const Icon = ACTION_COPY[action].icon;
            return (
              <Button
                key={action}
                variant={
                  action === "end" || action === "reset"
                    ? "destructive"
                    : action === "start" || action === "resume"
                      ? "primary"
                      : "outline"
                }
                onClick={() => setPendingAction(action)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" /> {ACTION_COPY[action].label}
              </Button>
            );
          })}
          {availableActions(round.status).length === 0 && (
            <p className="text-sm text-slate-500">No actions available while this round is {round.status}.</p>
          )}
          {roundKey === "round1" && (
            <Button variant="outline" onClick={() => setConfirmingCalculate(true)} disabled={calculateMutation.isPending}>
              <CalculatorIcon className="h-4 w-4" aria-hidden="true" /> Calculate Qualification
            </Button>
          )}
        </div>

        {qualificationResult && (
          <Alert variant="info" title="Qualification calculated">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <span>Qualified: <strong>{qualificationResult.qualified}</strong></span>
              <span>Not qualified: <strong>{qualificationResult.notQualified}</strong></span>
              <span>Pending: <strong>{qualificationResult.pending}</strong></span>
              <span>Total: <strong>{qualificationResult.total}</strong></span>
            </div>
          </Alert>
        )}

        <RoundSettingsForm round={round} roundKey={roundKey} />
      </CardContent>

      {pendingAction && (
        <ConfirmDialog
          open
          title={ACTION_COPY[pendingAction].title}
          description={ACTION_COPY[pendingAction].description}
          confirmLabel={ACTION_COPY[pendingAction].label}
          destructive={pendingAction === "end" || pendingAction === "reset"}
          loading={actionMutation.isPending}
          onConfirm={() => actionMutation.mutate(pendingAction)}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {confirmingCalculate && (
        <ConfirmDialog
          open
          title="Calculate Round 1 qualification?"
          description="This finalizes any expired in-progress attempts and recomputes qualified/not-qualified/pending counts for every participant."
          confirmLabel="Calculate"
          loading={calculateMutation.isPending}
          onConfirm={() => calculateMutation.mutate()}
          onCancel={() => setConfirmingCalculate(false)}
        />
      )}
    </Card>
  );
}

export default function RoundControlPage() {
  const eventStatus = useEventStatus();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Round Control</h1>
        <p className="text-sm text-slate-500">Start, pause, resume, or end each round, and edit its settings.</p>
      </div>

      {eventStatus.isError && <Alert variant="error">Could not load round status.</Alert>}
      {eventStatus.isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {eventStatus.data && (
        <div className="flex flex-col gap-6">
          <RoundPanel roundKey="round1" title={eventStatus.data.round1.config.name || "Round 1"} round={eventStatus.data.round1.config} />
          <RoundPanel roundKey="round2" title={eventStatus.data.round2.config.name || "Round 2"} round={eventStatus.data.round2.config} />
        </div>
      )}
    </div>
  );
}
