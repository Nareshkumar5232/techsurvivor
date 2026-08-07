"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { RunResult, SubmissionSummary } from "@tech-survivor/types";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { VerdictBadge } from "@/components/verdict-badge";

function MetaRow({ runtime, memory }: { runtime: number | null; memory: number | null }) {
  if (runtime === null && memory === null) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {runtime !== null && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-300 ring-1 ring-blue-500/20">
          <span className="font-semibold">Runtime:</span> {runtime} ms
        </span>
      )}
      {memory !== null && (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-purple-300 ring-1 ring-purple-500/20">
          <span className="font-semibold">Memory:</span> {memory} KB
        </span>
      )}
    </div>
  );
}

function OutputBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed text-slate-100 ring-1 ring-white/5">{value}</pre>
    </div>
  );
}

export function OutputConsole({
  isPending,
  pendingLabel,
  kind,
  runResult,
  submitResult,
  problemPoints,
}: {
  isPending: boolean;
  pendingLabel?: string;
  kind: "run" | "submit" | null;
  runResult: RunResult | null;
  submitResult: SubmissionSummary | null;
  problemPoints: number;
}) {
  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Spinner className="h-4 w-4" />
        {pendingLabel ?? "Working..."}
      </div>
    );
  }

  if (kind === "run" && runResult) {
    if (runResult.verdict === "queued" || runResult.verdict === "processing") {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Spinner className="h-4 w-4" /> Compiler is processing...
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={runResult.verdict} />
          <MetaRow runtime={runResult.runtime} memory={runResult.memory} />
        </div>

        {runResult.sampleResults && runResult.sampleResults.length > 0 ? (
          <div className="space-y-2">
            {runResult.sampleResults.map((r, idx) => (
              <details key={r.testCaseId} className="overflow-hidden rounded-xl border border-white/8 bg-navy-800/50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/3">
                  <span className="flex items-center gap-2">
                    {r.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
                    )}
                    Sample {idx + 1}
                  </span>
                  <Badge variant={r.passed ? "success" : "destructive"}>{r.passed ? "Passed" : "Failed"}</Badge>
                </summary>
                <div className="grid gap-0 border-t border-white/5 text-xs sm:grid-cols-2">
                  <div className="border-b border-white/5 p-3 sm:border-b-0 sm:border-r">
                    <p className="mb-1.5 font-semibold uppercase tracking-wide text-slate-500">Your Output</p>
                    <pre className="overflow-x-auto rounded-lg bg-black/30 p-2 leading-relaxed text-slate-100 ring-1 ring-white/5">{r.actualOutput}</pre>
                  </div>
                  <div className="p-3">
                    <p className="mb-1.5 font-semibold uppercase tracking-wide text-slate-500">Expected Output</p>
                    <pre className="overflow-x-auto rounded-lg bg-black/30 p-2 leading-relaxed text-blue-200 ring-1 ring-white/5">{r.expectedOutput}</pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <>
            <OutputBlock label="Stdout" value={runResult.stdout} />
            <OutputBlock label="Stderr" value={runResult.stderr} />
            <OutputBlock label="Compiler Output" value={runResult.compilerOutput} />
          </>
        )}
      </div>
    );
  }

  if (kind === "submit" && submitResult) {
    if (submitResult.verdict === "queued" || submitResult.verdict === "processing") {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Spinner className="h-4 w-4" /> Compiler is processing...
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <VerdictBadge verdict={submitResult.verdict} />
          <span className="text-sm font-medium text-slate-200">
            Score: {submitResult.score}/{problemPoints}
          </span>
          <span className="text-sm text-slate-300">
            Passed {submitResult.passedTests}/{submitResult.totalTests} tests
          </span>
          <MetaRow runtime={submitResult.runtime} memory={submitResult.memory} />
        </div>
        <OutputBlock label="Compiler Output" value={submitResult.compilerOutput} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-navy-800/20 py-6 text-center">
      <div className="text-2xl opacity-30">⚡</div>
      <p className="text-xs font-medium text-slate-500">
        Run your code against sample tests, or submit for full evaluation.
      </p>
    </div>
  );
}
