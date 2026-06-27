import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  delta?: { value: string; type: 'up' | 'down' | 'neutral' }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
  delay?: number
}

const variantClasses = {
  default: 'text-ink-500 bg-ink-100 dark:bg-ink-800',
  success: 'text-success bg-success-soft',
  warning: 'text-warning bg-warning-soft',
  danger: 'text-danger bg-danger-soft',
  info: 'text-info bg-info-soft',
  accent: 'text-brand-500 bg-brand-50 dark:bg-brand-900/20',
}

// Animated counter
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 800
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  if (Number.isInteger(value)) {
    return <>{Math.round(display)}{suffix}</>
  }
  return <>{display.toFixed(1)}{suffix}</>
}

export function StatCard({ label, value, icon: Icon, delta, variant = 'default', delay = 0 }: StatCardProps) {
  const isNumeric = typeof value === 'number'
  const numericValue = isNumeric ? value : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-lg p-5"
    >
      <div className="flex items-center gap-2 text-[13px] text-ink-500 dark:text-ink-400 mb-2">
        <span className={cn('w-7 h-7 rounded-md grid place-items-center', variantClasses[variant])}>
          <Icon size={15} />
        </span>
        {label}
      </div>
      <div className="text-3xl font-bold text-ink-900 dark:text-ink-100 leading-tight">
        {isNumeric ? (
          <AnimatedNumber value={numericValue} suffix={numericValue % 1 !== 0 ? '' : ''} />
        ) : (
          value
        )}
      </div>
      {delta && (
        <div
          className={cn(
            'text-xs mt-2 inline-flex items-center gap-1',
            delta.type === 'up' && 'text-success',
            delta.type === 'down' && 'text-danger',
            delta.type === 'neutral' && 'text-ink-400',
          )}
        >
          {delta.type === 'up' && '↑'}
          {delta.type === 'down' && '↓'}
          {delta.value}
        </div>
      )}
    </motion.div>
  )
}
