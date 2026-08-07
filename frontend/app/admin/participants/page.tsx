"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ShieldOff, ShieldCheck, UserX, UserCheck } from "lucide-react";
import type { PatchParticipantAdminInput } from "@tech-survivor/shared";
import type { UserProfile, UserStatus } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type Participant = UserProfile & { round1Qualified: boolean | null };

const STATUS_BADGE: Record<UserStatus, BadgeProps["variant"]> = {
  active: "success",
  suspended: "warning",
  disqualified: "destructive",
};

type PendingAction =
  | { kind: "disqualify"; participant: Participant }
  | { kind: "restore"; participant: Participant }
  | { kind: "suspend"; participant: Participant }
  | { kind: "activate"; participant: Participant };

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function ParticipantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "participants", statusFilter, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const qs = params.toString();
      return apiClient.get<Participant[]>(`/admin/participants${qs ? `?${qs}` : ""}`);
    },
  });

  const mutation = useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: PatchParticipantAdminInput }) =>
      apiClient.patch<Participant>(`/admin/participants/${userId}`, input),
    onSuccess: () => {
      toast.success("Participant updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "participants"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Could not update participant");
    },
    onSettled: () => {
      setPending(null);
      setReason("");
    },
  });

  function confirmAction() {
    if (!pending) return;
    const { kind, participant } = pending;
    if (kind === "disqualify") {
      mutation.mutate({ userId: participant.uid, input: { disqualified: true, disqualificationReason: reason.trim() || undefined } });
    } else if (kind === "restore") {
      mutation.mutate({ userId: participant.uid, input: { disqualified: false } });
    } else if (kind === "suspend") {
      mutation.mutate({ userId: participant.uid, input: { status: "suspended" } });
    } else {
      mutation.mutate({ userId: participant.uid, input: { status: "active" } });
    }
  }

  const dialogCopy: Record<PendingAction["kind"], { title: string; confirmLabel: string; destructive: boolean }> = {
    disqualify: { title: "Disqualify participant?", confirmLabel: "Disqualify", destructive: true },
    restore: { title: "Restore participant?", confirmLabel: "Restore", destructive: false },
    suspend: { title: "Suspend participant?", confirmLabel: "Suspend", destructive: true },
    activate: { title: "Reactivate participant?", confirmLabel: "Activate", destructive: false },
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Participants</h1>
        <p className="text-sm text-slate-500">Search, filter, and manage participant accounts.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              id="search"
              placeholder="Name, email, or roll number"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-56">
          <Label htmlFor="statusFilter">Status</Label>
          <Select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | UserStatus)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="disqualified">Disqualified</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </div>

      {query.isError && <Alert variant="error">Could not load participants.</Alert>}
      {query.isLoading && <Skeleton className="h-96 w-full" />}

      {query.data && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Institution</th>
                  <th scope="col" className="px-4 py-3">Roll Number</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Round 1</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      No participants match these filters.
                    </td>
                  </tr>
                )}
                {query.data.map((p) => (
                  <tr key={p.uid}>
                    <td className="px-4 py-3 font-medium text-navy-900">{p.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.email}</td>
                    <td className="px-4 py-3 text-slate-600">{p.institution}</td>
                    <td className="px-4 py-3 text-slate-600">{p.rollNumber}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[p.status]}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {p.round1Qualified === null ? (
                        <span className="text-slate-400">Not attempted</span>
                      ) : p.round1Qualified ? (
                        <Badge variant="success">Qualified</Badge>
                      ) : (
                        <Badge variant="destructive">Not qualified</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {p.disqualified ? (
                          <Button size="sm" variant="outline" onClick={() => setPending({ kind: "restore", participant: p })}>
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Restore
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="destructive" onClick={() => setPending({ kind: "disqualify", participant: p })}>
                              <UserX className="h-3.5 w-3.5" aria-hidden="true" /> Disqualify
                            </Button>
                            {p.status === "suspended" ? (
                              <Button size="sm" variant="outline" onClick={() => setPending({ kind: "activate", participant: p })}>
                                <UserCheck className="h-3.5 w-3.5" aria-hidden="true" /> Activate
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setPending({ kind: "suspend", participant: p })}>
                                <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" /> Suspend
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {pending && (
        <ConfirmDialog
          open
          title={dialogCopy[pending.kind].title}
          description={`This affects ${pending.participant.fullName} (${pending.participant.email}).`}
          confirmLabel={dialogCopy[pending.kind].confirmLabel}
          destructive={dialogCopy[pending.kind].destructive}
          loading={mutation.isPending}
          onConfirm={confirmAction}
          onCancel={() => {
            setPending(null);
            setReason("");
          }}
        >
          {pending.kind === "disqualify" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="disqualificationReason">Reason (optional, visible in audit log)</Label>
              <Textarea
                id="disqualificationReason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Multiple tab-switch violations during Round 1"
              />
            </div>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
