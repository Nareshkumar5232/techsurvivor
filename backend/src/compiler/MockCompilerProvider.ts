import { randomUUID } from "node:crypto";
import { SUPPORTED_LANGUAGES } from "@tech-survivor/config";
import type { SupportedLanguage, Verdict } from "@tech-survivor/types";
import type { CompilerProvider, ExecuteCodeRequest, ExecutionResult } from "./types.js";

/**
 * Never compiles or executes anything - no child_process, no eval, no VM. It exists purely
 * so the frontend and integration tests can exercise the run/submit flow without a real
 * Judge0 account. It "cheats" by echoing stdin back as stdout, which happens to satisfy
 * identity-style sample problems, and lets test authors force a specific verdict by putting
 * a `// MOCK_VERDICT: <verdict>` marker in the submitted source. Do not use this for grading
 * real participant code - COMPILER_PROVIDER must be "judge0" in production.
 */
const MARKER = /\/\/\s*MOCK_VERDICT:\s*(\w+)/;

const VALID_VERDICTS: Verdict[] = [
  "accepted",
  "wrong_answer",
  "compilation_error",
  "runtime_error",
  "time_limit_exceeded",
  "memory_limit_exceeded",
  "output_limit_exceeded",
  "internal_error",
];

export class MockCompilerProvider implements CompilerProvider {
  private readonly results = new Map<string, ExecutionResult>();

  async getLanguages(): Promise<SupportedLanguage[]> {
    return SUPPORTED_LANGUAGES;
  }

  async execute(request: ExecuteCodeRequest): Promise<ExecutionResult> {
    const token = randomUUID();
    const forced = request.sourceCode.match(MARKER)?.[1];
    const verdict: Verdict =
      forced && VALID_VERDICTS.includes(forced as Verdict) ? (forced as Verdict) : "accepted";

    await new Promise((resolve) => setTimeout(resolve, 50));

    const result: ExecutionResult = {
      token,
      status: "completed",
      verdict,
      stdout: verdict === "accepted" ? request.stdin : "",
      stderr: verdict === "runtime_error" ? "mock runtime error" : null,
      compileOutput: verdict === "compilation_error" ? "mock compilation error" : null,
      timeSeconds: 0.05,
      memoryKb: 4096,
    };
    this.results.set(token, result);
    return result;
  }

  async getSubmission(token: string): Promise<ExecutionResult> {
    const cached = this.results.get(token);
    if (cached) return cached;
    return {
      token,
      status: "failed",
      verdict: "internal_error",
      stdout: null,
      stderr: null,
      compileOutput: null,
      timeSeconds: null,
      memoryKb: null,
    };
  }
}
