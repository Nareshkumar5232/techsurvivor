import type { Verdict } from "@tech-survivor/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const VERDICT_LABELS: Record<Verdict, string> = {
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

const VERDICT_VARIANTS: Record<Verdict, BadgeProps["variant"]> = {
  queued: "secondary",
  processing: "info",
  accepted: "success",
  wrong_answer: "destructive",
  compilation_error: "destructive",
  runtime_error: "destructive",
  time_limit_exceeded: "warning",
  memory_limit_exceeded: "warning",
  output_limit_exceeded: "warning",
  internal_error: "destructive",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <Badge variant={VERDICT_VARIANTS[verdict]}>{VERDICT_LABELS[verdict]}</Badge>;
}
