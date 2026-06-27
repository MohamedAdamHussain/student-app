import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-6 text-ink-400', className)}>
      {Icon && (
        <div className="w-14 h-14 mx-auto mb-4 bg-ink-100 dark:bg-ink-800 rounded-full grid place-items-center">
          <Icon size={24} className="text-ink-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink-400 max-w-sm mx-auto mb-5">{description}</p>
      )}
      {action}
    </div>
  )
}
