import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all shadow-sm",
  {
    variants: {
      variant: {
        default: "border-navy-700 bg-navy-900/80 text-white shadow-navy-900/20",
        secondary: "border-slate-300/60 bg-white/60 text-navy-900 dark:bg-slate-800/60 dark:text-slate-200 dark:border-white/10",
        success: "border-green-400/40 bg-green-500/15 text-green-700 dark:text-green-300 dark:bg-green-500/20",
        destructive: "border-red-400/40 bg-red-500/15 text-red-700 dark:text-red-300 dark:bg-red-500/20",
        warning: "border-amber-400/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 dark:bg-amber-500/20",
        info: "border-blue-400/40 bg-blue-500/15 text-blue-700 dark:text-blue-300 dark:bg-blue-500/20",
        outline: "border-slate-300/80 bg-white/40 text-navy-900 dark:border-white/20 dark:text-slate-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
