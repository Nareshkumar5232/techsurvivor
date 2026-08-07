export type CodingDifficulty = "easy" | "medium" | "hard";

export type SupportedLanguage = "c" | "cpp" | "python" | "java" | "javascript" | "typescript";

export type ScoringMode = "all_or_nothing" | "partial";

export type ComparisonMode = "exact" | "trimmed" | "case_insensitive" | "float_tolerance";

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface StarterCodeMap {
  c?: string;
  cpp?: string;
  python?: string;
  java?: string;
  javascript?: string;
  typescript?: string;
}

/** Full problem record including hidden test cases — server/admin only. */
export interface CodingProblem {
  id: string;
  eventId: string;
  title: string;
  slug: string;
  difficulty: CodingDifficulty;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  samples: TestCase[];
  hiddenTestCases: TestCase[];
  starterCode: StarterCodeMap;
  supportedLanguages: SupportedLanguage[];
  points: number;
  scoringMode: ScoringMode;
  timeLimit: number;
  memoryLimit: number;
  comparisonMode: ComparisonMode;
  floatTolerance: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Sanitized problem shape sent to participants — hidden test cases stripped. */
export interface CodingProblemPublic {
  id: string;
  title: string;
  slug: string;
  difficulty: CodingDifficulty;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  samples: TestCase[];
  starterCode: StarterCodeMap;
  supportedLanguages: SupportedLanguage[];
  points: number;
  timeLimit: number;
  memoryLimit: number;
}

export type Verdict =
  | "queued"
  | "processing"
  | "accepted"
  | "wrong_answer"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "internal_error";

export type SubmissionKind = "run" | "submit";

export interface Submission {
  id: string;
  userId: string;
  eventId: string;
  problemId: string;
  language: SupportedLanguage;
  sourceCode: string;
  kind: SubmissionKind;
  status: "queued" | "processing" | "completed" | "failed";
  verdict: Verdict;
  passedTests: number;
  totalTests: number;
  score: number;
  runtime: number | null;
  memory: number | null;
  compilerOutput: string | null;
  submittedAt: string;
  completedAt: string | null;
}

/** Safe submission summary returned to the participant — no hidden test data. */
export interface SubmissionSummary {
  id: string;
  problemId: string;
  language: SupportedLanguage;
  kind: SubmissionKind;
  status: Submission["status"];
  verdict: Verdict;
  passedTests: number;
  totalTests: number;
  score: number;
  runtime: number | null;
  memory: number | null;
  compilerOutput: string | null;
  submittedAt: string;
  completedAt: string | null;
}

export interface SavedCode {
  userId: string;
  eventId: string;
  problemId: string;
  language: SupportedLanguage;
  sourceCode: string;
  updatedAt: string;
}

export interface RunResult {
  status: "completed" | "failed";
  verdict: Verdict;
  stdout: string | null;
  stderr: string | null;
  compilerOutput: string | null;
  runtime: number | null;
  memory: number | null;
  sampleResults?: {
    testCaseId: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
  }[];
}
