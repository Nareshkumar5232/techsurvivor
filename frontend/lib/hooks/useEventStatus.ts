"use client";

import { useQuery } from "@tanstack/react-query";
import type { Announcement, EventConfig, EventStatusView, LeaderboardEntry, MCQResultView } from "@tech-survivor/types";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";

export function usePublicEvent() {
  return useQuery({
    queryKey: ["event"],
    queryFn: () => apiClient.get<EventConfig>("/event"),
  });
}

export function useEventStatus() {
  const { firebaseUser } = useAuth();
  return useQuery({
    queryKey: ["event", "status"],
    queryFn: () => apiClient.get<EventStatusView>("/event/status"),
    enabled: Boolean(firebaseUser),
    refetchInterval: 15_000,
  });
}

/** Round 1 score/percentage, used to show unlock progress toward Round 2 while locked.
 *  Only call with enabled=true once a Round 1 attempt has actually been submitted. */
export function useRound1Result(enabled: boolean) {
  const { firebaseUser } = useAuth();
  return useQuery({
    queryKey: ["round1", "result"],
    queryFn: () => apiClient.get<MCQResultView>("/round1/result"),
    enabled: Boolean(firebaseUser) && enabled,
    retry: false,
  });
}

export function useAnnouncements() {
  const { firebaseUser } = useAuth();
  return useQuery({
    queryKey: ["event", "announcements"],
    queryFn: () => apiClient.get<Announcement[]>("/event/announcements"),
    enabled: Boolean(firebaseUser),
    refetchInterval: 60_000,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiClient.get<{ entries: LeaderboardEntry[]; isFrozen: boolean }>("/leaderboard"),
    refetchInterval: 20_000,
  });
}
