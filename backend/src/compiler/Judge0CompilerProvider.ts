import { JUDGE0_LANGUAGE_IDS, SUPPORTED_LANGUAGES } from "@tech-survivor/config";
import type { SupportedLanguage, Verdict } from "@tech-survivor/types";
import type { Env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import type { CompilerProvider, ExecuteCodeRequest, ExecutionResult, ExecutionStatus } from "./types.js";

interface Judge0SubmissionResponse {
  token: string;
}

interface Judge0StatusResponse {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;
  memory: number | null;
  message: string | null;
}

/** Judge0 status IDs 1 (In Queue) and 2 (Processing) mean "not done yet". */
const IN_PROGRESS_STATUS_IDS = new Set([1, 2]);

function mapStatusToVerdict(statusId: number, memoryKb: number | null, memoryLimitKb: number): Verdict {
  if (memoryKb !== null && memoryKb > memoryLimitKb) return "memory_limit_exceeded";
  switch (statusId) {
    case 3:
      return "accepted"; // "ran without error" - actual correctness is decided by our own comparator
    case 5:
      return "time_limit_exceeded";
    case 6:
      return "compilation_error";
    case 13:
      return "internal_error";
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
    case 14:
      return "runtime_error";
    default:
      return "internal_error";
  }
}

export class Judge0CompilerProvider implements CompilerProvider {
  constructor(private readonly env: Env) {}

  async getLanguages(): Promise<SupportedLanguage[]> {
    return SUPPORTED_LANGUAGES;
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.env.JUDGE0_API_KEY) headers["X-RapidAPI-Key"] = this.env.JUDGE0_API_KEY;
    if (this.env.JUDGE0_API_HOST) headers["X-RapidAPI-Host"] = this.env.JUDGE0_API_HOST;
    if (this.env.JUDGE0_AUTH_TOKEN) headers[this.env.JUDGE0_AUTH_HEADER] = this.env.JUDGE0_AUTH_TOKEN;
    return headers;
  }

  private async fetchJson<T>(path: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.env.COMPILER_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.env.JUDGE0_API_URL}${path}`, {
        ...init,
        headers: { ...this.authHeaders(), ...(init.headers ?? {}) },
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Judge0 request failed (${res.status}): ${body.slice(0, 500)}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async submit(request: ExecuteCodeRequest): Promise<string> {
    const languageId = JUDGE0_LANGUAGE_IDS[request.language];
    const body = {
      source_code: request.sourceCode,
      language_id: languageId,
      stdin: request.stdin,
      cpu_time_limit: request.timeLimitSeconds,
      memory_limit: request.memoryLimitMb * 1024,
    };
    const response = await this.fetchJson<Judge0SubmissionResponse>(
      "/submissions?base64_encoded=false&wait=false",
      { method: "POST", body: JSON.stringify(body) },
    );
    return response.token;
  }

  async getSubmission(token: string, memoryLimitKb = Number.MAX_SAFE_INTEGER): Promise<ExecutionResult> {
    const data = await this.fetchJson<Judge0StatusResponse>(
      `/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time,memory,message`,
      { method: "GET" },
    );
    const statusId = data.status.id;
    const status: ExecutionStatus = IN_PROGRESS_STATUS_IDS.has(statusId) ? "processing" : "completed";
    const memoryKb = data.memory ?? null;

    return {
      token,
      status,
      verdict: status === "processing" ? "processing" : mapStatusToVerdict(statusId, memoryKb, memoryLimitKb),
      stdout: data.stdout,
      stderr: data.stderr,
      compileOutput: data.compile_output,
      timeSeconds: data.time ? Number(data.time) : null,
      memoryKb,
    };
  }

  async execute(request: ExecuteCodeRequest): Promise<ExecutionResult> {
    const token = await this.submit(request);
    const memoryLimitKb = request.memoryLimitMb * 1024;

    for (let attempt = 0; attempt < this.env.COMPILER_MAX_POLL_ATTEMPTS; attempt++) {
      const result = await this.getSubmission(token, memoryLimitKb);
      if (result.status !== "processing") {
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, this.env.COMPILER_POLL_INTERVAL_MS));
    }

    logger.warn({ token }, "Judge0 submission did not complete within the poll budget");
    return {
      token,
      status: "failed",
      verdict: "time_limit_exceeded",
      stdout: null,
      stderr: null,
      compileOutput: null,
      timeSeconds: null,
      memoryKb: null,
    };
  }
}
