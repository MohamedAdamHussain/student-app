import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  variant?: 'default' | 'light'
}

export function Logo({ size = 'md', showText = true, variant = 'default' }: LogoProps) {
  const sizes = {
    sm: { box: 'w-8 h-8 text-sm', title: 'text-base', sub: 'text-[10px]' },
    md: { box: 'w-9 h-9 text-base', title: 'text-lg', sub: 'text-xs' },
    lg: { box: 'w-12 h-12 text-xl', title: 'text-2xl', sub: 'text-sm' },
  }
  const s = sizes[size]

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          'rounded-[10px] grid place-items-center text-white font-bold flex-shrink-0',
          s.box,
        )}
        style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
      >
        G
      </div>
      {showText && (
        <div>
          <div
            className={cn(
              'font-bold',
              s.title,
              variant === 'light' ? 'text-white' : 'text-ink-900 dark:text-ink-100',
            )}
          >
            GradShow
          </div>
          <div
            className={cn(
              'mt-[-2px]',
              s.sub,
              variant === 'light' ? 'text-white/80' : 'text-ink-400',
            )}
          >
            Student App
          </div>
        </div>
      )}
    </div>
  )
}
