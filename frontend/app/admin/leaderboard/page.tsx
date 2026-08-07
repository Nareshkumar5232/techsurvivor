"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LeaderboardEntry, LeaderboardVisibility, UserProfile } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { usePublicEvent } from "@/lib/hooks/useEventStatus";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type Participant = UserProfile & { round1Qualified: boolean | null };

const VISIBILITY_COPY: Record<LeaderboardVisibility, string> = {
  hidden: "Participants see nothing.",
  visible: "Participants see the live leaderboard, updated in real time.",
  frozen: "Participants see a snapshot taken at the moment of freezing; admins keep seeing live data here.",
  published: "Participants see a final snapshot taken at the moment of publishing, presented as results.",
};

function useAdminLeaderboard() {
  return useQuery({
    queryKey: ["admin", "leaderboard"],
    queryFn: () => apiClient.get<LeaderboardEntry[]>("/admin/leaderboard"),
    refetchInterval: 15_000,
  });
}

function useAdminParticipantsLookup() {
  return useQuery({
    queryKey: ["admin", "participants", "all", ""],
    queryFn: () => apiClient.get<Participant[]>("/admin/participants"),
  });
}

export default function AdminLeaderboardPage() {
  const leaderboard = useAdminLeaderboard();
  const participants = useAdminParticipantsLookup();
  const event = usePublicEvent();
  const queryClient = useQueryClient();

  const [pendingVisibility, setPendingVisibility] = useState<LeaderboardVisibility | null>(null);

  const disqualifiedIds = new Set((participants.data ?? []).filter((p) => p.disqualified).map((p) => p.uid));

  const mutation = useMutation({
    mutationFn: (visibility: LeaderboardVisibility) =>
      apiClient.patch<{ visibility: LeaderboardVisibility }>("/admin/leaderboard/visibility", { visibility }),
    onSuccess: (result) => {
      toast.success(`Leaderboard visibility set to "${result.visibility}"`);
      queryClient.invalidateQueries({ queryKey: ["event"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Could not update visibility"),
    onSettled: () => setPendingVisibility(null),
  });

  const currentVisibility = event.data?.leaderboardVisibility;
  const needsSnapshotWarning = pendingVisibility === "frozen" || pendingVisibility === "published";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Leaderboard</h1>
        <p className="text-sm text-slate-500">Always shows the live, unfiltered leaderboard, including disqualified participants.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participant Visibility</CardTitle>
          <CardDescription>Controls what participants see - this admin view is always live.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visibility">Current setting</Label>
              <Select
                id="visibility"
                value={currentVisibility ?? ""}
                onChange={(e) => setPendingVisibility(e.target.value as LeaderboardVisibility)}
                disabled={!currentVisibility}
              >
                <option value="hidden">Hidden</option>
                <option value="visible">Visible</option>
                <option value="frozen">Frozen</option>
                <option value="published">Published</option>
              </Select>
            </div>
          </div>
          <ul className="flex flex-col gap-1 text-xs text-slate-500">
            {(Object.entries(VISIBILITY_COPY) as [LeaderboardVisibility, string][]).map(([key, desc]) => (
              <li key={key}>
                <span className="font-semibold capitalize text-slate-700">{key}:</span> {desc}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {leaderboard.isError && <Alert variant="error">Could not load leaderboard.</Alert>}
      {leaderboard.isLoading && <Skeleton className="h-96 w-full" />}

      {leaderboard.data && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Rank</th>
                  <th scope="col" className="px-4 py-3">Participant</th>
                  <th scope="col" className="px-4 py-3">Institution</th>
                  <th scope="col" className="px-4 py-3">Easy</th>
                  <th scope="col" className="px-4 py-3">Medium</th>
                  <th scope="col" className="px-4 py-3">Hard</th>
                  <th scope="col" className="px-4 py-3">Round 1</th>
                  <th scope="col" className="px-4 py-3">Total</th>
                  <th scope="col" className="px-4 py-3">Accepted</th>
                  <th scope="col" className="px-4 py-3">Penalty</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.data.map((entry) => {
                  const disqualified = disqualifiedIds.has(entry.userId);
                  return (
                    <tr key={entry.userId} className={disqualified ? "bg-red-50" : undefined}>
                      <td className="px-4 py-3 font-medium text-navy-900">#{entry.rank}</td>
                      <td className="px-4 py-3 text-navy-900">{entry.participantName}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.institution}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {entry.easyScore} {entry.easyAccepted && <Badge variant="success">AC</Badge>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {entry.mediumScore} {entry.mediumAccepted && <Badge variant="success">AC</Badge>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {entry.hardScore} {entry.hardAccepted && <Badge variant="success">AC</Badge>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{entry.round1Score}</td>
                      <td className="px-4 py-3 font-semibold text-navy-900">{entry.totalScore}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.acceptedProblemCount}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.penaltyTime}m</td>
                      <td className="px-4 py-3">
                        {disqualified ? <Badge variant="destructive">Disqualified</Badge> : <Badge variant="success">Active</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {pendingVisibility && (
        <ConfirmDialog
          open
          title={`Change leaderboard visibility to "${pendingVisibility}"?`}
          description={
            needsSnapshotWarning
              ? `${VISIBILITY_COPY[pendingVisibility]} This captures a snapshot of the live leaderboard right now - make sure results are final before confirming.`
              : VISIBILITY_COPY[pendingVisibility]
          }
          confirmLabel="Change visibility"
          destructive={needsSnapshotWarning}
          loading={mutation.isPending}
          onConfirm={() => mutation.mutate(pendingVisibility)}
          onCancel={() => setPendingVisibility(null)}
        />
      )}
    </div>
  );
}
