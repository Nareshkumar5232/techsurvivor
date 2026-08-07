"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Code2, RefreshCw } from "lucide-react";
import type { CodingProblem, Submission, SubmissionSummary, Verdict } from "@tech-survivor/types";
import { LANGUAGE_LABELS } from "@tech-survivor/config";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge } from "@/components/verdict-badge";
import { Modal } from "@/components/admin/modal";

const VERDICTS: Verdict[] = [
  "queued",
  "processing",
  "accepted",
  "wrong_answer",
  "compilation_error",
  "runtime_error",
  "time_limit_exceeded",
  "memory_limit_exceeded",
  "output_limit_exceeded",
  "internal_error",
];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function useProblemsLookup() {
  return useQuery({
    queryKey: ["admin", "problems"],
    queryFn: () => apiClient.get<CodingProblem[]>("/admin/problems"),
  });
}

export default function SubmissionsPage() {
  const [userIdInput, setUserIdInput] = useState("");
  const [problemId, setProblemId] = useState("");
  const [verdict, setVerdict] = useState("");
  const [sourceView, setSourceView] = useState<Submission | null>(null);
  const userId = useDebouncedValue(userIdInput, 400);
  const queryClient = useQueryClient();

  const problems = useProblemsLookup();
  const problemTitleById = new Map((problems.data ?? []).map((p) => [p.id, p.title]));

  const query = useQuery({
    queryKey: ["admin", "submissions", userId, problemId, verdict],
    queryFn: () => {
      const params = new URLSearchParams();
      if (userId.trim()) params.set("userId", userId.trim());
      if (problemId) params.set("problemId", problemId);
      if (verdict) params.set("verdict", verdict);
      const qs = params.toString();
      return apiClient.get<Submission[]>(`/admin/submissions${qs ? `?${qs}` : ""}`);
    },
  });

  const reevaluateMutation = useMutation({
    mutationFn: (submissionId: string) => apiClient.post<SubmissionSummary>(`/admin/submissions/${submissionId}/reevaluate`),
    onSuccess: (summary) => {
      toast.success(`Re-evaluated: ${summary.verdict.replace(/_/g, " ")} (${summary.passedTests}/${summary.totalTests})`);
      queryClient.setQueryData<Submission[] | undefined>(["admin", "submissions", userId, problemId, verdict], (old) =>
        old?.map((s) => (s.id === summary.id ? { ...s, ...summary } : s)),
      );
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Re-evaluation failed"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Submissions</h1>
        <p className="text-sm text-slate-500">Monitor Round 2 code submissions and re-run judging when needed.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="userIdFilter">User ID</Label>
          <Input
            id="userIdFilter"
            placeholder="Exact user ID (uid)"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="problemFilter">Problem</Label>
          <Select id="problemFilter" value={problemId} onChange={(e) => setProblemId(e.target.value)}>
            <option value="">All problems</option>
            {(problems.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="verdictFilter">Verdict</Label>
          <Select id="verdictFilter" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
            <option value="">All verdicts</option>
            {VERDICTS.map((v) => (
              <option key={v} value={v}>{v.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </div>
      </div>

      {query.isError && <Alert variant="error">Could not load submissions.</Alert>}
      {query.isLoading && <Skeleton className="h-96 w-full" />}

      {query.data && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">User</th>
                  <th scope="col" className="px-4 py-3">Problem</th>
                  <th scope="col" className="px-4 py-3">Language</th>
                  <th scope="col" className="px-4 py-3">Kind</th>
                  <th scope="col" className="px-4 py-3">Verdict</th>
                  <th scope="col" className="px-4 py-3">Passed</th>
                  <th scope="col" className="px-4 py-3">Score</th>
                  <th scope="col" className="px-4 py-3">Submitted</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500">No submissions match these filters.</td>
                  </tr>
                )}
                {query.data.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.userId}</td>
                    <td className="px-4 py-3 text-slate-600">{problemTitleById.get(s.problemId) ?? s.problemId}</td>
                    <td className="px-4 py-3 text-slate-600">{LANGUAGE_LABELS[s.language]}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{s.kind}</td>
                    <td className="px-4 py-3"><VerdictBadge verdict={s.verdict} /></td>
                    <td className="px-4 py-3 text-slate-600">{s.passedTests}/{s.totalTests}</td>
                    <td className="px-4 py-3 text-slate-600">{s.score}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(s.submittedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSourceView(s)}>
                          <Code2 className="h-3.5 w-3.5" aria-hidden="true" /> Source
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reevaluateMutation.mutate(s.id)}
                          disabled={reevaluateMutation.isPending}
                        >
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Re-evaluate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {sourceView && (
        <Modal
          open
          onClose={() => setSourceView(null)}
          title={`Source - ${LANGUAGE_LABELS[sourceView.language]}`}
          widthClassName="max-w-3xl"
        >
          <pre className="max-h-[70vh] overflow-auto rounded-md bg-navy-900 p-4 text-xs text-slate-100">
            {sourceView.sourceCode}
          </pre>
        </Modal>
      )}
    </div>
  );
}
