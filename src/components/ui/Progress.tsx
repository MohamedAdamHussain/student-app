import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0-100
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantClasses = {
  default: 'bg-brand-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function Progress({ value, variant = 'default', className }: ProgressProps) {
  return (
    <div
      className={cn('h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', variantClasses[variant])}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}
