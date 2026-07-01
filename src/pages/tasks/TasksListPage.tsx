import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckSquare, Trophy, Calendar, Clock, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockGetTasks } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { daysUntil, cn } from '@/lib/utils'
import type { Task, SubmissionStatus } from '@/types'

type FilterType = 'all' | 'hw' | 'final'

export function TasksListPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: tasks, isLoading } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: mockGetTasks,
  })

  const filtered = (tasks ?? []).filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false
    if (statusFilter === 'not_submitted' && t.mySubmissionStatus) return false
    if (statusFilter === 'pending' && t.mySubmissionStatus !== 'pending') return false
    if (statusFilter === 'accepted' && t.mySubmissionStatus !== 'accepted') return false
    return true
  })

  const counts = {
    all: tasks?.length ?? 0,
    hw: tasks?.filter((t) => t.type === 'hw').length ?? 0,
    final: tasks?.filter((t) => t.type === 'final').length ?? 0,
  }

  return (
    <AppShell title="المهام">
      <PageHeader
        title="مهام دفعتك"
        subtitle="كل مهام Batch 1 - 2026 · راجعها أسبوعياً وقدم تسليماتك قبل الـ Deadline"
        breadcrumbs={[{ label: 'الرئيسية', to: '/dashboard' }, { label: 'المهام' }]}
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div className="flex gap-1 p-1 bg-ink-100 dark:bg-ink-800 rounded-md">
          {(['all', 'hw', 'final'] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-all',
                filter === t
                  ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 shadow-sm'
                  : 'text-ink-500 hover:text-ink-900 dark:hover:text-ink-100',
              )}
            >
              {t === 'all' ? 'الكل' : t === 'hw' ? 'واجبات' : 'نهائية'}
              <span className="mr-1.5 text-xs opacity-70">({counts[t]})</span>
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select w-auto py-1.5 text-sm"
        >
          <option value="">كل الحالات</option>
          <option value="not_submitted">لم أسلّم بعد</option>
          <option value="pending">سلّمت · معلّق</option>
          <option value="accepted">سلّمت · مقبول</option>
        </select>

        <div className="mr-auto text-sm text-ink-400">إجمالي: {filtered.length} مهمة</div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="لا توجد مهام مطابقة"
          description="جرّب تغيير الفلاتر لعرض مهام أخرى"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <TaskCard task={task} />
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  )
}

function TaskCard({ task }: { task: Task }) {
  const days = daysUntil(task.batch?.end_date ?? task.createdAt)
  const isFinal = task.type === 'final'
  const statusMap: Record<SubmissionStatus | 'none', { variant: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
    none: { variant: 'neutral', label: 'لم تسلّم' },
    pending: { variant: 'warning', label: 'معلّق' },
    accepted: { variant: 'success', label: 'مقبول' },
    rejected: { variant: 'danger', label: 'مرفوض' },
  }
  const status = statusMap[task.mySubmissionStatus ?? 'none']

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block p-4 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-lg hover:border-ink-300 dark:hover:border-ink-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-11 h-11 rounded-md grid place-items-center flex-shrink-0',
            isFinal ? 'bg-warning-soft text-warning' : 'bg-info-soft text-info',
          )}
        >
          {isFinal ? <Trophy size={20} /> : <CheckSquare size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-ink-900 dark:text-ink-100 text-sm">
              {task.title}
            </span>
            <Badge variant={isFinal ? 'warning' : 'info'}>
              {isFinal ? 'Final' : 'HW'}
            </Badge>
            {task.videoRequired && (
              <Badge variant="info">يحتاج فيديو</Badge>
            )}
          </div>
          <div className="text-xs text-ink-400 truncate mb-1.5">
            {task.description?.substring(0, 100)}...
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {task.batch?.name}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              متبقي {Math.max(days, 0)} أيام
            </span>
            <span>·</span>
            <span>{task.skills.length} مهارات مُقيَّمة</span>
          </div>
        </div>

        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </Link>
  )
}
