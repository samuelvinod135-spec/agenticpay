import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl border border-violet-900/30 bg-[#06040A] px-3 py-1 text-sm text-[#F3F0FF] shadow-inner transition-all duration-200 placeholder:text-violet-400/40 focus-visible:outline-none focus-visible:border-violet-500/70 focus-visible:ring-1 focus-visible:ring-violet-500/50 focus-visible:shadow-[0_0_15px_rgba(124,58,237,0.3)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
