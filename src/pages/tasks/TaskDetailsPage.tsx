import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy,
  CheckSquare,
  Calendar,
  Clock,
  Users,
  Video,
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { mockGetTask } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { daysUntil } from '@/lib/utils'

export function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)

  const { data: task, isLoading } = useQuery({
    queryKey: queryKeys.task(taskId),
    queryFn: () => mockGetTask(taskId),
    enabled: !!taskId,
  })

  if (isLoading || !task) {
    return (
      <AppShell title="تفاصيل المهمة">
        <Skeleton className="h-96" />
      </AppShell>
    )
  }

  const isFinal = task.type === 'final'
  const days = daysUntil(task.batch?.end_date ?? task.createdAt)
  const hasSubmitted = !!task.mySubmissionStatus

  return (
    <AppShell title="تفاصيل المهمة">
      <PageHeader
        title={task.title}
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'المهام', to: '/tasks' },
          { label: task.title },
        ]}
        actions={
          <>
            <Link to="/tasks">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={14} />
                رجوع
              </Button>
            </Link>
            {!hasSubmitted && (
              <Link to="/submissions/new">
                <Button size="sm">
                  <Plus size={14} />
                  تسليم جديد
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Task Header Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isFinal ? 'warning' : 'info'}>
                {isFinal ? 'Final' : 'HW'}
              </Badge>
              {task.videoRequired && (
                <Badge variant="info">
                  <Video size={12} />
                  يحتاج فيديو
                </Badge>
              )}
              <Badge variant={task.isTeam ? 'accent' : 'neutral'}>
                <Users size={12} />
                {task.isTeam ? 'فِرقي' : 'فردي'}
              </Badge>
            </div>
            <Badge variant={days < 7 ? 'warning' : 'neutral'}>
              <Clock size={12} />
              متبقي {Math.max(days, 0)} أيام
            </Badge>
          </div>

          <h1 className="text-3xl font-extrabold mb-2">{task.title}</h1>
          <div className="text-ink-500 mb-6">
            مهمة ضمن {task.batch?.name} · أُنشئت بواسطة المسؤول
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-ink-400 uppercase font-semibold mb-1.5">الموعد النهائي</div>
              <div className="font-bold text-lg flex items-center gap-1">
                <Calendar size={16} className="text-warning" />
                {task.batch?.end_date}
              </div>
              <div className="text-sm text-warning mt-0.5">{Math.max(days, 0)} أيام متبقية</div>
            </div>
            <div>
              <div className="text-xs text-ink-400 uppercase font-semibold mb-1.5">نوع العمل</div>
              <div className="font-bold text-lg">
                {task.isTeam ? `فِرقي (حتى ${task.maxTeamSize})` : 'فردي'}
              </div>
              <div className="text-sm text-ink-400 mt-0.5">
                {task.isTeam ? 'يتطلب فريقاً' : 'لا يتطلب فريقاً'}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-400 uppercase font-semibold mb-1.5">حالتي</div>
              <div className="font-bold text-lg">
                {hasSubmitted
                  ? task.mySubmissionStatus === 'accepted'
                    ? 'مقبول ✓'
                    : task.mySubmissionStatus === 'pending'
                    ? 'معلّق'
                    : 'مرفوض'
                  : 'لم أُسلّم'}
              </div>
              <div className="text-sm text-ink-400 mt-0.5">
                {hasSubmitted ? 'تم التسليم' : 'جاهز للتسليم'}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Left */}
        <div className="space-y-5">
          <Card>
            <CardTitle className="mb-4">وصف المهمة</CardTitle>
            <div className="text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
              {task.description}
            </div>
          </Card>

          {/* Required Skills */}
          <Card>
            <CardTitle className="mb-1">المهارات المُقيَّمة</CardTitle>
            <p className="text-sm text-ink-400 mb-4">
              سيُقيّم تسليمك بناءً على هذه المهارات المحددة من المسؤول
            </p>
            <div className="grid grid-cols-2 gap-3">
              {task.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-3 p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md"
                >
                  <div className="w-8 h-8 bg-brand-50 dark:bg-brand-900/20 text-brand-500 rounded grid place-items-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{skill.name}</div>
                    <div className="text-xs text-ink-400">
                      {skill.type === 'technical' ? 'تقنية' : 'شخصية'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* My Submission Status */}
          {!hasSubmitted ? (
            <Card className="bg-warning-soft border-warning-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-warning rounded-md grid place-items-center text-white">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <div className="font-bold text-warning">لم تُسلِّم بعد</div>
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    آخر موعد للتسليم: {task.batch?.end_date}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link to="/submissions/new">
                  <Button>
                    <Plus size={14} />
                    تسليم الآن
                  </Button>
                </Link>
                <Button variant="secondary">حفظ كمسودة</Button>
              </div>
            </Card>
          ) : (
            <Card className="bg-success-soft border-success-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success rounded-md grid place-items-center text-white">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="font-bold text-success">تم التسليم</div>
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    {task.mySubmissionStatus === 'pending'
                      ? 'بانتظار المراجعة من المسؤول'
                      : task.mySubmissionStatus === 'accepted'
                      ? 'تم قبول تقديمك ✓'
                      : 'تم رفض التقديم - راجع ملاحظات المسؤول'}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-5">
          <Card>
            <CardTitle className="mb-4">المسارات المرتبطة</CardTitle>
            <div className="flex flex-wrap gap-2">
              {task.tracks.map((track) => (
                <Badge key={track.id} variant="accent" className="px-3 py-1.5">
                  {track.name}
                </Badge>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">صيغ التسليم المقبولة</CardTitle>
            <div className="flex flex-col gap-3">
              {[
                { label: 'GitHub URL', required: false },
                { label: 'Live URL (Deployment)', required: false },
                { label: 'ملف (PDF/ZIP)', required: false },
                { label: 'فيديو', required: task.videoRequired },
              ].map((fmt) => (
                <div key={fmt.label} className="flex items-center gap-3">
                  <CheckCircle2
                    size={18}
                    className={fmt.required ? 'text-danger' : 'text-success'}
                  />
                  <span className={`text-sm ${fmt.required ? 'font-semibold' : ''}`}>
                    {fmt.label}
                    {fmt.required && (
                      <span className="text-danger mr-2">(إلزامي)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md text-xs text-ink-500">
              <strong>ملاحظة:</strong> صيغة واحدة على الأقل مطلوبة (غير الفيديو الإلزامي).
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">إحصائيات المهمة</CardTitle>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-ink-500">إجمالي الطلاب</span>
                <span className="font-bold">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-500">سلّموا</span>
                <span className="font-bold text-success">{task.submissionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-500">نسبة التسليم</span>
                <span className="font-bold">
                  {Math.round(((task.submissionsCount ?? 0) / 24) * 100)}%
                </span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}
