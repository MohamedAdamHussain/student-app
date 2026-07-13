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
  Pencil,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Mail,
  MailCheck,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { mockGetDashboardStats, mockGetTasks, mockGetSubmissions } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { daysUntil, formatRelative } from '@/lib/utils'
import { TeamBadge } from './submissions/TeamBadge'
import type { Task, Submission, SubmissionStatus } from '@/types'
import { useState, useEffect } from 'react'

export function DashboardPage() {
  // ✨ جلب بيانات المستخدم الحقيقي من AuthContext
  const { user } = useAuth()

  // ✨ B6: حالة إخفاء banner التحقق بالبريد (يُحفظ في localStorage حتى لا يزعج المستخدم)
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false)
  const isEmailVerified = !!user?.emailVerifiedAt
  const showEmailBanner = !isEmailVerified && !emailBannerDismissed

  // ✨ إعادة ضبط الإخفاء لو تغيّر المستخدم (للطالب جديد)
  useEffect(() => {
    setEmailBannerDismissed(false)
  }, [user?.id])

  const dismissEmailBanner = () => {
    setEmailBannerDismissed(true)
    // ✨ نحفظ القرار لمدة 7 أيام (بعد ذلك نُذكّر مرة أخرى)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    localStorage.setItem('gradshow_email_banner_dismissed_until', String(Date.now() + sevenDaysMs))
  }



  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: mockGetDashboardStats,
  })
  const { data: tasksData } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => mockGetTasks(),
  })
  const { data: submissionsData } = useQuery({
    queryKey: queryKeys.submissions,
    queryFn: () => mockGetSubmissions(),
  })

  // ✨ Stage 7: استخرج data من PaginatedResponse
  const tasks = tasksData?.data ?? []
  const submissions = submissionsData?.data ?? []

  // ✨ فلترة مرنة: المهام غير المُسلّمة أو معلّقة
  const upcomingTasks = tasks
    .filter((t) => !t.mySubmissionStatus || t.mySubmissionStatus === 'pending')
    .slice(0, 3)

  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'pending').length
  const recentSubmissions = submissions.slice(0, 4)

  // ✨ معالجة دفاعية: اسم المستخدم الحقيقي (مع fallback)
  const displayName = user?.name ?? user?.studentProfile?.name ?? 'طالب'
  const firstName = displayName.split(' ')[0]

  return (
    <AppShell title="لوحة التحكم">
      {/* ✨ B6: Banner تذكيري للتحقق من البريد — يظهر فقط لغير المُتحقَّقين */}
      {showEmailBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl p-4 flex items-center justify-between gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 grid place-items-center flex-shrink-0">
              <Mail size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-0.5">
                لم تؤكّد بريدك الإلكتروني بعد
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                تأكيد البريد يساعدنا في حماية حسابك واسترجاعه عند نسيان كلمة المرور.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/verify-email">
              <Button size="sm" variant="secondary">
                <MailCheck size={14} />
                تأكيد الآن
              </Button>
            </Link>
            <button
              onClick={dismissEmailBanner}
              className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              aria-label="إخفاء التذكير"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Welcome Banner — ✨ ديناميكي بالكامل */}
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
            {/* ✨ الاسم الحقيقي للمستخدم */}
            <h2 className="text-2xl font-bold mb-1.5">أهلاً {firstName} 👋</h2>
            <p className="text-sm opacity-90 max-w-md leading-relaxed">
              {upcomingTasks.length > 0 || pendingSubmissionsCount > 0 ? (
                <>
                  لديك <strong>{upcomingTasks.length} مهمة</strong> بحاجة لإكمال
                  {pendingSubmissionsCount > 0 && (
                    <>، و <strong>{pendingSubmissionsCount} تقديم</strong> في انتظار المراجعة.</>
                  )}
                  واصل التقدم!
                </>
              ) : (
                <>أنت محدّث! لا توجد مهام معلّقة أو تقديمات بانتظار المراجعة. 🎉</>
              )}
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

      {/* Stats Grid — ✨ استخدام camelCase مع fallback */}
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
              value={stats.totalSubmissions ?? 0}
              icon={FileText}
              variant="accent"
              delay={0}
            />
            <StatCard
              label="مقبولة"
              value={stats.accepted ?? 0}
              icon={CheckCircle2}
              variant="success"
              delay={0.05}
            />
            <StatCard
              label="معلّقة"
              value={stats.pending ?? 0}
              icon={Clock}
              variant="warning"
              delay={0.1}
            />
            <StatCard
              label="متوسط الدرجات"
              value={stats.averageScore ?? 0}
              icon={Star}
              variant="info"
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
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6 text-ink-400 text-sm">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-success" />
                لا توجد مهام معلّقة — أنت محدّث!
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))
            )}
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
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-6 text-ink-400 text-sm">
                <FileText size={28} className="mx-auto mb-2 text-ink-300" />
                لا توجد تقديمات بعد
              </div>
            ) : (
              recentSubmissions.map((sub) => (
                <SubmissionRow key={sub.id} submission={sub} />
              ))
            )}
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
  // ✨ معالجة دفاعية: قد تكون batch?.endDate undefined
  const days = daysUntil(task.batch?.endDate ?? task.createdAt)
  // ✨ لا يوجد نوع 'final' بعد — كل المهام 'hw' فقط
  const iconBg = 'bg-info-soft text-info'
  const icon = <CheckSquare size={20} />

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
          <Badge variant="info">HW</Badge>
          {task.mySubmissionStatus === 'pending' && (
            <Badge variant="warning">معلّق</Badge>
          )}
        </div>
        <div className="text-xs text-ink-400 truncate">
          {task.description?.substring(0, 80)}...
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-400">
          <Calendar size={12} />
          <span>
            {days > 0 ? `متبقي ${days} أيام` : 'انتهى الموعد'}
          </span>
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
    rejected: { variant: 'danger', label: 'مرفوض', icon: <AlertCircle size={12} /> },
  }
  const status = statusConfig[submission.status]
  const title = submission.task?.title ?? submission.hackathon?.title ?? 'تقديم'

  return (
    <Link
      to={`/submissions/${submission.id}`}
      className="flex items-center justify-between gap-3 py-3 border-b border-ink-100 dark:border-ink-800 last:border-0 hover:bg-ink-50 dark:hover:bg-ink-800/50 -mx-2 px-2 rounded-md transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-sm truncate">{title}</span>
          {/* ✨ TEAM EVALUATION: بادج "مشروع جماعي / فردي" */}
          <TeamBadge submission={submission} />
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400 flex-wrap">
          <span>{formatRelative(submission.createdAt)}</span>
          {/* ✨ TEAM EVALUATION: عرض "مساهمتك" للمشاريع الجماعية */}
          {submission.isTeamSubmission && submission.myContribution != null && (
            <span className="text-brand-500 font-medium">
              · مساهمتك: {submission.myContribution}%
            </span>
          )}
          {/* ✨ TEAM EVALUATION: عرض دور المستخدم في الفريق */}
          {submission.isTeamSubmission && submission.myRole && (
            <span className="text-accent-500">
              · {submission.myRole === 'leader' ? 'قائد' : 'عضو'}
            </span>
          )}
        </div>
      </div>
      <Badge variant={status.variant}>
        {status.icon}
        {status.label}
        {/* ✨ P0-1: score أصلاً من 10 (بعد توحيد الـ backend) — لا قسمة */}
        {submission.score != null && ` · ${submission.score.toFixed(1)}/10`}
      </Badge>
    </Link>
  )
}
