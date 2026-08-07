"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, ShieldAlert, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import type { MCQAttemptView, MCQResultView } from "@tech-survivor/types";
import { apiClient, ApiClientError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionNavigator } from "./QuestionNavigator";
import { useBeforeUnloadWarning, useExamMonitoring } from "./useExamMonitoring";

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ExamSession({ roundName, initialAttempt }: { roundName: string; initialAttempt: MCQAttemptView }) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, number>>(initialAttempt.answers);
  const [markedForReview, setMarkedForReview] = useState<string[]>(initialAttempt.markedForReview);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(() => {
    const first = initialAttempt.questions[0];
    return new Set(first ? [first.id] : []);
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const questions = initialAttempt.questions;
  const currentQuestion = questions[currentIndex];

  const [remainingMs, setRemainingMs] = useState(() => Date.parse(initialAttempt.expiresAt) - Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(Date.parse(initialAttempt.expiresAt) - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [initialAttempt.expiresAt]);

  const { isOnline } = useExamMonitoring(true);
  useBeforeUnloadWarning(true);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await apiClient.post<MCQResultView>("/round1/submit");
    } catch (err) {
      if (!(err instanceof ApiClientError && err.code === "ALREADY_SUBMITTED")) {
        toast.error(err instanceof ApiClientError ? err.message : "Could not submit Round 1. Please try again.");
        submittedRef.current = false;
        setSubmitting(false);
        return;
      }
    }
    router.replace("/round1/result");
  }, [router]);

  // Auto-submit exactly once the server-issued deadline passes.
  useEffect(() => {
    if (remainingMs <= 0 && !submittedRef.current) {
      toast.warning("Time's up. Submitting your answers automatically.");
      void doSubmit();
    }
  }, [remainingMs, doSubmit]);

  function jumpTo(index: number) {
    setCurrentIndex(index);
    setSaveStatus("idle");
    const question = questions[index];
    if (question) {
      setVisited((prev) => new Set(prev).add(question.id));
    }
  }

  async function selectOption(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setSaveStatus("saving");
    try {
      await apiClient.put("/round1/answer", { questionId, optionIndex });
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("idle");
      toast.error(err instanceof ApiClientError ? err.message : "Could not save your answer.");
    }
  }

  async function toggleMarkForReview(questionId: string) {
    const nextMarked = !markedForReview.includes(questionId);
    setMarkedForReview((prev) => (nextMarked ? [...prev, questionId] : prev.filter((id) => id !== questionId)));
    try {
      await apiClient.put("/round1/mark-review", { questionId, marked: nextMarked });
    } catch (err) {
      // Revert on failure so the nav grid never shows a state the server didn't accept.
      setMarkedForReview((prev) => (nextMarked ? prev.filter((id) => id !== questionId) : [...prev, questionId]));
      toast.error(err instanceof ApiClientError ? err.message : "Could not update review flag.");
    }
  }

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isLowTime = remainingMs > 0 && remainingMs < 5 * 60 * 1000;

  if (!currentQuestion) {
    return <Alert variant="error">This attempt has no questions. Contact an organizer.</Alert>;
  }

  const selectedIndex = answers[currentQuestion.id];
  const isMarked = markedForReview.includes(currentQuestion.id);

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        This exam monitors tab switches, window focus, and copy/paste for integrity purposes. Browser-based
        monitoring cannot guarantee complete prevention of misconduct.
      </Alert>

      {/* Top bar: round name, timer, progress, network status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <h1 className="text-lg font-bold text-navy-900">{roundName}</h1>
          <p className="text-sm text-slate-500">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isOnline ? "success" : "destructive"} className="flex items-center gap-1">
            {isOnline ? <Wifi className="h-3 w-3" aria-hidden="true" /> : <WifiOff className="h-3 w-3" aria-hidden="true" />}
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <div
            role="timer"
            aria-live="polite"
            className={cn(
              "rounded-md px-3 py-1.5 text-lg font-semibold tabular-nums",
              isLowTime ? "bg-red-100 text-red-700" : "bg-slate-100 text-navy-900",
            )}
          >
            {formatClock(remainingMs)}
          </div>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={answeredCount}
        aria-label="Questions answered"
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full bg-brand-blue transition-all"
          style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        {/* Question panel */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-navy-900">
                Question {currentIndex + 1} of {questions.length}{" "}
                <span className="ml-1 text-sm font-normal text-slate-500">({currentQuestion.marks} marks)</span>
              </h2>
              <span className="text-xs text-slate-400" aria-live="polite">
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && "Saved"}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-navy-900">{currentQuestion.question}</p>

            <fieldset>
              <legend className="sr-only">Options for question {currentIndex + 1}</legend>
              <div className="flex flex-col gap-2">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = selectedIndex === optionIndex;
                  return (
                    <label
                      key={optionIndex}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-blue focus-within:ring-offset-1",
                        isSelected ? "border-brand-blue bg-blue-50" : "border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() => selectOption(currentQuestion.id, optionIndex)}
                        className="h-4 w-4"
                      />
                      <span className="flex-1">{option}</span>
                      {isSelected && <Check className="h-4 w-4 text-brand-blue" aria-hidden="true" />}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <Button
                variant={isMarked ? "primary" : "outline"}
                size="sm"
                onClick={() => toggleMarkForReview(currentQuestion.id)}
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                {isMarked ? "Unmark Review" : "Mark for Review"}
              </Button>
              {/* No "Clear Response" control: the answer endpoint only upserts (PUT), there is
                  no way to remove a saved answer server-side. A client-only "clear" would look
                  cleared on screen but the last saved option would still be what gets graded on
                  submit/refresh, which is actively misleading, so re-selecting a different option
                  is the only supported way to change an answer. */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => jumpTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  Previous
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button size="sm" onClick={() => jumpTo(currentIndex + 1)}>
                    Save &amp; Next
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setShowSubmitConfirm(true)}>
                    Review &amp; Submit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question navigator + submit */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4">
              <QuestionNavigator
                questions={questions}
                currentIndex={currentIndex}
                answers={answers}
                markedForReview={markedForReview}
                visited={visited}
                onJump={jumpTo}
              />
            </CardContent>
          </Card>

          {!showSubmitConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              className="w-full"
            >
              Submit Round 1
            </Button>
          ) : (
            <Card className="border-red-200">
              <CardContent className="flex flex-col gap-3 p-4">
                <p className="text-sm text-navy-900">
                  You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount === 1 ? "" : "s"}.
                  Once submitted, you cannot change your answers.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSubmitConfirm(false)} disabled={submitting}>
                    Keep Reviewing
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => void doSubmit()} disabled={submitting}>
                    {submitting ? "Submitting..." : "Confirm Submit"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            Stay on this tab in fullscreen. Switching away or losing focus is logged.
          </p>
        </div>
      </div>
    </div>
  );
}
