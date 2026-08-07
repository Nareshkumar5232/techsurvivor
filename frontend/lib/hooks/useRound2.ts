"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CodingProblemPublic, RunResult, SubmissionSummary, SupportedLanguage } from "@tech-survivor/types";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";

/** Shared query key so the problem list page and the workspace page (with its problem
 *  tabs) reuse the same cached list instead of each issuing their own request. */
export const ROUND2_PROBLEMS_KEY = ["round2", "problems"] as const;

export function useRound2Problems(enabled = true) {
  const { firebaseUser } = useAuth();
  return useQuery({
    queryKey: ROUND2_PROBLEMS_KEY,
    queryFn: () => apiClient.get<CodingProblemPublic[]>("/round2/problems"),
    enabled: enabled && Boolean(firebaseUser),
  });
}

interface SavedCodeResponse {
  language: SupportedLanguage;
  sourceCode: string;
}

export function useSavedCode(problemId: string, language: SupportedLanguage | null, enabled = true) {
  const { firebaseUser } = useAuth();
  return useQuery({
    queryKey: ["round2", "code", problemId, language],
    queryFn: () =>
      apiClient.get<SavedCodeResponse>(
        `/round2/code/${encodeURIComponent(problemId)}?language=${encodeURIComponent(language as string)}`,
      ),
    enabled: enabled && Boolean(firebaseUser) && language !== null,
  });
}

export function useSaveCode(problemId: string) {
  return useMutation({
    mutationFn: (input: { language: SupportedLanguage; sourceCode: string }) =>
      apiClient.put<null>(`/round2/code/${encodeURIComponent(problemId)}`, input),
  });
}

/** Unfiltered when problemId is omitted - used by the problem list page to derive best
 *  scores for all three problems in a single request instead of one call per card. */
export function useSubmissionHistory(problemId?: string) {
  const { firebaseUser } = useAuth();
  return useQuery({
    queryKey: ["submissions", "history", problemId ?? "all"],
    queryFn: () =>
      apiClient.get<SubmissionSummary[]>(
        problemId ? `/submissions/history?problemId=${encodeURIComponent(problemId)}` : "/submissions/history",
      ),
    enabled: Boolean(firebaseUser),
  });
}

export function useRunCode() {
  return useMutation({
    mutationFn: (input: {
      problemId: string;
      language: SupportedLanguage;
      sourceCode: string;
      customInput?: string;
    }) => apiClient.post<RunResult>("/submissions/run", input),
  });
}

export function useSubmitCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { problemId: string; language: SupportedLanguage; sourceCode: string }) =>
      apiClient.post<SubmissionSummary>("/submissions", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["submissions", "history"] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useFinishRound2() {
  return useMutation({
    mutationFn: () => apiClient.post<null>("/round2/finish"),
  });
}

/** Best (highest-scoring) "submit"-kind submission per problem, for showing "Best: x/points". */
export function bestSubmissionByProblem(
  history: SubmissionSummary[] | undefined,
  problemId: string,
): SubmissionSummary | undefined {
  return history
    ?.filter((s) => s.problemId === problemId && s.kind === "submit")
    .reduce<SubmissionSummary | undefined>((best, cur) => (!best || cur.score > best.score ? cur : best), undefined);
}
