import type { CodingDifficulty } from "@tech-survivor/types";
import { Badge } from "@/components/ui/badge";

const DIFFICULTY_VARIANT: Record<CodingDifficulty, "success" | "warning" | "destructive"> = {
  easy: "success",
  medium: "warning",
  hard: "destructive",
};

const DIFFICULTY_LABEL: Record<CodingDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function DifficultyBadge({ difficulty }: { difficulty: CodingDifficulty }) {
  return <Badge variant={DIFFICULTY_VARIANT[difficulty]}>{DIFFICULTY_LABEL[difficulty]}</Badge>;
}
