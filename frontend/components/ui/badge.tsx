import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full transition-all whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-violet-950/70 text-violet-200 border border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.25)]",
        secondary:
          "bg-indigo-950/70 text-indigo-200 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]",
        destructive:
          "bg-rose-950/70 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
        outline:
          "border border-violet-900/40 text-violet-300 bg-[#0E091B]/80",
        success:
          "bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
