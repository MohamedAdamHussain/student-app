import { useMemo } from 'react'
import { cn, gradientFor, getInitials } from '@/lib/utils'
import { assetUrl } from '@/lib/api'

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
  // ✨ FIX #1: حوّل روابط avatar النسبية لروابط مطلقة عبر assetUrl
  // (مع Vite proxy في التطوير، يُرجِعها كما هي؛ في الإنتاج يُضيف STORAGE_BASE)
  const resolvedSrc = useMemo(() => assetUrl(src), [src])

  return (
    <div
      className={cn(
        'rounded-full grid place-items-center text-white font-bold flex-shrink-0',
        sizeClasses[size],
        className,
      )}
      style={resolvedSrc ? undefined : { background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {resolvedSrc ? (
        <img src={resolvedSrc} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
