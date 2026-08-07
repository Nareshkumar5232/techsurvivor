"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { MCQAttempt } from "@tech-survivor/types";
import { apiClient } from "@/lib/apiClient";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ResultRow = MCQAttempt & { fullName: string; institution: string; rollNumber: string };

type SortKey = "fullName" | "rollNumber" | "institution" | "score" | "percentage" | "correctCount" | "incorrectCount" | "unansweredCount";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "fullName", label: "Name" },
  { key: "rollNumber", label: "Roll Number" },
  { key: "institution", label: "Institution" },
  { key: "score", label: "Score" },
  { key: "percentage", label: "Percentage" },
  { key: "correctCount", label: "Correct" },
  { key: "incorrectCount", label: "Incorrect" },
  { key: "unansweredCount", label: "Unanswered" },
];

function useRound1Results(view: "all" | "qualified") {
  return useQuery({
    queryKey: ["admin", "round1", view],
    queryFn: () => apiClient.get<ResultRow[]>(`/admin/round1/${view === "all" ? "results" : "qualified"}`),
  });
}

export default function Round1ResultsPage() {
  const [view, setView] = useState<"all" | "qualified">("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const query = useRound1Results(view);

  const sorted = useMemo(() => {
    if (!query.data) return [];
    const rows = [...query.data];
    const direction = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortKey) {
        case "fullName":
        case "rollNumber":
        case "institution":
          return a[sortKey].localeCompare(b[sortKey]) * direction;
        case "score":
        case "percentage":
        case "correctCount":
        case "incorrectCount":
        case "unansweredCount": {
          const av = a[sortKey] ?? -Infinity;
          const bv = b[sortKey] ?? -Infinity;
          return (av - bv) * direction;
        }
        default:
          return 0;
      }
    });
    return rows;
  }, [query.data, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Round 1 Results</h1>
          <p className="text-sm text-slate-500">Every finalized and in-progress MCQ attempt.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "all" ? "primary" : "outline"} size="sm" onClick={() => setView("all")}>
            All results
          </Button>
          <Button variant={view === "qualified" ? "primary" : "outline"} size="sm" onClick={() => setView("qualified")}>
            Qualified only
          </Button>
        </div>
      </div>

      {query.isError && <Alert variant="error">Could not load Round 1 results.</Alert>}
      {query.isLoading && <Skeleton className="h-96 w-full" />}

      {query.data && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} scope="col" className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="flex items-center gap-1 hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      >
                        {col.label}
                        {sortKey === col.key ? (
                          sortDir === "asc" ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3">Qualified</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length + 2} className="px-4 py-6 text-center text-slate-500">
                      No results yet.
                    </td>
                  </tr>
                )}
                {sorted.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-navy-900">{row.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.rollNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{row.institution}</td>
                    <td className="px-4 py-3 text-slate-600">{row.score ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{row.percentage !== null ? `${row.percentage}%` : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{row.correctCount ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{row.incorrectCount ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{row.unansweredCount ?? "—"}</td>
                    <td className="px-4 py-3">
                      {row.qualified === null ? (
                        <span className="text-slate-400">Pending</span>
                      ) : row.qualified ? (
                        <Badge variant="success">Qualified</Badge>
                      ) : (
                        <Badge variant="destructive">Not qualified</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{row.status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
