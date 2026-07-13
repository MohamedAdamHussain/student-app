import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PaginationMeta } from '@/lib/api'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  loading?: boolean
}

/**
 * ✨ Stage 7: Pagination component
 *
 * يعرض أزرار التنقل بين الصفحات مع معلومات إجمالية.
 * يدعم:
 * - Previous/Next
 * - First/Last (لو > 5 صفحات)
 * - أرقام الصفحات (مع truncation للقوائم الكبيرة)
 * - معلومات "عرض X-Y من Z"
 */
export function Pagination({ meta, onPageChange, loading }: PaginationProps) {
  // ✨ لو صفحة واحدة فقط، لا نعرض pagination
  if (meta.last_page <= 1 || meta.total === 0) {
    return (
      <div className="text-center text-xs text-ink-400 py-4">
        {meta.total > 0
          ? `عرض ${meta.total} عنصر`
          : 'لا توجد نتائج'}
      </div>
    )
  }

  const { current_page, last_page, from, to, total } = meta

  // ✨ حساب أرقام الصفحات المعروضة (truncation للقوائم الكبيرة)
  const pages = getPageNumbers(current_page, last_page)

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap py-4 border-t border-ink-200 dark:border-ink-800">
      {/* ✨ معلومات إجمالية */}
      <div className="text-xs text-ink-400">
        عرض <strong className="text-ink-600 dark:text-ink-300">{from}</strong>–
        <strong className="text-ink-600 dark:text-ink-300">{to}</strong> من{' '}
        <strong className="text-ink-600 dark:text-ink-300">{total}</strong>
      </div>

      {/* ✨ أزرار التنقل */}
      <div className="flex items-center gap-1">
        {/* First page (لو > 5 صفحات) */}
        {last_page > 5 && current_page > 3 && (
          <button
            onClick={() => onPageChange(1)}
            disabled={loading || current_page === 1}
            className="p-1.5 rounded-md text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="الصفحة الأولى"
          >
            <ChevronsRight size={16} />
          </button>
        )}

        {/* Previous */}
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={loading || current_page === 1}
          className="p-1.5 rounded-md text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight size={16} />
        </button>

        {/* Page numbers */}
        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-ink-400 text-sm">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(Number(page))}
              disabled={loading}
              className={cn(
                'min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors',
                page === current_page
                  ? 'bg-brand-500 text-white'
                  : 'text-ink-500 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800',
                loading && 'opacity-50 cursor-not-allowed',
              )}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={loading || current_page === last_page}
          className="p-1.5 rounded-md text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Last page */}
        {last_page > 5 && current_page < last_page - 2 && (
          <button
            onClick={() => onPageChange(last_page)}
            disabled={loading || current_page === last_page}
            className="p-1.5 rounded-md text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="الصفحة الأخيرة"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * ✨ حساب أرقام الصفحات المعروضة مع truncation
 * مثال: [1, '...', 4, 5, 6, '...', 10]
 */
function getPageNumbers(current: number, last: number): (number | string)[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = []

  // دائماً اعرض الصفحة 1
  pages.push(1)

  if (current > 3) {
    pages.push('...')
  }

  // الصفحات حول current
  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < last - 2) {
    pages.push('...')
  }

  // دائماً اعرض الصفحة الأخيرة
  pages.push(last)

  return pages
}
