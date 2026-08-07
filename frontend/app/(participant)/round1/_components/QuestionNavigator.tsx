"use client";

import { Check, Flag } from "lucide-react";
import type { MCQQuestionPublic, QuestionNavStatus } from "@tech-survivor/types";
import { cn } from "@/lib/utils";

function statusOf(
  question: MCQQuestionPublic,
  answers: Record<string, number>,
  markedForReview: string[],
  visited: Set<string>,
): QuestionNavStatus {
  const answered = question.id in answers;
  const marked = markedForReview.includes(question.id);
  if (answered && marked) return "answered_marked_review";
  if (marked) return "marked_review";
  if (answered) return "answered";
  if (visited.has(question.id)) return "visited_unanswered";
  return "not_visited";
}

const STATUS_STYLES: Record<QuestionNavStatus, string> = {
  not_visited: "bg-slate-100 text-slate-600 border-slate-200",
  visited_unanswered: "bg-red-50 text-red-700 border-red-200",
  answered: "bg-green-100 text-green-800 border-green-300",
  marked_review: "bg-purple-100 text-purple-800 border-purple-300",
  answered_marked_review: "bg-amber-100 text-amber-800 border-amber-300",
};

const STATUS_LABELS: Record<QuestionNavStatus, string> = {
  not_visited: "Not visited",
  visited_unanswered: "Visited, unanswered",
  answered: "Answered",
  marked_review: "Marked for review",
  answered_marked_review: "Answered and marked for review",
};

function StatusIcon({ status }: { status: QuestionNavStatus }) {
  if (status === "answered") return <Check className="h-3 w-3" aria-hidden="true" />;
  if (status === "marked_review") return <Flag className="h-3 w-3" aria-hidden="true" />;
  if (status === "answered_marked_review")
    return (
      <span className="flex items-center gap-0.5">
        <Check className="h-3 w-3" aria-hidden="true" />
        <Flag className="h-3 w-3" aria-hidden="true" />
      </span>
    );
  return null;
}

export function QuestionNavigator({
  questions,
  currentIndex,
  answers,
  markedForReview,
  visited,
  onJump,
}: {
  questions: MCQQuestionPublic[];
  currentIndex: number;
  answers: Record<string, number>;
  markedForReview: string[];
  visited: Set<string>;
  onJump: (index: number) => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-navy-900">Question Navigator</h2>
      <div role="group" aria-label="Jump to question" className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          const status = statusOf(question, answers, markedForReview, visited);
          const isCurrent = index === currentIndex;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onJump(index)}
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Question ${index + 1}, ${STATUS_LABELS[status]}${isCurrent ? ", current question" : ""}`}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2",
                STATUS_STYLES[status],
                isCurrent && "ring-2 ring-brand-blue ring-offset-1",
              )}
            >
              <span>{index + 1}</span>
              <span className="absolute -bottom-1 -right-1">
                <StatusIcon status={status} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-600">
        <Legend swatchClass={STATUS_STYLES.not_visited} label="Not visited" />
        <Legend swatchClass={STATUS_STYLES.visited_unanswered} label="Visited, unanswered" />
        <Legend swatchClass={STATUS_STYLES.answered} label="Answered" icon={<Check className="h-3 w-3" aria-hidden="true" />} />
        <Legend swatchClass={STATUS_STYLES.marked_review} label="Marked for review" icon={<Flag className="h-3 w-3" aria-hidden="true" />} />
        <Legend
          swatchClass={STATUS_STYLES.answered_marked_review}
          label="Answered + marked for review"
          icon={
            <span className="flex items-center gap-0.5">
              <Check className="h-2.5 w-2.5" aria-hidden="true" />
              <Flag className="h-2.5 w-2.5" aria-hidden="true" />
            </span>
          }
        />
      </div>
    </div>
  );
}

function Legend({ swatchClass, label, icon }: { swatchClass: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("flex h-4 w-4 items-center justify-center rounded border", swatchClass)}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
