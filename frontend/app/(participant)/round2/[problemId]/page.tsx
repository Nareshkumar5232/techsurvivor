"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag, Minus, Plus, Play, RotateCcw, Send } from "lucide-react";
import type { RunResult, SubmissionSummary, SupportedLanguage } from "@tech-survivor/types";
import { DEFAULT_STARTER_CODE, LANGUAGE_LABELS } from "@tech-survivor/config";
import { ApiClientError } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useEventStatus } from "@/lib/hooks/useEventStatus";
import {
  useFinishRound2,
  useRound2Problems,
  useRunCode,
  useSaveCode,
  useSavedCode,
  useSubmissionHistory,
  useSubmitCode,
} from "@/lib/hooks/useRound2";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FullPageSpinner, Spinner } from "@/components/ui/spinner";
import { NotQualifiedAlert } from "@/components/round2/not-qualified-alert";
import { RoundStatusAlert } from "@/components/round2/round-status-alert";
import { OutputConsole } from "@/components/round2/output-console";
import { ProblemPanel, type ProblemPanelTab } from "@/components/round2/problem-panel";

// Self-hosted Monaco: point @monaco-editor/react at the locally bundled monaco-editor
// package instead of its default behavior of fetching ~15 files from a CDN at runtime
// (cdn.jsdelivr.net), which is slow on first load and a hard dependency on an external host.
const Editor = dynamic(
  () =>
    Promise.all([import("@monaco-editor/react"), import("monaco-editor/esm/vs/editor/editor.api")]).then(
      ([reactModule, monaco]) => {
        reactModule.loader.config({ monaco });
        return reactModule.default;
      },
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

const MONACO_LANGUAGE: Record<SupportedLanguage, string> = {
  c: "c",
  cpp: "cpp",
  python: "python",
  java: "java",
  javascript: "javascript",
  typescript: "typescript",
};

type MobileView = "problem" | "editor" | "output";
type SaveStatus = "idle" | "saving" | "saved" | "error";

function describeApiError(err: ApiClientError): string {
  switch (err.code) {
    case "RATE_LIMITED":
      return "You're going too fast - wait a moment and try again.";
    case "CODE_TOO_LARGE":
      return "Your code is too large. Please shorten it and try again.";
    case "COMPILER_UNAVAILABLE":
      return "The compiler service is unavailable right now. Please try again shortly.";
    case "COMPILER_TIMEOUT":
      return "The compiler timed out running your code. Try again or simplify it.";
    case "ROUND_NOT_STARTED":
      return "Round 2 has not started yet.";
    case "ROUND_PAUSED":
      return "Round 2 is currently paused.";
    case "ROUND_CLOSED":
      return "Round 2 has closed.";
    case "ROUND_EXPIRED":
      return "Your Round 2 time has expired.";
    case "NOT_QUALIFIED":
      return "You are not qualified for Round 2.";
    default:
      return err.message;
  }
}

export default function Round2WorkspacePage() {
  const params = useParams<{ problemId: string }>();
  const problemId = params.problemId;
  const router = useRouter();
  const { profile } = useAuth();

  const eventStatusQuery = useEventStatus();
  const status = eventStatusQuery.data?.round2.participantStatus;
  const accessible = status === "available" || status === "in_progress";

  const problemsQuery = useRound2Problems(accessible);
  const problem = problemsQuery.data?.find((p) => p.id === problemId);
  const problemsNotQualified =
    problemsQuery.error instanceof ApiClientError && problemsQuery.error.code === "NOT_QUALIFIED";

  const historyQuery = useSubmissionHistory(problemId);

  // ---- Editor / language state ----
  // Monaco's own height="100%" relies on a CSS flex-stretch cascading correctly through
  // several nested wrapper levels. In this layout that cascade isn't resolving reliably, so
  // instead we measure the container ourselves and hand Monaco an exact pixel height -
  // sidestepping the percentage-resolution chain entirely.
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [editorHeight, setEditorHeight] = useState(320);
  useEffect(() => {
    const el = editorContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height && height > 0) setEditorHeight(height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const editorInstanceRef = useRef<{ layout: () => void } | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [fontSize, setFontSize] = useState(14);
  const [customInput, setCustomInput] = useState("");

  // ---- Run / submit state ----
  const [lastAction, setLastAction] = useState<"run" | "submit" | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmissionSummary | null>(null);

  // ---- Layout state ----
  const [leftTab, setLeftTab] = useState<ProblemPanelTab>("problem");
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [leftWidth, setLeftWidth] = useState(40);
  const [isOnline, setIsOnline] = useState(true);

  const savedCodeQuery = useSavedCode(problemId, language, accessible && Boolean(problem));
  const saveMutation = useSaveCode(problemId);
  const runMutation = useRunCode();
  const submitMutation = useSubmitCode();
  const finishMutation = useFinishRound2();

  // Pick a default language once the problem is known.
  useEffect(() => {
    if (problem && language === null) {
      setLanguage(problem.supportedLanguages[0] ?? "cpp");
    }
  }, [problem, language]);

  // Track online/offline for the connection dot (must run client-side only).
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Apply fetched saved code (or starter code) into the editor exactly once per
  // problem+language pair, so refetches never clobber in-progress edits.
  const loadedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!savedCodeQuery.data || !language) return;
    const key = `${problemId}:${language}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    setCode(savedCodeQuery.data.sourceCode);
    setSaveStatus("saved");
  }, [savedCodeQuery.data, problemId, language]);

  const codeReady = language !== null && loadedKeyRef.current === `${problemId}:${language}`;

  // Latest values, read from inside stable callbacks (keyboard shortcuts, mutate calls)
  // without forcing those callbacks to change identity on every keystroke.
  const codeRef = useRef(code);
  codeRef.current = code;
  const customInputRef = useRef(customInput);
  customInputRef.current = customInput;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(
    (sourceCode: string, lang: SupportedLanguage) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      setSaveStatus("saving");
      saveMutation.mutate(
        { language: lang, sourceCode },
        {
          onSuccess: () => setSaveStatus("saved"),
          onError: () => setSaveStatus("error"),
        },
      );
    },
    [saveMutation],
  );

  const scheduleSave = useCallback(
    (sourceCode: string, lang: SupportedLanguage) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(() => {
        saveMutation.mutate(
          { language: lang, sourceCode },
          {
            onSuccess: () => setSaveStatus("saved"),
            onError: () => setSaveStatus("error"),
          },
        );
      }, 1000);
    },
    [saveMutation],
  );

  function handleEditorChange(value: string | undefined) {
    const next = value ?? "";
    setCode(next);
    if (language) scheduleSave(next, language);
  }

  function handleLanguageChange(next: SupportedLanguage) {
    setLanguageError(null);
    if (language && saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      saveMutation.mutate({ language, sourceCode: codeRef.current });
    }
    setLanguage(next);
  }

  function handleReset() {
    if (!problem || !language) return;
    const starter = problem.starterCode[language] ?? DEFAULT_STARTER_CODE[language] ?? "";
    setCode(starter);
    loadedKeyRef.current = `${problemId}:${language}`;
    saveNow(starter, language);
    toast.success("Code reset to the starter template");
  }

  function handleMutationError(err: unknown) {
    if (err instanceof ApiClientError) {
      if (err.code === "INVALID_LANGUAGE") {
        setLanguageError(err.message);
        return;
      }
      toast.error(describeApiError(err));
      return;
    }
    toast.error("Something went wrong. Please try again.");
  }

  const handleRun = useCallback(() => {
    if (!problem || !language) return;
    setLastAction("run");
    runMutation.mutate(
      {
        problemId,
        language,
        sourceCode: codeRef.current,
        customInput: customInputRef.current.trim() ? customInputRef.current : undefined,
      },
      {
        onSuccess: (result) => setRunResult(result),
        onError: (err) => handleMutationError(err),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, language, problemId, runMutation]);

  const handleSubmit = useCallback(() => {
    if (!problem || !language) return;
    setLastAction("submit");
    submitMutation.mutate(
      { problemId, language, sourceCode: codeRef.current },
      {
        onSuccess: (result) => setSubmitResult(result),
        onError: (err) => handleMutationError(err),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, language, problemId, submitMutation]);

  // Ctrl/Cmd+Enter = Run, Ctrl/Cmd+Shift+Enter = Submit, Ctrl/Cmd+S = save now.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleRun();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (language) saveNow(codeRef.current, language);
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [handleRun, handleSubmit, language, saveNow]);

  function handleFinish() {
    if (!window.confirm("Finish Round 2 now? You'll still be able to improve your scores until the round closes.")) {
      return;
    }
    finishMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Round 2 marked as finished. You can still improve your scores until the round closes.");
        router.push("/leaderboard");
      },
      onError: (err) => handleMutationError(err),
    });
  }

  // ---- Gating states (rendered outside the dark workspace shell) ----
  if (eventStatusQuery.isLoading || (accessible && problemsQuery.isLoading)) {
    return <FullPageSpinner label="Loading problem..." />;
  }

  if (eventStatusQuery.isError) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Could not load Round 2 status">
          Please refresh the page.
        </Alert>
      </div>
    );
  }

  if (!accessible && status !== undefined) {
    return (
      <div className="p-4">
        <RoundStatusAlert status={status} />
      </div>
    );
  }

  if (problemsQuery.isError) {
    return (
      <div className="p-4">
        {problemsNotQualified ? (
          <NotQualifiedAlert />
        ) : (
          <Alert variant="error" title="Could not load problem">
            Please refresh the page and try again.
          </Alert>
        )}
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Problem not found">
          <Link href="/round2" className="underline">
            Back to Round 2 problems
          </Link>
        </Alert>
      </div>
    );
  }

  const bestScore =
    historyQuery.data?.filter((s) => s.kind === "submit").reduce((max, s) => Math.max(max, s.score), 0) ?? 0;
  const isPending = lastAction === "run" ? runMutation.isPending : lastAction === "submit" ? submitMutation.isPending : false;

  const editorToolbar = (
    <div className="flex flex-wrap items-center gap-2 border-b border-navy-700/80 bg-navy-950/70 px-3 py-2">
      <div className="flex items-center gap-2">
        <label htmlFor="language-select" className="text-xs font-semibold text-slate-400">
          Language
        </label>
        <Select
          id="language-select"
          value={language ?? ""}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
          className="h-7 w-36 rounded-lg border-navy-600 bg-navy-800/80 text-xs text-slate-100 focus-visible:ring-0"
        >
          {problem.supportedLanguages.map((l) => (
            <option key={l} value={l}>
              {LANGUAGE_LABELS[l]}
            </option>
          ))}
        </Select>
      </div>

      <div className="mx-0.5 h-4 w-px bg-white/10" />

      <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-navy-800/50" role="group" aria-label="Editor font size">
        <button
          type="button"
          onClick={() => setFontSize((f) => Math.max(12, f - 2))}
          aria-label="Decrease font size"
          className="rounded-l-lg px-2 py-1 text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span className="min-w-[38px] text-center text-xs font-mono text-slate-300">{fontSize}px</span>
        <button
          type="button"
          onClick={() => setFontSize((f) => Math.min(24, f + 2))}
          aria-label="Increase font size"
          className="rounded-r-lg px-2 py-1 text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleReset}
        className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/8 bg-navy-800/50 px-2.5 py-1 text-xs text-slate-400 transition-all hover:border-white/15 hover:bg-navy-700/60 hover:text-slate-200"
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        Reset Code
      </button>

      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium transition-all",
          saveStatus === "saving" && "bg-amber-500/10 text-amber-400",
          saveStatus === "saved" && "bg-green-500/10 text-green-400",
          saveStatus === "error" && "bg-red-500/10 text-red-400",
          saveStatus === "idle" && "text-slate-600",
        )}
        aria-live="polite"
      >
        {saveStatus === "saving" ? "● Saving…" : saveStatus === "saved" ? "✓ Saved" : saveStatus === "error" ? "✗ Failed" : ""}
      </span>
    </div>
  );

  const editorArea = (
    <div className="flex min-h-0 flex-1 flex-col">
      {editorToolbar}
      {languageError && (
        <p role="alert" className="border-b border-navy-700 bg-red-950/40 px-3 py-1.5 text-xs text-red-300">
          {languageError}
        </p>
      )}
      <div ref={editorContainerRef} className="min-h-0 flex-1" style={{ minHeight: 320 }}>
        {savedCodeQuery.isError ? (
          <div className="p-3">
            <Alert variant="error" title="Could not load your saved code">
              Please refresh the page and try again.
            </Alert>
          </div>
        ) : codeReady ? (
          <Editor
            height={editorHeight}
            language={MONACO_LANGUAGE[language ?? "cpp"]}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            onMount={(editorInstance) => {
              editorInstanceRef.current = editorInstance;
            }}
            options={{ fontSize, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
          />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
      <div className="flex-shrink-0 border-t border-navy-700/80 bg-navy-950/50 px-4 py-3">
        <label htmlFor="custom-input" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
          Custom Input
          <span className="font-normal text-slate-600">(optional)</span>
        </label>
        <Textarea
          id="custom-input"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Leave blank to run against the sample test cases"
          className="mt-2 h-14 resize-none rounded-lg border-navy-600/80 bg-navy-800/60 text-xs text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-navy-800"
        />
        <div className="mt-2.5 flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRun}
            disabled={runMutation.isPending || submitMutation.isPending}
            className="flex-1 border-navy-600/80 bg-navy-800/70 text-slate-200 hover:bg-navy-700 hover:text-white"
          >
            {runMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
            Run
            <span className="ml-1 text-xs opacity-50">(Ctrl+Enter)</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={runMutation.isPending || submitMutation.isPending}
            className="flex-1"
          >
            {submitMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
            Submit
            <span className="ml-1 text-xs opacity-70">(Ctrl+Shift+Enter)</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const outputArea = (
    <OutputConsole
      isPending={isPending}
      pendingLabel={lastAction === "run" ? "Running your code..." : "Submitting and evaluating hidden tests..."}
      kind={lastAction}
      runResult={runResult}
      submitResult={submitResult}
      problemPoints={problem.points}
    />
  );

  const problemArea = (
    <ProblemPanel
      problem={problem}
      history={historyQuery.data}
      historyLoading={historyQuery.isLoading}
      tab={leftTab}
      onTabChange={setLeftTab}
    />
  );

  return (
    <div className="workspace-dark flex h-screen flex-col bg-navy-900 text-slate-100 overflow-hidden w-full">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between gap-4 border-b border-white/10 bg-navy-950/90 px-4 py-2.5 backdrop-blur-xl flex-shrink-0">
        <div className="flex min-w-0 items-center gap-3 overflow-x-auto">
          <Link
            href="/round2"
            className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white border border-white/10"
          >
            &larr; Round 2
          </Link>
          <div className="h-4 w-px bg-white/10 flex-shrink-0" />
          <nav className="flex items-center gap-1.5 overflow-x-auto py-0.5" aria-label="Switch problem">
            {problemsQuery.data?.map((p) => {
              const active = p.id === problemId;
              return (
                <Link
                  key={p.id}
                  href={`/round2/${p.id}`}
                  className={cn(
                    "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-semibold border border-blue-400/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent",
                  )}
                >
                  {p.title}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 border border-white/10" title={isOnline ? "Connected" : "Offline"}>
            <span className={cn("h-2 w-2 rounded-full shadow-sm", isOnline ? "bg-green-400 shadow-green-400/50" : "bg-red-400 shadow-red-400/50")} aria-hidden="true" />
            <span className="font-medium text-slate-200">{isOnline ? "Online" : "Offline"}</span>
          </span>
          {profile && <span className="hidden font-medium text-slate-300 sm:inline">{profile.fullName}</span>}
          <Badge variant="secondary" className="bg-white/10 text-white border-white/10">
            Best: {bestScore}/{problem.points}
          </Badge>
          <Button type="button" size="sm" variant="destructive" onClick={handleFinish} disabled={finishMutation.isPending}>
            {finishMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" aria-hidden="true" />}
            Finish Round
          </Button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div role="tablist" aria-label="Workspace view" className="flex border-b border-navy-700 lg:hidden">
        {(["problem", "editor", "output"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={mobileView === v}
            onClick={() => setMobileView(v)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium",
              mobileView === v ? "border-b-2 border-brand-blue text-white" : "text-slate-400",
            )}
          >
            {v === "problem" ? "Problem" : v === "editor" ? "Editor" : "Output"}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 lg:hidden">
        {mobileView === "problem" && problemArea}
        {mobileView === "editor" && editorArea}
        {mobileView === "output" && <div className="h-full overflow-y-auto p-3">{outputArea}</div>}
      </div>

      {/* Desktop split view */}
      <ResizableSplit
        leftWidth={leftWidth}
        onLeftWidthChange={setLeftWidth}
        left={problemArea}
        right={
          <div className="flex min-h-0 flex-1 flex-col">
            {editorArea}
            <div className="flex-shrink-0 border-t border-navy-700/60 bg-navy-950/80 px-4 py-3 max-h-60 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#1b2646_transparent]">{outputArea}</div>
          </div>
        }
      />
    </div>
  );
}

function ResizableSplit({
  left,
  right,
  leftWidth,
  onLeftWidthChange,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth: number;
  onLeftWidthChange: (next: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      onLeftWidthChange(Math.min(65, Math.max(25, pct)));
    }
    function onUp() {
      draggingRef.current = false;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onLeftWidthChange]);

  return (
    <div ref={containerRef} className="hidden min-h-0 flex-1 lg:flex">
      <div className="min-w-[280px] overflow-hidden" style={{ width: `${leftWidth}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize problem and editor panels"
        tabIndex={0}
        onMouseDown={(e) => {
          e.preventDefault();
          draggingRef.current = true;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onLeftWidthChange(Math.max(25, leftWidth - 2));
          if (e.key === "ArrowRight") onLeftWidthChange(Math.min(65, leftWidth + 2));
        }}
        className="focus-ring w-1.5 flex-shrink-0 cursor-col-resize bg-navy-700 hover:bg-brand-blue"
      />
      <div className="min-h-0 min-w-[360px] flex-1 overflow-hidden">{right}</div>
    </div>
  );
}
