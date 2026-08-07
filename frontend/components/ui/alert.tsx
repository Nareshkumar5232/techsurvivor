import { AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "warning" | "error";

const ICONS: Record<AlertVariant, typeof Info> = { info: Info, warning: AlertTriangle, error: XCircle };
const STYLES: Record<AlertVariant, string> = {
  info: "border-blue-400/40 bg-blue-500/10 text-blue-900 backdrop-blur-md dark:text-blue-200 dark:border-blue-500/30",
  warning: "border-amber-400/40 bg-amber-500/10 text-amber-900 backdrop-blur-md dark:text-amber-200 dark:border-amber-500/30",
  error: "border-red-400/40 bg-red-500/10 text-red-900 backdrop-blur-md dark:text-red-200 dark:border-red-500/30",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = ICONS[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3.5 rounded-2xl border p-4 text-sm shadow-sm", STYLES[variant], className)}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 opacity-85" aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="mt-0.5 text-sm opacity-90">{children}</div>}
      </div>
    </div>
  );
}
