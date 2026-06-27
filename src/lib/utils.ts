import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to Arabic
export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...opts,
  }).format(date)
}

export function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
  if (days < 7) return `منذ ${days} يوم`
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسبوع`
  return formatDate(dateStr)
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
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
