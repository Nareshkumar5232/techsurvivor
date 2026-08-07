"use client";

import type { CodingProblemPublic, SubmissionSummary } from "@tech-survivor/types";
import { DifficultyBadge } from "@/components/round2/difficulty-badge";
import { VerdictBadge } from "@/components/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ProblemPanelTab = "problem" | "history";

function Section({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
        <span className="h-px flex-1 bg-gradient-to-r from-blue-500/40 to-transparent" />
        {title}
        <span className="h-px flex-1 bg-gradient-to-l from-blue-500/40 to-transparent" />
      </h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{body}</p>
    </div>
  );
}

export function ProblemPanel({
  problem,
  history,
  historyLoading,
  tab,
  onTabChange,
}: {
  problem: CodingProblemPublic;
  history: SubmissionSummary[] | undefined;
  historyLoading: boolean;
  tab: ProblemPanelTab;
  onTabChange: (tab: ProblemPanelTab) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-navy-900">
      <div role="tablist" aria-label="Problem panel" className="flex gap-0 border-b border-navy-700/80 bg-navy-950/60 px-2 pt-2">
        {(["problem", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => onTabChange(t)}
            className={cn(
              "relative rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200",
              tab === t
                ? "bg-navy-900 text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-blue-500 after:to-indigo-500"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
            )}
          >
            {t === "problem" ? "Problem" : "Submission History"}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:thin] [scrollbar-color:#1b2646_transparent]">
        {tab === "problem" ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/5 bg-gradient-to-br from-navy-800/60 to-navy-900/60 p-4 shadow-lg">
              <div className="flex flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={problem.difficulty} />
                <Badge variant="secondary" className="border-amber-400/30 bg-amber-500/10 text-amber-300">{problem.points} pts</Badge>
                <Badge variant="secondary" className="border-blue-400/20 bg-blue-500/10 text-blue-300">{problem.timeLimit}s / {problem.memoryLimit}MB</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">{problem.title}</h2>
            </div>

            <Section title="Description" body={problem.description} />
            <Section title="Input Format" body={problem.inputFormat} />
            <Section title="Output Format" body={problem.outputFormat} />
            <Section title="Constraints" body={problem.constraints} />

            {problem.samples.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  <span className="h-px flex-1 bg-gradient-to-r from-emerald-500/40 to-transparent" />
                  Sample Test Cases
                  <span className="h-px flex-1 bg-gradient-to-l from-emerald-500/40 to-transparent" />
                </h3>
                <div className="space-y-3">
                  {problem.samples.map((sample, idx) => (
                    <div key={sample.id} className="overflow-hidden rounded-xl border border-white/8 bg-navy-800/50 shadow-md">
                      <div className="flex items-center justify-between border-b border-white/5 bg-white/3 px-4 py-2">
                        <p className="text-xs font-bold text-slate-300">Sample {idx + 1}</p>
                      </div>
                      <div className="grid gap-0 sm:grid-cols-2">
                        <div className="border-b border-white/5 p-3 sm:border-b-0 sm:border-r">
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Input</p>
                          <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed text-green-300 ring-1 ring-white/5">{sample.input}</pre>
                        </div>
                        <div className="p-3">
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Expected Output</p>
                          <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed text-blue-300 ring-1 ring-white/5">{sample.expectedOutput}</pre>
                        </div>
                      </div>
                      {sample.explanation && (
                        <div className="border-t border-white/5 bg-white/2 px-4 py-2.5">
                          <p className="text-xs leading-relaxed text-slate-300">
                            <span className="font-bold text-amber-400">Explanation: </span>
                            {sample.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {historyLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-navy-800/50 p-4 text-sm text-slate-300">
                <Spinner className="h-4 w-4 text-blue-400" /> Loading history...
              </div>
            ) : !history || history.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-navy-800/30 py-10 text-center">
                <div className="text-3xl opacity-40">📋</div>
                <p className="text-sm font-medium text-slate-400">No submissions yet for this problem.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-navy-950/60 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-3 font-semibold">Time</th>
                      <th className="px-3 py-3 font-semibold">Kind</th>
                      <th className="px-3 py-3 font-semibold">Lang</th>
                      <th className="px-3 py-3 font-semibold">Verdict</th>
                      <th className="px-3 py-3 font-semibold">Score</th>
                      <th className="px-3 py-3 font-semibold">Tests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {history.map((s) => (
                      <tr key={s.id} className="bg-navy-900/40 text-slate-200 transition-colors hover:bg-navy-800/60">
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">{new Date(s.submittedAt).toLocaleString()}</td>
                        <td className="px-3 py-3 capitalize text-slate-300">{s.kind}</td>
                        <td className="px-3 py-3 font-mono text-xs uppercase text-slate-300">{s.language}</td>
                        <td className="px-3 py-3">
                          <VerdictBadge verdict={s.verdict} />
                        </td>
                        <td className="px-3 py-3 font-semibold text-white">{s.score}</td>
                        <td className="px-3 py-3 text-slate-400">
                          {s.passedTests}/{s.totalTests}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
