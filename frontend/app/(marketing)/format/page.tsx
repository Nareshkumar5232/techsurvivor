import { Clock, Code2, ListChecks, RotateCcw } from "lucide-react";
import {
  ROUND1_QUESTION_COUNT,
  ROUND1_OPTIONS_PER_QUESTION,
  ROUND1_QUALIFICATION_MIN_SCORE,
  ROUND1_MAX_SCORE,
  ROUND2_PROBLEM_COUNT,
  ROUND2_DEFAULT_POINTS,
} from "@tech-survivor/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FormatPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Event format</h1>
      <p className="mt-3 text-slate-600">
        Tech Survivor runs in two sequential rounds. You must qualify in Round 1 to unlock Round 2.
      </p>

      <div className="mt-10 space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-brand-blue">
                <ListChecks className="h-5 w-5" aria-hidden="true" />
              </span>
              <CardTitle>Round 1 — MCQ Qualifier</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-navy-900">{ROUND1_QUESTION_COUNT} questions</span>,
                each with {ROUND1_OPTIONS_PER_QUESTION} options and exactly one correct answer, worth 1
                mark each.
              </li>
              <li>
                <span className="font-semibold text-navy-900">No negative marking by default</span> —
                the event organizers may configure this differently; check announcements on the day.
              </li>
              <li>
                You need at least{" "}
                <span className="font-semibold text-navy-900">
                  {ROUND1_QUALIFICATION_MIN_SCORE}/{ROUND1_MAX_SCORE}
                </span>{" "}
                to qualify for Round 2.
              </li>
              <li className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                You get <span className="font-semibold text-navy-900">one attempt</span> — there is no
                retake.
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                The round is timed. If your timer runs out, whatever you&apos;ve answered so far is
                auto-submitted.
              </li>
              <li>Refreshing or closing the tab does not reset your timer or lose your answers — both are tracked server-side.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-brand-purple">
                <Code2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <CardTitle>Round 2 — Live Coding</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                Exactly <span className="font-semibold text-navy-900">{ROUND2_PROBLEM_COUNT} problems</span>,
                one of each difficulty:
              </li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success">Easy — {ROUND2_DEFAULT_POINTS.easy} pts</Badge>
              <Badge variant="warning">Medium — {ROUND2_DEFAULT_POINTS.medium} pts</Badge>
              <Badge variant="destructive">Hard — {ROUND2_DEFAULT_POINTS.hard} pts</Badge>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                A split-screen workspace: problem statement and constraints on one side, a
                Monaco-based code editor on the other.
              </li>
              <li>
                Your code compiles and runs against real test cases on a hosted Judge0 execution
                backend — the same engine, the same limits, every time.
              </li>
              <li>
                <span className="font-semibold text-navy-900">Multiple submissions are allowed</span> per
                problem. Only your best-scoring submission per problem counts toward your final score.
              </li>
              <li>
                Each hidden test case that passes contributes partial credit — you don&apos;t need a fully
                correct solution to earn points.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
