"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, X, XCircle } from "lucide-react";
import type { MCQResultView } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { FullPageSpinner } from "@/components/ui/spinner";

function formatTimeUsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

export default function Round1ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<MCQResultView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<MCQResultView>("/round1/result")
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.code === "CONFLICT") {
          router.replace("/round1");
          return;
        }
        if (err instanceof ApiClientError && err.code === "NOT_FOUND") {
          setNotFound(true);
          return;
        }
        setError(err instanceof ApiClientError ? err.message : "Could not load your Round 1 result.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <Alert variant="warning" title="No attempt found">
        <p>You haven&apos;t attempted Round 1 yet.</p>
        <Link href="/round1" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>
          Go to Round 1
        </Link>
      </Alert>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!result) {
    return <FullPageSpinner label="Redirecting..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {result.qualified ? (
            <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-800">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              <span className="text-lg font-bold">QUALIFIED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-red-800">
              <XCircle className="h-6 w-6" aria-hidden="true" />
              <span className="text-lg font-bold">NOT QUALIFIED</span>
            </div>
          )}
          <div>
            <p className="text-3xl font-bold text-navy-900">
              {result.score} / {result.totalMarks}
            </p>
            <p className="text-sm text-slate-500">{result.percentage.toFixed(1)}% score</p>
          </div>
          <p className="text-sm text-slate-500">Time used: {formatTimeUsed(result.timeUsedSeconds)}</p>

          {result.qualified ? (
            <Link href="/round2" className={buttonVariants({ variant: "primary" })}>
              Continue to Round 2
            </Link>
          ) : (
            <p className="max-w-md text-sm text-slate-600">
              You didn&apos;t meet the qualification threshold this time. Thank you for participating in Round 1 -
              keep an eye on announcements for what&apos;s next.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Correct" value={result.correctCount} accent="green" />
        <StatCard label="Incorrect" value={result.incorrectCount} accent="amber" />
        <StatCard label="Unanswered" value={result.unansweredCount} />
      </div>

      {/* Review */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Review</CardTitle>
        </CardHeader>
        <CardContent>
          {result.review === null ? (
            <p className="text-sm text-slate-500">Answer review is not enabled for this round.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {result.review.map((item, index) => (
                <div key={item.questionId} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                  <p className="mb-3 text-sm font-semibold text-navy-900">
                    {index + 1}. {item.question}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {item.options.map((option, optionIndex) => {
                      const isCorrect = optionIndex === item.correctOptionIndex;
                      const isSelected = optionIndex === item.selectedOptionIndex;
                      return (
                        <li
                          key={optionIndex}
                          className={cn(
                            "flex items-center gap-2 rounded-md border p-2 text-sm",
                            isCorrect
                              ? "border-green-300 bg-green-50 text-green-900"
                              : isSelected
                                ? "border-red-300 bg-red-50 text-red-900"
                                : "border-slate-200 text-slate-700",
                          )}
                        >
                          {isCorrect ? (
                            <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          ) : isSelected ? (
                            <X className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          ) : (
                            <span className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span>{option}</span>
                          {isCorrect && <span className="ml-auto text-xs font-medium">Correct answer</span>}
                          {isSelected && !isCorrect && <span className="ml-auto text-xs font-medium">Your answer</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {item.explanation && <p className="mt-2 text-xs text-slate-500">{item.explanation}</p>}
                  {item.selectedOptionIndex === null && (
                    <p className="mt-2 text-xs text-slate-400">You did not answer this question.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
