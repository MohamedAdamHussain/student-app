import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText, CheckCircle2, Clock, XCircle, Star, Plus,
  Eye, Trash2, Trophy, CheckSquare,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Pagination } from '@/components/common/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { mockGetSubmissions, mockGetDashboardStats } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { useDeleteSubmission } from '@/hooks/useSubmissions'
import { useConfirm } from '@/components/common/ConfirmDialog'
import { formatRelative, cn } from '@/lib/utils'
import { TeamBadge } from './TeamBadge'
import type { Submission, SubmissionStatus } from '@/types'

type StatusFilter = '' | SubmissionStatus
type TypeFilter = '' | 'hw' | 'hackathon'

export function SubmissionsListPage() {
  const confirm = useConfirm()
  const deleteMutation = useDeleteSubmission()
  const navigate = useNavigate()  // ✨ P0: استبدل window.location بـ navigate
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('')
  const [page, setPage] = useState(1)

  // ✨ Stage 7: PaginatedResponse + page parameter
  const { data: submissionsData, isLoading } = useQuery({
    queryKey: [...queryKeys.submissions, page],
    queryFn: () => mockGetSubmissions({ page }),
  })
  const { data: stats } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: mockGetDashboardStats,
  })

  // ✨ Stage 7: استخرج data و meta
  const submissions = submissionsData?.data ?? []
  const meta = submissionsData?.meta

  const handleDelete = async (submission: Submission) => {
    const ok = await confirm({
      title: 'حذف التقديم',
      message: `هل أنت متأكد من حذف تقديم "${submission.task?.title ?? submission.hackathon?.title ?? 'التقديم'}"؟`,
      confirmText: 'حذف',
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(submission.id)
  }

  const filtered = submissions.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false
    // ✨ P1-A: حذف 'final' — كل المهام HW فقط
    if (typeFilter === 'hw' && !(s.task && s.task.type === 'hw')) return false
    if (typeFilter === 'hackathon' && !s.hackathonId) return false
    return true
  })

  return (
    <AppShell title="تقديماتي">
      <PageHeader
        title="تقديماتي"
        subtitle={`إجمالي ${stats?.totalSubmissions ?? 0} تقديماً · ${stats?.accepted ?? 0} مقبولة · ${stats?.pending ?? 0} معلّقة`}
        breadcrumbs={[{ label: 'الرئيسية', to: '/dashboard' }, { label: 'تقديماتي' }]}
        actions={
          <Link to="/submissions/new">
            <Button size="sm">
              <Plus size={14} />
              تقديم جديد
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="مقبولة" value={stats?.accepted ?? 0} icon={CheckCircle2} variant="success" delay={0} />
        <StatCard label="معلّقة" value={stats?.pending ?? 0} icon={Clock} variant="warning" delay={0.05} />
        <StatCard label="مرفوضة" value={stats?.rejected ?? 0} icon={XCircle} variant="danger" delay={0.1} />
        <StatCard
          label="متوسط الدرجات"
          value={stats?.averageScore ?? 0}
          icon={Star}
          variant="info"
          delay={0.15}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="form-select w-auto py-1.5 text-sm"
        >
          <option value="">كل الحالات</option>
          <option value="accepted">مقبولة</option>
          <option value="pending">معلّقة</option>
          <option value="rejected">مرفوضة</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="form-select w-auto py-1.5 text-sm"
        >
          <option value="">كل الأنواع</option>
          <option value="hw">واجب (HW)</option>
          <option value="hackathon">هاكاثون</option>
        </select>
        <div className="mr-auto text-sm text-ink-400">{filtered.length} نتيجة</div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد تقديمات مطابقة"
          description="جرّب تغيير الفلاتر أو قدّم عملاً جديداً"
          action={
            <Link to="/submissions/new">
              <Button size="sm">
                <Plus size={14} />
                تقديم جديد
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50 dark:bg-ink-800/50 text-xs uppercase text-ink-500">
                  <th className="text-right p-3 font-semibold">المشروع</th>
                  <th className="text-right p-3 font-semibold">النوع</th>
                  <th className="text-right p-3 font-semibold">التاريخ</th>
                  <th className="text-right p-3 font-semibold">الحالة</th>
                  <th className="text-right p-3 font-semibold">الدرجة</th>
                  <th className="text-right p-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => (
                  <SubmissionRow
                    key={sub.id}
                    submission={sub}
                    delay={i * 0.03}
                    onDelete={handleDelete}
                    deleting={deleteMutation.isPending && deleteMutation.variables === sub.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✨ Stage 7: Pagination controls */}
      {meta && (
        <Pagination
          meta={meta}
          onPageChange={(p) => setPage(p)}
          loading={isLoading}
        />
      )}
    </AppShell>
  )
}

function SubmissionRow({
  submission,
  delay,
  onDelete,
  deleting,
}: {
  submission: Submission
  delay: number
  // ✨ P1-6: تفعيل زر الحذف
  onDelete?: (submission: Submission) => void
  deleting?: boolean
}) {
  const statusConfig: Record<SubmissionStatus, { variant: 'success' | 'warning' | 'danger'; label: string; icon: typeof CheckCircle2 }> = {
    accepted: { variant: 'success', label: 'مقبول', icon: CheckCircle2 },
    pending: { variant: 'warning', label: 'معلّق', icon: Clock },
    rejected: { variant: 'danger', label: 'مرفوض', icon: XCircle },
  }
  const status = statusConfig[submission.status]
  const StatusIcon = status.icon

  const isHackathon = !!submission.hackathonId
  // ✨ P1-A: حذف 'final' — كل المهام HW فقط
  const title = submission.task?.title ?? submission.hackathon?.title ?? 'تقديم'
  const Icon = isHackathon ? Trophy : CheckSquare

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="border-b border-ink-100 dark:border-ink-800 last:border-0 hover:bg-ink-50 dark:hover:bg-ink-800/50 cursor-pointer"
      onClick={() => window.location.assign(`/submissions/${submission.id}`)}
    >
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-md grid place-items-center flex-shrink-0',
            isHackathon ? 'bg-warning-soft text-warning' : 'bg-info-soft text-info',
          )}>
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{title}</div>
            <div className="text-xs text-ink-400 flex items-center gap-1 flex-wrap">
              {isHackathon ? 'هاكاثون' : submission.task ? `HW #${submission.task.id}` : ''}
              {submission.teamId ? ' · فِرقي' : ' · فردي'}
              {/* ✨ TEAM EVALUATION: عرض مساهمة المستخدم في المشاريع الجماعية */}
              {submission.isTeamSubmission && submission.myContribution != null && (
                <span className="text-brand-500 font-medium">
                  · مساهمتك: {submission.myContribution}%
                </span>
              )}
              {submission.isTeamSubmission && submission.myRole && (
                <span className="text-accent-500">
                  · {submission.myRole === 'leader' ? 'قائد' : 'عضو'}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-1">
          {/* ✨ P1-A: حذف 'final' — Hackathon أو HW فقط */}
          <Badge variant={isHackathon ? 'warning' : 'info'}>
            {isHackathon ? 'Hackathon' : 'HW'}
          </Badge>
          {/* ✨ TEAM EVALUATION: بادج "مشروع جماعي" */}
          <TeamBadge submission={submission} />
        </div>
      </td>
      <td className="p-3 text-sm text-ink-400">{formatRelative(submission.createdAt)}</td>
      <td className="p-3">
        <Badge variant={status.variant}>
          <StatusIcon size={12} />
          {status.label}
          {submission.isFeatured && ' · مميّز ⭐'}
        </Badge>
      </td>
      <td className="p-3">
        {submission.score != null ? (
          <span className="font-bold text-success">
            {/* ✨ P0-1: score أصلاً من 10 (بعد توحيد الـ backend) */}
            {submission.score.toFixed(1)}/10
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex gap-1 justify-end">
          <Link to={`/submissions/${submission.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="!p-2 !w-8 !h-8">
              <Eye size={14} />
            </Button>
          </Link>
          {/* ✨ P1-6: زر الحذف مُفعّل (كان decorative) — فقط للتقديمات المعلّقة */}
          {submission.status === 'pending' && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="!p-2 !w-8 !h-8 text-danger hover:bg-danger-soft"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(submission)
              }}
              aria-label="حذف التقديم"
            >
              {deleting ? (
                <span className="w-3.5 h-3.5 border-2 border-danger/40 border-t-danger rounded-full animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </Button>
          )}
        </div>
      </td>
    </motion.tr>
  )
}
