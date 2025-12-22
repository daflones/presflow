import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-purple-500/30 bg-purple-500/20 text-purple-400",
        secondary:
          "border-gray-600 bg-gray-700 text-gray-300",
        destructive:
          "border-red-500/30 bg-red-500/20 text-red-400",
        outline: "border-gray-600 text-gray-400",
        success: "border-green-500/30 bg-green-500/20 text-green-400",
        warning: "border-yellow-500/30 bg-yellow-500/20 text-yellow-400",
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
    <div className={badgeVariants({ variant, className })} {...props} />
  )
}

export { Badge, badgeVariants }
