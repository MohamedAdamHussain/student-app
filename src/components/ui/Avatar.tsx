import { cn, gradientFor, getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-30 h-30 text-4xl',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [from, to] = gradientFor(name)
  return (
    <div
      className={cn(
        'rounded-full grid place-items-center text-white font-bold flex-shrink-0',
        sizeClasses[size],
        className,
      )}
      style={src ? undefined : { background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
