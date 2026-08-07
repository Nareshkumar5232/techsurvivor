import type { Verdict } from "@tech-survivor/types";

/** Chart colors reuse the app's existing, already-in-use palette (tailwind.config.ts
 *  `verdict.*` and `brand.*`) rather than inventing a new one - status colors (verdict,
 *  qualification) are reserved and never repurposed for a plain magnitude series. */
export const CHART_COLORS = {
  blue: "#2563eb",
  purple: "#7c3aed",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  slate: "#64748b",
} as const;

export const VERDICT_CHART_COLORS: Record<Verdict, string> = {
  queued: CHART_COLORS.slate,
  processing: CHART_COLORS.blue,
  accepted: CHART_COLORS.green,
  wrong_answer: CHART_COLORS.red,
  compilation_error: CHART_COLORS.red,
  runtime_error: CHART_COLORS.red,
  time_limit_exceeded: CHART_COLORS.amber,
  memory_limit_exceeded: CHART_COLORS.amber,
  output_limit_exceeded: CHART_COLORS.amber,
  internal_error: CHART_COLORS.red,
};

export const VERDICT_CHART_LABELS: Record<Verdict, string> = {
  queued: "Queued",
  processing: "Processing",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  compilation_error: "Compilation Error",
  runtime_error: "Runtime Error",
  time_limit_exceeded: "Time Limit Exceeded",
  memory_limit_exceeded: "Memory Limit Exceeded",
  output_limit_exceeded: "Output Limit Exceeded",
  internal_error: "Internal Error",
};
