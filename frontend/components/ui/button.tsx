import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-xs font-mono font-semibold transition-all select-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.35)]",
        neon:
          "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] border border-violet-400/30",
        outline:
          "border border-violet-900/40 bg-[#0E091B]/80 text-[#F3F0FF] hover:bg-[#150E28] hover:border-violet-700/50 shadow-sm",
        secondary:
          "bg-[#150E28] text-violet-200 border border-violet-900/30 hover:bg-violet-950/80 hover:text-white",
        ghost:
          "text-slate-300 hover:text-white hover:bg-[#150E28]",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
