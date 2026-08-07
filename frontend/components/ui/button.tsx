import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:shadow-lg border border-slate-800",
        primary: "btn-shimmer bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/30 border border-blue-500/30",
        secondary: "bg-white text-slate-800 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md",
        outline: "border border-slate-300 bg-white/60 backdrop-blur-sm text-slate-700 hover:bg-white hover:border-blue-400 hover:text-blue-700 shadow-sm",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        destructive: "btn-shimmer bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20 hover:from-red-500 hover:to-rose-500 hover:shadow-lg border border-red-500/30",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
