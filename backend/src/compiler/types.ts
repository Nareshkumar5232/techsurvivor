import type { SupportedLanguage, Verdict } from "@tech-survivor/types";

export interface ExecuteCodeRequest {
  language: SupportedLanguage;
  sourceCode: string;
  stdin: string;
  timeLimitSeconds: number;
  memoryLimitMb: number;
}

export type ExecutionStatus = "queued" | "processing" | "completed" | "failed";

export interface ExecutionResult {
  token: string;
  status: ExecutionStatus;
  /** Best-effort verdict for THIS execution only (compiled/ran or not) - the caller still
   *  must compare stdout against the expected output to decide accepted vs wrong_answer. */
  verdict: Verdict;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  timeSeconds: number | null;
  memoryKb: number | null;
}

export interface CompilerProvider {
  getLanguages(): Promise<SupportedLanguage[]>;
  execute(request: ExecuteCodeRequest): Promise<ExecutionResult>;
  getSubmission(token: string): Promise<ExecutionResult>;
}
