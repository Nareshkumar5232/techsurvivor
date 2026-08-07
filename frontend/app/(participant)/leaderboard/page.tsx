"use client";

import { Trophy } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLeaderboard } from "@/lib/hooks/useEventStatus";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const leaderboardQuery = useLeaderboard();

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy-900">
          <Trophy className="h-6 w-6 text-amber-500" aria-hidden="true" />
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">Live standings across Round 1 and Round 2.</p>
      </div>

      {leaderboardQuery.isLoading && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {leaderboardQuery.isError && (
        <Alert variant="error" title="Could not load the leaderboard">
          Please refresh the page and try again.
        </Alert>
      )}

      {leaderboardQuery.data && (
        <>
          {leaderboardQuery.data.isFrozen && (
            <Alert variant="info">Leaderboard is currently frozen - showing the last published snapshot.</Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Standings</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardQuery.data.entries.length === 0 ? (
                <p className="text-sm text-slate-500">No results yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                        <th className="py-2 pr-3">Rank</th>
                        <th className="py-2 pr-3">Participant</th>
                        <th className="py-2 pr-3">Institution</th>
                        <th className="py-2 pr-3 text-right">Easy</th>
                        <th className="py-2 pr-3 text-right">Medium</th>
                        <th className="py-2 pr-3 text-right">Hard</th>
                        <th className="py-2 pr-3 text-right">Total</th>
                        <th className="py-2 pr-3 text-right">Accepted</th>
                        <th className="py-2 pr-3 text-right">Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardQuery.data.entries.map((entry) => {
                        const isMe = profile && entry.userId === profile.uid;
                        return (
                          <tr
                            key={entry.userId}
                            className={cn(
                              "border-b border-slate-100",
                              isMe ? "bg-blue-50 font-semibold text-brand-blue" : "text-slate-700",
                            )}
                          >
                            <td className="py-2 pr-3">#{entry.rank}</td>
                            <td className="py-2 pr-3">
                              {entry.participantName}
                              {isMe && (
                                <span className="ml-2 rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-semibold text-white">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3">{entry.institution}</td>
                            <td className="py-2 pr-3 text-right">{entry.easyScore}</td>
                            <td className="py-2 pr-3 text-right">{entry.mediumScore}</td>
                            <td className="py-2 pr-3 text-right">{entry.hardScore}</td>
                            <td className="py-2 pr-3 text-right">{entry.totalScore}</td>
                            <td className="py-2 pr-3 text-right">{entry.acceptedProblemCount}</td>
                            <td className="py-2 pr-3 text-right">{entry.penaltyTime}m</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
