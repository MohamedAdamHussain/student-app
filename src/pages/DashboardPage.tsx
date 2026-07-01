import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText,
  CheckCircle2,
  Clock,
  Star,
  Plus,
  Trophy,
  CheckSquare,
  Users,
  User as UserIcon,
  Pencil,
  ArrowLeft,
  Calendar,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { mockGetDashboardStats, mockGetTasks, mockGetSubmissions } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { daysUntil, formatRelative } from '@/lib/utils'
import type { Task, Submission, SubmissionStatus } from '@/types'

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: mockGetDashboardStats,
  })
  const { data: tasks } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: mockGetTasks,
  })
  const { data: submissions } = useQuery({
    queryKey: queryKeys.submissions,
    queryFn: mockGetSubmissions,
  })

  const upcomingTasks = (tasks ?? [])
    .filter((t) => t.mySubmissionStatus === null || t.mySubmissionStatus === 'pending')
    .slice(0, 3)

  const recentSubmissions = (submissions ?? []).slice(0, 4)

  return (
    <AppShell title="لوحة التحكم">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl p-7 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
      >
        <div className="absolute -top-1/2 left-1/4 w-1/2 h-[200%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)' }} />
        <div className="relative z-10 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold mb-1.5">أهلاً أحمد 👋</h2>
            <p className="text-sm opacity-90 max-w-md leading-relaxed">
              لديك <strong>3 مهام</strong> قادمة الأسبوع القادم، و <strong>تقديم واحد</strong> في انتظار المراجعة. واصل التقدم!
            </p>
          </div>
          <Link to="/submissions/new">
            <Button size="lg" className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20">
              <Plus size={16} />
              تقديم جديد
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {statsLoading || !stats ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              label="إجمالي التقديمات"
              value={stats.total_submissions}
              icon={FileText}
              variant="accent"
              delta={{ value: '+3 هذا الشهر', type: 'up' }}
              delay={0}
            />
            <StatCard
              label="مقبولة"
              value={stats.accepted}
              icon={CheckCircle2}
              variant="success"
              delta={{ value: '67% نسبة القبول', type: 'up' }}
              delay={0.05}
            />
            <StatCard
              label="معلّقة"
              value={stats.pending}
              icon={Clock}
              variant="warning"
              delta={{ value: 'بانتظار المراجعة', type: 'neutral' }}
              delay={0.1}
            />
            <StatCard
              label="متوسط الدرجات"
              value={stats.average_score}
              icon={Star}
              variant="info"
              delta={{ value: '+0.6 عن الشهر الماضي', type: 'up' }}
              delay={0.15}
            />
          </>
        )}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>المهام القادمة</CardTitle>
            <Link to="/tasks">
              <Button variant="ghost" size="sm">
                عرض الكل
                <ArrowLeft size={14} />
              </Button>
            </Link>
          </CardHeader>

          <div className="flex flex-col gap-3">
            {upcomingTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>التقديمات الحديثة</CardTitle>
            <Link to="/submissions">
              <Button variant="ghost" size="sm">عرض الكل</Button>
            </Link>
          </CardHeader>

          <div className="flex flex-col gap-1">
            {recentSubmissions.map((sub) => (
              <SubmissionRow key={sub.id} submission={sub} />
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold mt-8 mb-4">روابط سريعة</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { to: '/profile/edit', title: 'تعديل الملف', desc: 'أكمل ملفك بنسبة 100%', icon: Pencil },
          { to: '/submissions', title: 'عرض التقديمات', desc: 'تابع حالة كل تقديم', icon: FileText },
          { to: '/teams', title: 'فرقي', desc: 'إدارة الفرق للمهام الجماعية', icon: Users },
          { to: '/hackathons', title: 'الهاكاثونات', desc: 'شارك واكسب نقاطاً إضافية', icon: Trophy },
        ].map((action, i) => (
          <motion.div
            key={action.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Link to={action.to}>
              <Card hoverable className="h-full">
                <div className="w-11 h-11 rounded-md bg-brand-50 dark:bg-brand-900/20 text-brand-500 grid place-items-center mb-4">
                  <action.icon size={22} />
                </div>
                <div className="font-semibold text-ink-900 dark:text-ink-100 mb-1">{action.title}</div>
                <div className="text-xs text-ink-400">{action.desc}</div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </AppShell>
  )
}

function TaskRow({ task }: { task: Task }) {
  const days = daysUntil(task.batch?.end_date ?? task.createdAt)
  const iconBg =
    task.type === 'final'
      ? 'bg-warning-soft text-warning'
      : 'bg-info-soft text-info'
  const icon = task.type === 'final' ? <Trophy size={20} /> : <CheckSquare size={20} />

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="flex items-center gap-4 p-4 border border-ink-200 dark:border-ink-800 rounded-lg hover:border-ink-300 dark:hover:border-ink-700 hover:shadow-sm transition-all"
    >
      <div className={`w-11 h-11 rounded-md grid place-items-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <div className="font-semibold text-ink-900 dark:text-ink-100 text-sm">{task.title}</div>
          <Badge variant={task.type === 'final' ? 'warning' : 'info'}>
            {task.type === 'final' ? 'Final' : 'HW'}
          </Badge>
        </div>
        <div className="text-xs text-ink-400 truncate">
          {task.description?.substring(0, 80)}...
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-400">
          <Calendar size={12} />
          <span>متبقي {Math.max(days, 0)} أيام</span>
        </div>
      </div>
      <Button variant="secondary" size="sm" className="flex-shrink-0">عرض</Button>
    </Link>
  )
}

function SubmissionRow({ submission }: { submission: Submission }) {
  const statusConfig: Record<SubmissionStatus, { variant: 'success' | 'warning' | 'danger'; label: string; icon: React.ReactNode }> = {
    accepted: { variant: 'success', label: 'مقبول', icon: <CheckCircle2 size={12} /> },
    pending: { variant: 'warning', label: 'معلّق', icon: <Clock size={12} /> },
    rejected: { variant: 'danger', label: 'مرفوض', icon: <Star size={12} /> },
  }
  const status = statusConfig[submission.status]
  const title = submission.task?.title ?? submission.hackathon?.title ?? 'تقديم'

  return (
    <Link
      to={`/submissions/${submission.id}`}
      className="flex items-center justify-between gap-3 py-3 border-b border-ink-100 dark:border-ink-800 last:border-0 hover:bg-ink-50 dark:hover:bg-ink-800/50 -mx-2 px-2 rounded-md transition-colors"
    >
      <div className="min-w-0">
        <div className="font-semibold text-sm truncate">{title}</div>
        <div className="text-xs text-ink-400">{formatRelative(submission.createdAt)}</div>
      </div>
      <Badge variant={status.variant}>
        {status.icon}
        {status.label}
        {submission.score && ` · ${submission.score}/100`}
      </Badge>
    </Link>
  )
}
