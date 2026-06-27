import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
  accent: 'badge-accent',
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return <span className={cn('badge', variants[variant], className)} {...props} />
}
