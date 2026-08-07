import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "blue" | "purple" | "green" | "amber";
}) {
  const accentClass =
    accent === "blue"
      ? "text-brand-blue bg-blue-500/10 border border-blue-500/20 shadow-blue-500/10"
      : accent === "purple"
        ? "text-brand-purple bg-purple-500/10 border border-purple-500/20 shadow-purple-500/10"
        : accent === "green"
          ? "text-green-600 bg-green-500/10 border border-green-500/20 shadow-green-500/10"
          : accent === "amber"
            ? "text-amber-600 bg-amber-500/10 border border-amber-500/20 shadow-amber-500/10"
            : "text-navy-900 bg-slate-500/10 border border-slate-500/20";

  return (
    <Card className="glass-card">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-navy-900 dark:text-white">{value}</p>
        </div>
        {Icon && (
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl backdrop-blur-md shadow-sm", accentClass)}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
