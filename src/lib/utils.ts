import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ✨ التحقق من صحة التاريخ قبل استخدامه
 * يعالج: null, undefined, ""، تواريخ غير صالحة
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * تحويل أي قيمة (string, null, undefined) إلى Date صالحة أو null
 */
function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null

  // محاولة 1: مباشرة
  let date = new Date(dateStr)
  if (isValidDate(date)) return date

  // محاولة 2: استبدال المسافة بـ T (للصيغة SQL)
  if (typeof dateStr === 'string' && dateStr.includes(' ')) {
    date = new Date(dateStr.replace(' ', 'T'))
    if (isValidDate(date)) return date
  }

  // محاولة 3: إضافة Z لو فيه T بدون timezone
  if (typeof dateStr === 'string' && dateStr.includes('T') && !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)) {
    date = new Date(dateStr + 'Z')
    if (isValidDate(date)) return date
  }

  return null
}

// Format date to Arabic (defensive — handles invalid dates)
export function formatDate(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  const date = parseDate(dateStr)
  if (!date) return '—'

  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...opts,
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatRelative(dateStr: string | null | undefined): string {
  const date = parseDate(dateStr)
  if (!date) return '—'

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  // المستقبل (مثلاً: deadline قادم)
  if (diff < 0) {
    const absDays = Math.abs(days)
    if (absDays < 1) return 'قريباً'
    if (absDays < 7) return `بعد ${absDays} يوم`
    if (absDays < 30) return `بعد ${Math.floor(absDays / 7)} أسبوع`
    return formatDate(dateStr)
  }

  if (seconds < 60) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
  if (days < 7) return `منذ ${days} يوم`
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسبوع`
  return formatDate(dateStr)
}

export function daysUntil(dateStr: string | null | undefined): number {
  const target = parseDate(dateStr)
  if (!target) return 0
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getInitials(name: string): string {
  return name.charAt(0)
}

// Pick a deterministic gradient color from a name
const COLORS = [
  ['#4F46E5', '#7C3AED'],
  ['#10B981', '#06B6D4'],
  ['#F59E0B', '#EF4444'],
  ['#3B82F6', '#8B5CF6'],
  ['#EC4899', '#F59E0B'],
  ['#14B8A6', '#22C55E'],
  ['#A855F7', '#6366F1'],
  ['#F97316', '#EC4899'],
]

export function gradientFor(seed: string | number): [string, string] {
  const str = String(seed)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = COLORS[Math.abs(hash) % COLORS.length]
  return [colors[0], colors[1]]
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}
